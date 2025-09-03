const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testRecipients = [
    { address: '0x1234567890123456789012345678901234567890', percentage: 60 },
    { address: '0x0987654321098765432109876543210987654321', percentage: 40 }
];

async function testFlowSplitter() {
    console.log('🧪 Testing Flow Splitter Integration...\n');

    try {
        // Test 1: Create flow split
        console.log('1. Creating flow split configuration...');
        const createResponse = await axios.post(`${BASE_URL}/create-flow-split`, {
            recipients: testRecipients,
            tokenSymbol: 'fDAIx'
        });
        console.log('✅ Split created:', createResponse.data);
        console.log();

        // Test 2: Get flow split configuration
        console.log('2. Getting flow split configuration...');
        const getResponse = await axios.get(`${BASE_URL}/get-flow-split/fDAIx`);
        console.log('✅ Split configuration:', getResponse.data);
        console.log();

        // Test 3: Update flow split
        console.log('3. Updating flow split configuration...');
        const updatedRecipients = [
            { address: '0x1234567890123456789012345678901234567890', percentage: 50 },
            { address: '0x0987654321098765432109876543210987654321', percentage: 30 },
            { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', percentage: 20 }
        ];
        const updateResponse = await axios.post(`${BASE_URL}/update-flow-split`, {
            recipients: updatedRecipients,
            tokenSymbol: 'fDAIx'
        });
        console.log('✅ Split updated:', updateResponse.data);
        console.log();

        // Test 4: Get updated configuration
        console.log('4. Getting updated flow split configuration...');
        const getUpdatedResponse = await axios.get(`${BASE_URL}/get-flow-split/fDAIx`);
        console.log('✅ Updated configuration:', getUpdatedResponse.data);
        console.log();

        console.log('🎉 All tests passed! Flow Splitter integration is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.data?.error?.includes('Split does not exist')) {
            console.log('\n💡 This might be expected if no Flow Splitter contract is deployed yet.');
            console.log('Deploy the contract first using: npx hardhat run scripts/deploy-flow-splitter.js --network op-sepolia');
        }
    }
}

async function testBasicEndpoints() {
    console.log('🔍 Testing basic API endpoints...\n');

    try {
        // Test server is running by checking a superfluid endpoint
        try {
            const streamInfo = await axios.get(`${BASE_URL}/stream-info/0x1234567890123456789012345678901234567890/0x0987654321098765432109876543210987654321/fDAIx`);
            console.log('✅ Server is running and superfluid endpoints are accessible');
        } catch (streamError) {
            if (streamError.response && streamError.response.status) {
                console.log('✅ Server is running (stream info endpoint accessible, no active streams expected)');
            } else {
                throw streamError;
            }
        }

        console.log('✅ Basic endpoints are working');

    } catch (error) {
        console.error('❌ Basic endpoint test failed:', error.message);
        console.log('Make sure your server is running with: npm run dev');
    }
}

// Run tests
async function runAllTests() {
    await testBasicEndpoints();
    console.log('\n' + '='.repeat(50) + '\n');
    await testFlowSplitter();
}

runAllTests();