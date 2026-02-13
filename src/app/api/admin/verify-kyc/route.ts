import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow, appendRow, ensureSheet } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';
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

        // Find the electrician row in Google Sheets
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === electricianId);

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Electrician not found'
            }, { status: 404 });
        }

        // Update the status in Google Sheets (column S = index 18, row number = rowIndex + 1 for 1-indexing)
        await updateRow(SHEET_TABS.ELECTRICIANS, rowIndex + 1, 18, status);

        // Also update in Supabase to keep data in sync
        try {
            // Supabase types updated
            const { error: updateError } = await supabaseAdmin
                .from('electricians')
                .update({ status })
                .eq('electrician_id', electricianId);

            if (updateError) {
                console.error('Failed to update status in Supabase:', updateError);
                // Don't fail the whole request if Supabase update fails
            }
        } catch (supaErr) {
            console.error('Supabase update error:', supaErr);
            // Continue anyway as we've already updated Google Sheets
        }

        // If status is VERIFIED, copy to Verified Technicians sheet
        if (status === 'VERIFIED') {
            await ensureSheet(SHEET_TABS.VERIFIED_TECHNICIANS);
            const rowData = rows[rowIndex];
            // Columns: Timestamp, ElectricianID, Name, Phone, City, Area, State
            // Adjust based on your actual sheet structure
            // Assuming we copy the whole row or specific important fields
            // Let's copy the entire row for full record
            await appendRow(SHEET_TABS.VERIFIED_TECHNICIANS, rowData);
        }

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
