# Superfluid Flow Splitter Integration Guide

This guide explains how to use the Superfluid Flow Splitter integration on OP Sepolia testnet.

## Overview

The Flow Splitter allows you to automatically split incoming Superfluid streams to multiple recipients based on predefined percentages. When someone streams tokens to the Flow Splitter contract, it automatically distributes the flow to configured recipients.

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @superfluid-finance/ethereum-contracts
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# OP Sepolia RPC (or use the default)
ETH_PROVIDER_URL=https://sepolia.optimism.io

# Your private key (make sure it has OP Sepolia ETH)
PRIVATE_KEY=your_private_key_here

# Flow Splitter contract address (after deployment)
FLOW_SPLITTER_CONTRACT_ADDRESS=0x...

# Optional: For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Deploy Flow Splitter Contract

```bash
npx hardhat run scripts/deploy-flow-splitter.js --network op-sepolia
```

Copy the deployed contract address to your `.env` file.

## API Endpoints

### 1. Regular Stream Operations

#### Start Stream
```http
POST /start-stream
Content-Type: application/json

{
  "sender": "0x...",
  "receiver": "0x...",
  "flowRate": "1000000000000000", // 1 token per second in wei
  "tokenSymbol": "fDAIx" // optional, defaults to fDAIx
}
```

#### Stop Stream
```http
POST /stop-stream
Content-Type: application/json

{
  "sender": "0x...",
  "receiver": "0x...",
  "tokenSymbol": "fDAIx" // optional
}
```

### 2. Flow Splitter Operations

#### Create Flow Split Configuration
```http
POST /create-flow-split
Content-Type: application/json

{
  "recipients": [
    {
      "address": "0x1234...",
      "percentage": 60
    },
    {
      "address": "0x5678...",
      "percentage": 40
    }
  ],
  "tokenSymbol": "fDAIx" // optional
}
```

#### Update Flow Split Configuration
```http
POST /update-flow-split
Content-Type: application/json

{
  "recipients": [
    {
      "address": "0x1234...",
      "percentage": 50
    },
    {
      "address": "0x5678...",
      "percentage": 30
    },
    {
      "address": "0x9abc...",
      "percentage": 20
    }
  ],
  "tokenSymbol": "fDAIx"
}
```

#### Delete Flow Split Configuration
```http
POST /delete-flow-split
Content-Type: application/json

{
  "tokenSymbol": "fDAIx"
}
```

#### Get Flow Split Configuration
```http
GET /get-flow-split/fDAIx
```

#### Start Split Stream
```http
POST /start-split-stream
Content-Type: application/json

{
  "sender": "0x...",
  "flowRate": "1000000000000000", // This will be split according to configuration
  "tokenSymbol": "fDAIx"
}
```

#### Stop Split Stream
```http
POST /stop-split-stream
Content-Type: application/json

{
  "sender": "0x...",
  "tokenSymbol": "fDAIx"
}
```

### 3. Information Endpoints

#### Get Stream Info
```http
GET /stream-info/{sender}/{receiver}/{tokenSymbol}
```

#### Get Account Flow Info
```http
GET /account-flows/{account}/{tokenSymbol}
```

## Usage Examples

### Example 1: Basic Flow Splitting

1. **Create a split configuration:**
```bash
curl -X POST http://localhost:5000/create-flow-split \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"address": "0x1234567890123456789012345678901234567890", "percentage": 70},
      {"address": "0x0987654321098765432109876543210987654321", "percentage": 30}
    ],
    "tokenSymbol": "fDAIx"
  }'
```

2. **Start a split stream:**
```bash
curl -X POST http://localhost:5000/start-split-stream \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "0xYourAddress",
    "flowRate": "1000000000000000000",
    "tokenSymbol": "fDAIx"
  }'
```

Now the stream will automatically split: 70% to the first recipient, 30% to the second.

### Example 2: Revenue Sharing

```javascript
// Create a revenue sharing split
const revenueShare = {
  recipients: [
    { address: "0xFounder1", percentage: 40 },
    { address: "0xFounder2", percentage: 30 },
    { address: "0xTeam", percentage: 20 },
    { address: "0xTreasury", percentage: 10 }
  ],
  tokenSymbol: "fUSDCx"
};

// API call to create the split
fetch('/create-flow-split', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(revenueShare)
});
```

## Supported Tokens on OP Sepolia

- **fDAIx**: Fake DAI Super Token
- **fUSDCx**: Fake USDC Super Token

## Flow Rate Calculations

Flow rates are in wei per second. Here are some common conversions:

- 1 token/month ≈ `385802469135802` wei/second
- 1 token/day ≈ `11574074074074074` wei/second  
- 1 token/hour ≈ `277777777777777777` wei/second
- 1 token/second = `1000000000000000000` wei/second

## Testing on OP Sepolia

1. **Get test ETH**: Use the [OP Sepolia faucet](https://app.optimism.io/faucet)
2. **Get test tokens**: Use the [Superfluid faucet](https://app.superfluid.finance/faucet) for fDAIx and fUSDCx
3. **Test the integration**: Use the API endpoints to create splits and start streams

## Smart Contract Details

The Flow Splitter contract is a Superfluid SuperApp that:

- Automatically handles incoming streams via callbacks
- Splits flows based on configured percentages
- Supports multiple Super Tokens
- Allows dynamic reconfiguration of splits
- Handles edge cases like zero flows and recipient changes

## Security Considerations

- Only the contract owner can create/update/delete split configurations
- Percentages must always sum to exactly 100
- All recipient addresses are validated
- The contract includes emergency functions for flow management

## Troubleshooting

### Common Issues

1. **"Split does not exist"**: Create a split configuration first
2. **"Percentages must sum to 100"**: Ensure all percentages add up to exactly 100
3. **"Insufficient balance"**: Make sure you have enough Super Tokens and ETH for gas
4. **"Flow already exists"**: Use update flow instead of create flow

### Getting Help

- Check the transaction hash in the response for detailed error information
- Use OP Sepolia block explorer to investigate failed transactions
- Ensure your wallet has sufficient ETH for gas fees

## Advanced Features

### Batch Operations

You can combine multiple operations using Superfluid's batch call functionality:

```javascript
// Example: Create split and start stream in one transaction
const batchCall = sf.batchCall([
  // First create the split configuration
  // Then start the stream
]);
```

### Event Monitoring

The Flow Splitter contract emits events that you can monitor:

- `SplitCreated`: When a new split is configured
- `SplitUpdated`: When a split is modified
- `SplitDeleted`: When a split is removed
- `FlowSplit`: When a flow is distributed to recipients

### Integration with Frontend

```javascript
// Example React component for flow splitting
const FlowSplitter = () => {
  const [recipients, setRecipients] = useState([
    { address: '', percentage: 0 }
  ]);

  const createSplit = async () => {
    const response = await fetch('/create-flow-split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients, tokenSymbol: 'fDAIx' })
    });
    
    const result = await response.json();
    console.log('Split created:', result);
  };

  // UI components...
};
```

This integration provides a powerful way to automatically distribute Superfluid streams to multiple recipients, perfect for revenue sharing, team payments, or any scenario requiring automatic fund distribution.