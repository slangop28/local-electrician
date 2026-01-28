import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { ELECTRICIAN_STATUS } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const { electricianId, status } = await request.json();

        if (!electricianId || !status) {
            return NextResponse.json({
                success: false,
                error: 'Missing electricianId or status'
            }, { status: 400 });
        }

        // Validate status
        if (!Object.values(ELECTRICIAN_STATUS).includes(status as keyof typeof ELECTRICIAN_STATUS)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid status'
            }, { status: 400 });
        }

        // Find the electrician row
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === electricianId);

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Electrician not found'
            }, { status: 404 });
        }

        // Update the status (column S = index 18, row number = rowIndex + 1 for 1-indexing)
        await updateRow(SHEET_TABS.ELECTRICIANS, rowIndex + 1, 18, status);

        return NextResponse.json({
            success: true,
            message: `Electrician ${electricianId} status updated to ${status}`
        });

    } catch (error) {
        console.error('Update KYC error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update status'
        }, { status: 500 });
    }
}
