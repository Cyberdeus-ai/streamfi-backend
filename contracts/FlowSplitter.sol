// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ISuperfluid, ISuperToken, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

/**
 * @title FlowSplitter
 * @dev A Superfluid SuperApp that automatically splits incoming streams to multiple recipients
 * based on predefined percentages.
 */
contract FlowSplitter is SuperAppBase {
    using SuperTokenV1Library for ISuperToken;

    // Superfluid framework components
    ISuperfluid private _host;
    IConstantFlowAgreementV1 private _cfa;

    // Events
    event SplitCreated(address indexed superToken, address[] recipients, uint256[] percentages);
    event SplitUpdated(address indexed superToken, address[] recipients, uint256[] percentages);
    event SplitDeleted(address indexed superToken);
    event FlowSplit(address indexed superToken, address indexed sender, int96 totalFlowRate);

    // Struct to store split configuration
    struct SplitConfig {
        address[] recipients;
        uint256[] percentages; // Percentages out of 100
        bool exists;
    }

    // Mapping from SuperToken to split configuration
    mapping(address => SplitConfig) public splits;

    // Owner of the contract
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(ISuperfluid host) {
        require(address(host) != address(0), "Host cannot be zero address");
        
        _host = host;
        _cfa = IConstantFlowAgreementV1(
            address(_host.getAgreementClass(keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1")))
        );
        owner = msg.sender;

        // Register the app with Superfluid
        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }

    /**
     * @dev Create a new split configuration for a SuperToken
     * @param superToken The SuperToken to configure splits for
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages (must sum to 100)
     */
    function createSplit(
        address superToken,
        address[] memory recipients,
        uint256[] memory percentages
    ) external onlyOwner {
        require(recipients.length > 0, "Must have at least one recipient");
        require(recipients.length == percentages.length, "Recipients and percentages length mismatch");
        require(!splits[superToken].exists, "Split already exists for this token");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            require(percentages[i] > 0, "Percentage must be greater than 0");
            require(recipients[i] != address(0), "Recipient cannot be zero address");
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");

        splits[superToken] = SplitConfig({
            recipients: recipients,
            percentages: percentages,
            exists: true
        });

        emit SplitCreated(superToken, recipients, percentages);
    }

    /**
     * @dev Update an existing split configuration
     * @param superToken The SuperToken to update splits for
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages (must sum to 100)
     */
    function updateSplit(
        address superToken,
        address[] memory recipients,
        uint256[] memory percentages
    ) external onlyOwner {
        require(recipients.length > 0, "Must have at least one recipient");
        require(recipients.length == percentages.length, "Recipients and percentages length mismatch");
        require(splits[superToken].exists, "Split does not exist for this token");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            require(percentages[i] > 0, "Percentage must be greater than 0");
            require(recipients[i] != address(0), "Recipient cannot be zero address");
            totalPercentage += percentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");

        // Delete existing flows to old recipients
        _deleteExistingFlows(superToken);

        // Update configuration
        splits[superToken].recipients = recipients;
        splits[superToken].percentages = percentages;

        emit SplitUpdated(superToken, recipients, percentages);
    }

    /**
     * @dev Delete a split configuration
     * @param superToken The SuperToken to delete splits for
     */
    function deleteSplit(address superToken) external onlyOwner {
        require(splits[superToken].exists, "Split does not exist for this token");
        
        // Delete existing flows
        _deleteExistingFlows(superToken);
        
        delete splits[superToken];
        emit SplitDeleted(superToken);
    }

    /**
     * @dev Get split configuration for a SuperToken
     * @param superToken The SuperToken to get configuration for
     * @return recipients Array of recipient addresses
     * @return percentages Array of percentages
     */
    function getSplitConfiguration(address superToken) 
        external 
        view 
        returns (address[] memory recipients, uint256[] memory percentages) 
    {
        require(splits[superToken].exists, "Split does not exist for this token");
        return (splits[superToken].recipients, splits[superToken].percentages);
    }

    /**
     * @dev Manually distribute flow (usually called automatically via callbacks)
     * @param superToken The SuperToken to distribute
     * @param totalFlowRate The total flow rate to distribute
     */
    function distributeFlow(address superToken, int96 totalFlowRate) external {
        require(splits[superToken].exists, "Split does not exist for this token");
        _distributeFlow(ISuperToken(superToken), totalFlowRate);
    }

    /**
     * @dev Internal function to distribute flow to recipients
     */
    function _distributeFlow(ISuperToken superToken, int96 totalFlowRate) internal {
        SplitConfig storage config = splits[address(superToken)];
        
        for (uint256 i = 0; i < config.recipients.length; i++) {
            int96 recipientFlowRate = (totalFlowRate * int96(int256(config.percentages[i]))) / 100;
            
            if (recipientFlowRate > 0) {
                // Check if flow already exists
                int96 currentFlowRate = superToken.getFlowRate(address(this), config.recipients[i]);
                
                if (currentFlowRate == 0) {
                    // Create new flow
                    superToken.createFlow(config.recipients[i], recipientFlowRate);
                } else if (currentFlowRate != recipientFlowRate) {
                    // Update existing flow
                    superToken.updateFlow(config.recipients[i], recipientFlowRate);
                }
            }
        }

        emit FlowSplit(address(superToken), msg.sender, totalFlowRate);
    }

    /**
     * @dev Delete existing flows to all recipients
     */
    function _deleteExistingFlows(address superToken) internal {
        SplitConfig storage config = splits[superToken];
        ISuperToken token = ISuperToken(superToken);
        
        for (uint256 i = 0; i < config.recipients.length; i++) {
            // Check if flow exists before trying to delete
            int96 currentFlowRate = token.getFlowRate(address(this), config.recipients[i]);
            if (currentFlowRate > 0) {
                token.deleteFlow(address(this), config.recipients[i]);
            }
        }
    }

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    /**
     * @dev Callback when a flow is created to this contract
     */
    function afterAgreementCreated(
        ISuperToken superToken,
        address agreementClass,
        bytes32, // agreementId
        bytes calldata, // agreementData
        bytes calldata, // cbdata
        bytes calldata ctx
    ) external override returns (bytes memory newCtx) {
        require(msg.sender == address(_host), "Only host can call this");
        require(agreementClass == address(_cfa), "Only CFA supported");
        return _updateOutflow(superToken, ctx);
    }

    /**
     * @dev Callback when a flow to this contract is updated
     */
    function afterAgreementUpdated(
        ISuperToken superToken,
        address agreementClass,
        bytes32, // agreementId
        bytes calldata, // agreementData
        bytes calldata, // cbdata
        bytes calldata ctx
    ) external override returns (bytes memory newCtx) {
        require(msg.sender == address(_host), "Only host can call this");
        require(agreementClass == address(_cfa), "Only CFA supported");
        return _updateOutflow(superToken, ctx);
    }

    /**
     * @dev Callback when a flow to this contract is terminated
     */
    function afterAgreementTerminated(
        ISuperToken superToken,
        address agreementClass,
        bytes32, // agreementId
        bytes calldata, // agreementData
        bytes calldata, // cbdata
        bytes calldata ctx
    ) external override returns (bytes memory newCtx) {
        require(msg.sender == address(_host), "Only host can call this");
        return _updateOutflow(superToken, ctx);
    }

    /**
     * @dev Update outflows based on current inflow
     */
    function _updateOutflow(ISuperToken superToken, bytes calldata ctx) private returns (bytes memory newCtx) {
        newCtx = ctx;
        
        if (!splits[address(superToken)].exists) {
            return newCtx;
        }

        // Get current net flow rate for this contract
        int96 netFlowRate = superToken.getNetFlowRate(address(this));
        
        if (netFlowRate > 0) {
            // Distribute the incoming flow
            _distributeFlow(superToken, netFlowRate);
        } else {
            // No incoming flow, delete all outgoing flows
            _deleteExistingFlows(address(superToken));
        }

        return newCtx;
    }

    /**
     * @dev Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    /**
     * @dev Emergency function to delete all flows for a token
     */
    function emergencyDeleteFlows(address superToken) external onlyOwner {
        _deleteExistingFlows(superToken);
    }
}