import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
    try {
        const { electricianId, status } = await request.json();

        if (!electricianId || !status) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        const rows = await getRows(SHEET_TABS.BANK_DETAILS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === electricianId);

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Bank details not found'
            }, { status: 404 });
        }

        // Update status (Column F = index 5)
        await updateRow(SHEET_TABS.BANK_DETAILS, rowIndex + 1, 5, status);

        return NextResponse.json({
            success: true,
            message: `Bank details ${status.toLowerCase()}`
        });

    } catch (error) {
        console.error('Verify bank error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to verify bank details'
        }, { status: 500 });
    }
}
