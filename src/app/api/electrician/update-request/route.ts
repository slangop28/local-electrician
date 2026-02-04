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
        // For BROADCAST requests, we validat on RequestID only first, then check ElectricianID
        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === requestId);

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Request not found'
            }, { status: 404 });
        }

        const requestRow = rows[rowIndex];
        const currentElectricianId = requestRow[3];
        const currentStatus = requestRow[10];

        // Case 1: Accepting a BROADCAST request
        if (currentElectricianId === 'BROADCAST') {
            if (action !== 'accept') {
                return NextResponse.json({
                    success: false,
                    error: 'Broadcast requests can only be accepted'
                }, { status: 400 });
            }

            if (currentStatus !== REQUEST_STATUS.NEW) {
                return NextResponse.json({
                    success: false,
                    error: 'Request is no longer available'
                }, { status: 400 });
            }

            // Assign to this electrician
            // Update ElectricianID (Column D = index 3)
            await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 3, electricianId);
            // Update Status (Column K = index 10)
            await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 10, REQUEST_STATUS.ACCEPTED);

            return NextResponse.json({
                success: true,
                message: 'Request accepted successfully',
                newStatus: REQUEST_STATUS.ACCEPTED
            });
        }

        // Case 2: Standard Flow (Request assigned to this electrician)
        if (currentElectricianId !== electricianId) {
            return NextResponse.json({
                success: false,
                error: 'Request does not belong to this electrician'
            }, { status: 403 });
        }

        // Verify action is valid for current status
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

        // Update the status (column K = index 10, row number = rowIndex + 1)
        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 10, newStatus);

        // If completing, save CompletedAt timestamp
        if (action === 'complete') {
            const headers = rows[0];
            let completedAtIndex = headers.indexOf('CompletedAt');

            if (completedAtIndex === -1) {
                // Add header if not exists
                completedAtIndex = headers.length; // Append to end
                await updateRow(SHEET_TABS.SERVICE_REQUESTS, 1, completedAtIndex, 'CompletedAt');
            }

            const timestamp = new Date().toISOString();
            await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, completedAtIndex, timestamp);
        }

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
