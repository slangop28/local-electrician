import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { REQUEST_STATUS, getTimestamp } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

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

        // ===== 1. Update Supabase (primary) =====
        try {
            // Read current request from Supabase
            const { data: supaRequest } = await supabaseAdmin
                .from('service_requests')
                .select('*')
                .eq('request_id', requestId)
                .single();

            if (supaRequest) {
                const currentElectricianId = supaRequest.electrician_id;
                const currentStatus = supaRequest.status;

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

                    // Assign to this electrician in Supabase
                    await supabaseAdmin
                        .from('service_requests')
                        .update({
                            electrician_id: electricianId,
                            status: REQUEST_STATUS.ACCEPTED
                        })
                        .eq('request_id', requestId);

                    // Log acceptance
                    await supabaseAdmin.from('service_request_logs').insert({
                        request_id: requestId,
                        status: REQUEST_STATUS.ACCEPTED,
                        description: `Request accepted by electrician ${electricianId}`
                    });

                } else {
                    // Case 2: Standard flow
                    if (currentElectricianId !== electricianId) {
                        return NextResponse.json({
                            success: false,
                            error: 'Request does not belong to this electrician'
                        }, { status: 403 });
                    }

                    const updateData: Record<string, string> = { status: newStatus };
                    if (action === 'complete') {
                        updateData.completed_at = new Date().toISOString();
                    }

                    await supabaseAdmin
                        .from('service_requests')
                        .update(updateData)
                        .eq('request_id', requestId);

                    // Log status change
                    await supabaseAdmin.from('service_request_logs').insert({
                        request_id: requestId,
                        status: newStatus,
                        description: `Status updated to ${newStatus}`
                    });
                }
            }
        } catch (supaErr) {
            console.error('[UpdateRequest] Supabase error:', supaErr);
        }

        // ===== 2. Update Google Sheets (secondary) =====
        try {
            const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
            const rowIndex = rows.findIndex((row: string[]) => row[1] === requestId);

            if (rowIndex !== -1) {
                const requestRow = rows[rowIndex];
                const currentElectricianId = requestRow[3];

                if (currentElectricianId === 'BROADCAST' && action === 'accept') {
                    await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 3, electricianId);
                    await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 5, REQUEST_STATUS.ACCEPTED);
                } else {
                    await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, 5, newStatus);

                    if (action === 'complete') {
                        const headers = rows[0];
                        let completedAtIndex = headers.indexOf('CompletedAt');
                        if (completedAtIndex === -1) {
                            completedAtIndex = headers.length;
                            await updateRow(SHEET_TABS.SERVICE_REQUESTS, 1, completedAtIndex, 'CompletedAt');
                        }
                        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex + 1, completedAtIndex, new Date().toISOString());
                    }
                }
            }
        } catch (sheetsErr) {
            console.error('[UpdateRequest] Google Sheets error:', sheetsErr);
        }

        return NextResponse.json({
            success: true,
            message: `Request ${action}ed successfully`,
            newStatus: action === 'accept' && newStatus === REQUEST_STATUS.ACCEPTED ? REQUEST_STATUS.ACCEPTED : newStatus
        });

    } catch (error) {
        console.error('Update request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update request'
        }, { status: 500 });
    }
}
