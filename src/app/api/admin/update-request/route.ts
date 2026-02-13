import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { REQUEST_STATUS } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, status, electricianId, serviceType, urgency, preferredDate, preferredSlot, issueDetail } = body;

        if (!requestId) {
            return NextResponse.json({
                success: false,
                error: 'Missing requestId'
            }, { status: 400 });
        }

        // Validate status if provided
        if (status && !Object.values(REQUEST_STATUS).includes(status as keyof typeof REQUEST_STATUS)) {
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

        // Update Fields
        // Electrician ID (Index 3)
        if (electricianId) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 3, electricianId);

        // Service Type (Index 4)
        if (serviceType) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 4, serviceType);

        // Status (Index 5)
        if (status) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 5, status);

        // Urgency (Index 6)
        if (urgency) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 6, urgency);

        // Preferred Date (Index 7)
        if (preferredDate) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 7, preferredDate);

        // Preferred Slot (Index 8)
        if (preferredSlot) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 8, preferredSlot);

        // Issue Detail (Index 9)
        if (issueDetail) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 9, issueDetail);


        return NextResponse.json({
            success: true,
            message: `Request ${requestId} updated successfully`
        });

    } catch (error) {
        console.error('Update request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update status'
        }, { status: 500 });
    }
}
