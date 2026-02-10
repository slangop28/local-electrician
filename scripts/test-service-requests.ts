// Test script to debug service request data flow
// Run with: npx ts-node --skip-project scripts/test-service-requests.ts

const testServiceRequests = async () => {
    const baseUrl = 'http://localhost:3000';

    console.log('='.repeat(60));
    console.log('SERVICE REQUEST DEBUG TEST');
    console.log('='.repeat(60));

    // Test 1: Check if customer history API works
    const testPhone = '9876543210'; // Replace with your actual phone number

    console.log('\n📞 Testing with phone:', testPhone);

    try {
        // Test customer history endpoint
        console.log('\n--- Testing /api/customer/history ---');
        const historyRes = await fetch(`${baseUrl}/api/customer/history?phone=${testPhone}`);
        const historyData = await historyRes.json();
        console.log('History API Response:', JSON.stringify(historyData, null, 2));

        if (historyData.success && historyData.requests?.length > 0) {
            console.log(`✅ Found ${historyData.requests.length} service requests`);

            // Test service request details endpoint
            const requestId = historyData.requests[0].requestId;
            console.log('\n--- Testing /api/service-request/' + requestId + ' ---');
            const detailsRes = await fetch(`${baseUrl}/api/service-request/${requestId}`);
            const detailsData = await detailsRes.json();
            console.log('Details API Response:', JSON.stringify(detailsData, null, 2));
        } else {
            console.log('❌ No service requests found for this phone');
            console.log('\nPossible issues:');
            console.log('1. Phone number doesn\'t match any customer in CUSTOMERS sheet');
            console.log('2. No SERVICE_REQUESTS exist for this customer');
            console.log('3. CustomerID mismatch between CUSTOMERS and SERVICE_REQUESTS');
        }

        // Test active request endpoint
        console.log('\n--- Testing /api/customer/active-request ---');
        const activeRes = await fetch(`${baseUrl}/api/customer/active-request?customerId=${testPhone}`);
        const activeData = await activeRes.json();
        console.log('Active Request API Response:', JSON.stringify(activeData, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
};

testServiceRequests();
