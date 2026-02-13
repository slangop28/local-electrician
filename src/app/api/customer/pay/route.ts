import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

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
        const headers = rows[0] || [];
        const requestIdIdx = headers.indexOf('RequestID');
        const statusIdx = headers.indexOf('Status');

        if (requestIdIdx === -1 || statusIdx === -1) {
            return NextResponse.json({
                success: false,
                error: 'Required columns (RequestID or Status) not found in Google Sheets'
            }, { status: 500 });
        }

        const rowIndex = rows.findIndex((row: string[]) => row[requestIdIdx] === requestId);

        if (rowIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Request not found in Google Sheets'
            }, { status: 404 });
        }

        // 1. Update Supabase
        const { error: supabaseError } = await supabaseAdmin
            .from('service_requests')
            .update({ status: 'PAID' })
            .eq('request_id', requestId);

        if (supabaseError) {
            console.error('[PayAPI] Supabase update error:', supabaseError);
        }

        // 2. Update Google Sheets
        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, statusIdx, 'PAID');

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
