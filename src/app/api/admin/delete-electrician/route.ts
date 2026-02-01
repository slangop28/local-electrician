import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, deleteRow } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
    try {
        const { electricianId } = await request.json();

        if (!electricianId) {
            return NextResponse.json({
                success: false,
                error: 'Missing electricianId'
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

        // Delete the row (rowIndex + 1 for 1-based index)
        await deleteRow(SHEET_TABS.ELECTRICIANS, rowIndex + 1);

        return NextResponse.json({
            success: true,
            message: `Electrician ${electricianId} permanently deleted`
        });

    } catch (error) {
        console.error('Delete electrician error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to delete electrician'
        }, { status: 500 });
    }
}
