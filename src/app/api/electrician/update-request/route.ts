import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { REQUEST_STATUS } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const { requestId, electricianId, action } = await request.json();

        if (!requestId || !electricianId || !action) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Map action to status
        const actionToStatus: Record<string, string> = {
            'accept': REQUEST_STATUS.ACCEPTED,
            'decline': REQUEST_STATUS.CANCELLED,
            'complete': REQUEST_STATUS.SUCCESS,
            'cancel': REQUEST_STATUS.CANCELLED
        };

        const newStatus = actionToStatus[action.toLowerCase()];
        if (!newStatus) {
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Use: accept, decline, complete, or cancel'
            }, { status: 400 });
        }

        // Find the request row
        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const rowIndex = rows.findIndex((row: string[]) =>
            row[1] === requestId && row[3] === electricianId
        );

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Request not found or does not belong to this electrician'
            }, { status: 404 });
        }

        // Verify action is valid for current status
        const currentStatus = rows[rowIndex][10];

        if (action === 'accept' && currentStatus !== REQUEST_STATUS.NEW) {
            return NextResponse.json({
                success: false,
                error: 'Can only accept NEW requests'
            }, { status: 400 });
        }

        if (action === 'complete' && currentStatus !== REQUEST_STATUS.ACCEPTED) {
            return NextResponse.json({
                success: false,
                error: 'Can only complete ACCEPTED requests'
            }, { status: 400 });
        }

        // Update the status (column K = index 10, row number = rowIndex + 1 for 1-indexing)
        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 10, newStatus);

        return NextResponse.json({
            success: true,
            message: `Request ${action}ed successfully`,
            newStatus
        });

    } catch (error) {
        console.error('Update request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update request'
        }, { status: 500 });
    }
}
