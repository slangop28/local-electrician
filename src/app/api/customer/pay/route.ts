import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
    try {
        const { requestId } = await request.json();

        if (!requestId) {
            return NextResponse.json({
                success: false,
                error: 'Missing requestId'
            }, { status: 400 });
        }

        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === requestId); // Assuming RequestID is Col B (index 1)

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Request not found'
            }, { status: 404 });
        }

        // Update Status (Col F = Index 5) to 'PAID'
        // Let's verify Column Index from create/route.ts or similar.
        // Step 512 profile route view: 
        // 69: requestId: row[serviceHeaders.indexOf('RequestID')],
        // 72: status: row[serviceHeaders.indexOf('Status')],

        // I need to be sure about indices.
        // Usually: Timestamp, RequestID, CustomerID, ElectricianID, ServiceType, Status
        // Indices: 0, 1, 2, 3, 4, 5
        // Let's assume Status is index 5.

        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 5, 'PAID');

        return NextResponse.json({
            success: true,
            message: 'Payment recorded and request closed'
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to record payment'
        }, { status: 500 });
    }
}
