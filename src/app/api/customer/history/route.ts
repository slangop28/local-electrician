import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // First, find the customer ID by phone
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const customerHeaders = customerRows[0] || [];
        const customerPhoneIndex = customerHeaders.indexOf('Phone');
        const customerIdIndex = customerHeaders.indexOf('CustomerID');

        let customerId = null;
        for (let i = 1; i < customerRows.length; i++) {
            if (customerRows[i][customerPhoneIndex] === phone) {
                customerId = customerRows[i][customerIdIndex];
                break;
            }
        }

        if (!customerId) {
            // No customer record found, return empty history
            return NextResponse.json({
                success: true,
                requests: []
            });
        }

        // Get service requests for this customer
        const serviceRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const serviceHeaders = serviceRows[0] || [];

        const requests = [];
        const completedAtIndex = serviceHeaders.indexOf('CompletedAt');
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        for (let i = 1; i < serviceRows.length; i++) {
            const row = serviceRows[i];
            if (row[serviceHeaders.indexOf('CustomerID')] === customerId) {
                requests.push({
                    requestId: row[serviceHeaders.indexOf('RequestID')],
                    electricianId: row[serviceHeaders.indexOf('ElectricianID')],
                    serviceType: row[serviceHeaders.indexOf('ServiceType')],
                    status: row[serviceHeaders.indexOf('Status')],
                    preferredDate: row[serviceHeaders.indexOf('PreferredDate')],
                    preferredSlot: row[serviceHeaders.indexOf('PreferredSlot')],
                    // Filter out completed requests older than 1 hour
                    if(row[serviceHeaders.indexOf('Status')] === 'SUCCESS') {
                    const completedAt = completedAtIndex !== -1 ? row[completedAtIndex] : null;
                    // If no timestamp, maybe assume it's old? Or keep it? 
                    // User said "1 hr after payment and completion". 
                    // Let's assume if no timestamp, it's very old or just migrated. 
                    // For now, if no timestamp, we'll hide it if it's SUCCESS to be safe, or show it? 
                    // Let's show it if NO timestamp (legacy), but filter if timestamp exists. 
                    // Actually, if we just implemented this, old requests won't have it.
                    // Better to hide if we can't verify. But that might hide all history. 
                    // Let's filter ONLY if we have a timestamp and it's old.

                    if (completedAt) {
                        const completedTime = new Date(completedAt).getTime();
                        if (completedTime < oneHourAgo) {
                            continue; // Skip this request
                        }
                    }
                }

                requests.push({
                    requestId: row[serviceHeaders.indexOf('RequestID')],
                    electricianId: row[serviceHeaders.indexOf('ElectricianID')],
                    serviceType: row[serviceHeaders.indexOf('ServiceType')],
                    status: row[serviceHeaders.indexOf('Status')],
                    preferredDate: row[serviceHeaders.indexOf('PreferredDate')],
                    preferredSlot: row[serviceHeaders.indexOf('PreferredSlot')],
                    timestamp: row[serviceHeaders.indexOf('Timestamp')],
                    rating: row[serviceHeaders.indexOf('Rating')] || undefined
                });
            }
        }

        // Sort by timestamp descending (most recent first)
        requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Get customer history error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get service history' },
            { status: 500 }
        );
    }
}
