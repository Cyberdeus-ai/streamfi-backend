const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying FlowSplitter to OP Sepolia...");

    // OP Sepolia Superfluid Host address
    const SUPERFLUID_HOST_OP_SEPOLIA = "0xd399e2Fb5f4cf3722a11F65b88FAB6B2B8621005";

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Get the contract factory
    const FlowSplitter = await ethers.getContractFactory("FlowSplitter");

    // Deploy the contract
    console.log("Deploying contract...");
    const flowSplitter = await FlowSplitter.deploy(SUPERFLUID_HOST_OP_SEPOLIA);

    console.log("Waiting for deployment...");
    await flowSplitter.deployed();

    console.log("FlowSplitter deployed to:", flowSplitter.address);
    console.log("Superfluid Host:", SUPERFLUID_HOST_OP_SEPOLIA);
    console.log("Transaction hash:", flowSplitter.deployTransaction.hash);
    
    // Wait for a few block confirmations
    console.log("Waiting for block confirmations...");
    await flowSplitter.deployTransaction.wait(3);
    
    console.log("Deployment completed!");
    console.log("\nAdd this to your .env file:");
    console.log(`FLOW_SPLITTER_CONTRACT_ADDRESS=${flowSplitter.address}`);
    
    console.log("\nContract deployed successfully!");
    console.log("You can now use the Flow Splitter API endpoints.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });