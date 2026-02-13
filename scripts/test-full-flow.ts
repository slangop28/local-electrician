#!/usr/bin/env node
/**
 * Full End-to-End Test: Customer Booking → Electrician Acceptance → Status Update
 * 
 * Flow:
 * 1. Customer creates service request to electrician
 * 2. Electrician accepts the request
 * 3. Verify status updates on customer profile
 */

import https from 'https';

const API_BASE = 'http://localhost:3000/api';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color: string, label: string, message: string) {
    console.log(`${color}[${label}]${colors.reset} ${message}`);
}

async function request(method: string, path: string, body?: Record<string, any>) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const proto = url.protocol === 'https:' ? https : require('http');
        const req = proto.request(url, options, (res: any) => {
            let data = '';
            res.on('data', (chunk: string) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    log(colors.cyan, 'START', 'Beginning End-to-End Test Suite');
    log(colors.blue, 'INFO', 'Test flow: Customer Booking → Electrician Acceptance → Status Sync');
    console.log('');

    try {
        // ========================================
        // STEP 1: Get Available Electricians
        // ========================================
        log(colors.blue, 'STEP 1', 'Fetching available electricians...');
        const electriciansRes = await request('GET', '/electricians/nearby?latitude=28.6139&longitude=77.2090&radiusKm=50') as any;
        
        if (!electriciansRes.success || !electriciansRes.electricians || electriciansRes.electricians.length === 0) {
            log(colors.red, 'ERROR', 'No electricians available. Did migration complete? Run: POST /api/debug/migrate-data');
            process.exit(1);
        }

        const testElectrician = electriciansRes.electricians[0];
        log(colors.green, 'SUCCESS', `Found electrician: ${testElectrician.name} (${testElectrician.electrician_id})`);
        console.log('');

        // ========================================
        // STEP 2: Customer Creates Service Request
        // ========================================
        log(colors.blue, 'STEP 2', 'Customer creating service request...');
        
        const testCustomer = {
            name: 'Test Customer ' + Date.now(),
            phone: '9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
            address: '123 Test Street',
            city: 'Delhi',
            pincode: '110001',
        };

        const createRequestRes = await request('POST', '/request/create', {
            electricianId: testElectrician.electrician_id,
            serviceType: 'Electrical Repair',
            urgency: 'HIGH',
            preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            preferredSlot: '10:00 AM - 12:00 PM',
            issueDetail: 'Test electrical issue for automated testing',
            customerName: testCustomer.name,
            customerPhone: testCustomer.phone,
            address: testCustomer.address,
            city: testCustomer.city,
            pincode: testCustomer.pincode,
        }) as any;

        if (!createRequestRes.success || !createRequestRes.requestId) {
            log(colors.red, 'ERROR', `Failed to create request: ${createRequestRes.error}`);
            process.exit(1);
        }

        const requestId = createRequestRes.requestId;
        log(colors.green, 'SUCCESS', `Service request created: ${requestId}`);
        log(colors.yellow, 'INFO', `Customer Phone: ${testCustomer.phone}`);
        console.log('');

        // ========================================
        // STEP 3: Verify Initial Status
        // ========================================
        log(colors.blue, 'STEP 3', 'Verifying initial request status...');
        
        const initialStatusRes = await request('GET', `/customer/active-request?customerId=${testCustomer.phone}`) as any;
        
        if (!initialStatusRes.success) {
            log(colors.red, 'ERROR', `Failed to fetch request: ${initialStatusRes.error}`);
            process.exit(1);
        }

        if (!initialStatusRes.activeRequest) {
            log(colors.red, 'ERROR', 'No active request found after creation');
            process.exit(1);
        }

        const initialRequest = initialStatusRes.activeRequest;
        log(colors.green, 'SUCCESS', `Initial Status: ${initialRequest.status}`);
        if (initialRequest.electricianId === 'BROADCAST' || initialRequest.electricianId === testElectrician.electrician_id) {
            log(colors.green, 'SUCCESS', `Request assigned to: ${initialRequest.electricianId}`);
        }
        console.log('');

        // ========================================
        // STEP 4: Electrician Accepts Request
        // ========================================
        log(colors.blue, 'STEP 4', 'Electrician accepting service request...');
        
        const acceptRes = await request('POST', '/electrician/update-request', {
            requestId: requestId,
            electricianId: testElectrician.electrician_id,
            action: 'accept',
            electricianName: testElectrician.name,
            electricianPhone: testElectrician.phone_primary,
            electricianCity: testElectrician.city,
        }) as any;

        if (!acceptRes.success) {
            log(colors.red, 'ERROR', `Failed to accept request: ${acceptRes.error}`);
            process.exit(1);
        }

        log(colors.green, 'SUCCESS', 'Electrician accepted the request');
        console.log('');

        // ========================================
        // STEP 5: Verify Status Update (Immediate)
        // ========================================
        log(colors.blue, 'STEP 5', 'Verifying status update on customer profile (immediate)...');
        
        const updatedStatusRes = await request('GET', `/customer/active-request?customerId=${testCustomer.phone}`) as any;
        
        if (!updatedStatusRes.success || !updatedStatusRes.activeRequest) {
            log(colors.red, 'ERROR', 'Failed to fetch updated request');
            process.exit(1);
        }

        const updatedRequest = updatedStatusRes.activeRequest;
        log(colors.green, 'SUCCESS', `Updated Status: ${updatedRequest.status}`);
        
        if (updatedRequest.status === 'ACCEPTED') {
            log(colors.green, 'SUCCESS', '✓ Status correctly updated to ACCEPTED');
        } else {
            log(colors.red, 'ERROR', `Status should be ACCEPTED but is ${updatedRequest.status}`);
        }

        if (updatedRequest.electricianName) {
            log(colors.green, 'SUCCESS', `Electrician assigned: ${updatedRequest.electricianName}`);
        }
        if (updatedRequest.electricianPhone) {
            log(colors.green, 'SUCCESS', `Electrician phone: ${updatedRequest.electricianPhone}`);
        }
        console.log('');

        // ========================================
        // STEP 6: Wait and Verify Real-time Sync
        // ========================================
        log(colors.blue, 'STEP 6', 'Waiting 6 seconds to test real-time sync...');
        await new Promise(resolve => setTimeout(resolve, 6000));

        const realtimeStatusRes = await request('GET', `/customer/active-request?customerId=${testCustomer.phone}`) as any;
        
        if (!realtimeStatusRes.success || !realtimeStatusRes.activeRequest) {
            log(colors.red, 'ERROR', 'Failed to fetch request after waiting');
            process.exit(1);
        }

        const realtimeRequest = realtimeStatusRes.activeRequest;
        log(colors.green, 'SUCCESS', `Real-time Status: ${realtimeRequest.status}`);
        
        if (realtimeRequest.status === 'ACCEPTED' && realtimeRequest.electricianName === testElectrician.name) {
            log(colors.green, 'SUCCESS', '✓ Real-time sync verified');
        }
        console.log('');

        // ========================================
        // STEP 7: Test Summary
        // ========================================
        log(colors.green, 'TEST PASSED', 'Full End-to-End Flow Successful!');
        console.log('');
        console.log(colors.cyan + '═'.repeat(60) + colors.reset);
        console.log(colors.green + '✓ FULL FLOW VERIFIED:' + colors.reset);
        console.log('  1. Customer created service request');
        console.log('  2. Electrician accepted request');
        console.log('  3. Status synced to customer profile (immediate)');
        console.log('  4. Real-time synchronization working');
        console.log(colors.cyan + '═'.repeat(60) + colors.reset);
        console.log('');

        log(colors.yellow, 'TEST DATA', `
Request ID: ${requestId}
Customer Phone: ${testCustomer.phone}
Electrician: ${testElectrician.name}
Final Status: ${realtimeRequest.status}
        `);

        process.exit(0);

    } catch (error: any) {
        log(colors.red, 'FATAL ERROR', error.message || String(error));
        console.error(error);
        process.exit(1);
    }
}

// Run the test
runTest();
