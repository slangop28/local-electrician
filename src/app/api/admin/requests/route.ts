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
            serviceType: row[4] || '',
            urgency: row[5] || '',
            preferredDate: row[6] || '',
            preferredSlot: row[7] || '',
            issueDetail: row[8] || '',
            status: row[10] || 'NEW',
            timestamp: row[0] || '',
        }));

        return NextResponse.json({ success: true, requests });

    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch requests'
        }, { status: 500 });
    }
}
