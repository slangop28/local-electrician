import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow } from '@/lib/google-sheets';
import { REQUEST_STATUS, getTimestamp } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { requestId, electricianId, action, electricianName, electricianPhone, electricianCity } = await request.json();

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
        let supaSuccess = false;
        try {
            // Read current request from Supabase
            const { data: supaRequest, error: fetchError } = await supabaseAdmin
                .from('service_requests')
                .select('*')
                .eq('request_id', requestId)
                .single();

            if (fetchError || !supaRequest) {
                console.error('Request not found in Supabase:', fetchError);
                return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
            }

            const currentElectricianId = supaRequest.electrician_id;
            const currentStatus = supaRequest.status;

            if (action === 'accept') {
                // Anyone can accept a BROADCAST request if it's NEW
                // OR a specific electrician can accept a request assigned to them if it's NEW
                const isBroadcast = currentElectricianId === 'BROADCAST';
                const isAssignedToMe = currentElectricianId === electricianId;

                if (!isBroadcast && !isAssignedToMe) {
                    return NextResponse.json({ success: false, error: 'This request is not assigned to you.' }, { status: 403 });
                }

                if (currentStatus !== REQUEST_STATUS.NEW) {
                    return NextResponse.json({ success: false, error: 'Request is already accepted or cancelled.' }, { status: 400 });
                }

                const { error: updateError } = await supabaseAdmin
                    .from('service_requests')
                    .update({
                        electrician_id: electricianId,
                        electrician_name: electricianName || '',
                        electrician_phone: electricianPhone || '',
                        electrician_city: electricianCity || '',
                        status: REQUEST_STATUS.ACCEPTED,
                        updated_at: new Date().toISOString()
                    })
                    .eq('request_id', requestId);

                if (updateError) throw updateError;
                supaSuccess = true;

                // Log acceptance
                await supabaseAdmin.from('service_request_logs').insert({
                    request_id: requestId,
                    status: REQUEST_STATUS.ACCEPTED,
                    description: `Request accepted by electrician ${electricianName} (${electricianId})`
                });

            } else {
                // For other actions (complete, cancel), electrician must match
                if (currentElectricianId !== electricianId) {
                    return NextResponse.json({ success: false, error: 'Unauthorized action.' }, { status: 403 });
                }

                const updateData: Record<string, any> = {
                    status: newStatus,
                    updated_at: new Date().toISOString()
                };

                if (action === 'complete') {
                    updateData.completed_at = new Date().toISOString();
                }

                const { error: updateError } = await supabaseAdmin
                    .from('service_requests')
                    .update(updateData)
                    .eq('request_id', requestId);

                if (updateError) throw updateError;
                supaSuccess = true;

                await supabaseAdmin.from('service_request_logs').insert({
                    request_id: requestId,
                    status: newStatus,
                    description: `Status updated to ${newStatus}`
                });
            }

        } catch (supaErr) {
            console.error('[UpdateRequest] Supabase error:', supaErr);
            return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 });
        }

        // ===== 2. Update Google Sheets (secondary) =====
        try {
            const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
            const headers = rows[0];
            const idIndex = headers.indexOf('RequestID');
            const statusIndex = headers.indexOf('Status');
            const electricianIdIndex = headers.indexOf('ElectricianID'); // Create/Find index

            if (idIndex === -1) throw new Error('RequestID column not found in Sheets');

            let rowIndex = -1;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][idIndex] === requestId) {
                    rowIndex = i + 1; // 1-based index for updateRow
                    break;
                }
            }

            if (rowIndex !== -1) {
                if (action === 'accept') {
                    // Update Status AND ElectricianID
                    if (statusIndex !== -1) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex, statusIndex, REQUEST_STATUS.ACCEPTED);
                    if (electricianIdIndex !== -1) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex, electricianIdIndex, electricianId);
                } else {
                    if (statusIndex !== -1) await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex, statusIndex, newStatus);

                    if (action === 'complete') {
                        let completedAtIndex = headers.indexOf('CompletedAt');
                        if (completedAtIndex === -1) {
                            // Try to append column? For now, let's assume it exists or ignore
                            console.warn('CompletedAt column missing in Sheets');
                        } else {
                            await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex, completedAtIndex, new Date().toISOString());
                        }
                    }
                }
            } else {
                console.error('Request not found in Google Sheets to update');
            }

        } catch (sheetsErr) {
            console.error('[UpdateRequest] Google Sheets error:', sheetsErr);
            // Don't fail the request if Sheets fails, as Supabase is primary
        }

        return NextResponse.json({
            success: true,
            message: `Request ${action}d successfully`,
            newStatus: action === 'accept' ? REQUEST_STATUS.ACCEPTED : newStatus
        });

    } catch (error) {
        console.error('Update request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update request'
        }, { status: 500 });
    }
}
