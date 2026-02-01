import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        }

        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);

        // Rows: Timestamp, RequestID, CustomerID, ElectricianID, ServiceType, Status, ...
        // Filter rows for this customer
        const customerRequests = rows.slice(1).filter((row: string[]) => row[2] === customerId);

        if (customerRequests.length === 0) {
            return NextResponse.json({ success: true, activeRequest: null });
        }

        // Sort by timestamp descending (assuming timestamp is Col A / index 0)
        // Timestamp format might be ISO string
        customerRequests.sort((a: string[], b: string[]) => {
            return new Date(b[0]).getTime() - new Date(a[0]).getTime();
        });

        const latestRequest = customerRequests[0];

        // Request Object
        const requestData = {
            requestId: latestRequest[1],
            customerId: latestRequest[2],
            electricianId: latestRequest[3],
            serviceType: latestRequest[4],
            status: latestRequest[5],
            timestamp: latestRequest[0],
            // Additional fields if needed
        };

        return NextResponse.json({ success: true, activeRequest: requestData });

    } catch (error) {
        console.error('Fetch active request error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch request' }, { status: 500 });
    }
}
