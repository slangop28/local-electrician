import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { REQUEST_STATUS } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const { requestId, status } = await request.json();

        if (!requestId || !status) {
            return NextResponse.json({
                success: false,
                error: 'Missing requestId or status'
            }, { status: 400 });
        }

        // Validate status
        if (!Object.values(REQUEST_STATUS).includes(status as keyof typeof REQUEST_STATUS)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid status'
            }, { status: 400 });
        }

        // Find the request row
        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === requestId);

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Request not found'
            }, { status: 404 });
        }

        // Update the status (column K = index 10, row number = rowIndex + 1 for 1-indexing)
        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 10, status);

        return NextResponse.json({
            success: true,
            message: `Request ${requestId} status updated to ${status}`
        });

    } catch (error) {
        console.error('Update request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update status'
        }, { status: 500 });
    }
}
