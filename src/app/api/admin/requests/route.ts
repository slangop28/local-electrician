import { NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET() {
    try {
        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);

        if (rows.length <= 1) {
            return NextResponse.json({ success: true, requests: [] });
        }

        // Map rows to request objects
        // Columns: Timestamp, RequestID, CustomerID, ElectricianID, ServiceType, 
        // Urgency, PreferredDate, PreferredSlot, IssueDetail, IssuePhotoURL, Status
        const requests = rows.slice(1).map((row: string[]) => ({
            id: row[1] || '',
            customerId: row[2] || '',
            electricianId: row[3] || '',
            customerName: '', // Will be populated
            electricianName: '', // Will be populated
            serviceType: row[4] || '',
            urgency: row[5] || '',
            preferredDate: row[6] || '',
            preferredSlot: row[7] || '',
            issueDetail: row[8] || '',
            status: row[10] || 'NEW',
            timestamp: row[0] || '',
        }));

        // Fetch Customers and Electricians to map IDs to Names
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);

        // Create Maps
        const customerMap = new Map<string, string>();
        if (customerRows.length > 1) {
            const headers = customerRows[0];
            const idIndex = headers.indexOf('CustomerID');
            const nameIndex = headers.indexOf('Name');
            if (idIndex !== -1 && nameIndex !== -1) {
                customerRows.slice(1).forEach(row => {
                    if (row[idIndex]) customerMap.set(row[idIndex], row[nameIndex] || 'Unknown');
                });
            }
        }

        const electricianMap = new Map<string, string>();
        if (electricianRows.length > 1) {
            const headers = electricianRows[0];
            const idIndex = headers.indexOf('ElectricianID');
            const nameIndex = headers.indexOf('Name');
            if (idIndex !== -1 && nameIndex !== -1) {
                electricianRows.slice(1).forEach(row => {
                    if (row[idIndex]) electricianMap.set(row[idIndex], row[nameIndex] || 'Unknown');
                });
            }
        }

        // Attach names
        requests.forEach(req => {
            req.customerName = customerMap.get(req.customerId) || req.customerId;
            req.electricianName = electricianMap.get(req.electricianId) || req.electricianId;
        });

        return NextResponse.json({ success: true, requests });

    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch requests'
        }, { status: 500 });
    }
}
