const fetch = require('node-fetch');

async function verify() {
    try {
        // 1. Create Request
        console.log('Creating Broadcast Request...');
        const createRes = await fetch('http://localhost:3000/api/request/create-broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serviceType: 'Test Fix',
                urgency: 'High',
                preferredDate: '2025-01-01',
                preferredSlot: 'Morning',
                issueDetail: 'Testing column mapping',
                customerName: 'Test User',
                customerPhone: '9998887776',
                address: 'Test Address',
                city: 'TestCity', // Distinct city
                pincode: '123456',
                lat: 10,
                lng: 10
            })
        });
        const createData = await createRes.json();
        console.log('Create Result:', createData);

        if (!createData.success) return;

        // 2. Check Debug API
        console.log('Checking Debug API...');
        // Pass t=N to avoid cache
        const debugRes = await fetch(`http://localhost:3000/api/debug-broadcast?city=TestCity&t=${Date.now()}`);
        const debugData = await debugRes.json();

        // Find our request
        const found = debugData.allRequests.find(r => r.requestId === createData.requestId);
        if (found) {
            console.log('Found Request in Sheet:', found);
            if (found.status === 'NEW' && found.electricianId === 'BROADCAST') {
                console.log('SUCCESS: Request matches expected status and ID.');
            } else {
                console.log('FAILURE: Request fields mismatch.');
            }
        } else {
            console.log('FAILURE: Request not found in sheet.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

verify();
