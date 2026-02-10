import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const { requestId } = await params;

        if (!requestId) {
            return NextResponse.json(
                { success: false, error: 'Request ID is required' },
                { status: 400 }
            );
        }

        console.log(`[Service Request API] Fetching details for: ${requestId}`);

        // 1. Fetch Request Details
        const { data: requestData, error: requestError } = await supabaseAdmin
            .from('service_requests')
            .select('*')
            .eq('request_id', requestId)
            .single();

        if (requestError || !requestData) {
            console.error('[Service Request API] Request not found:', requestError);
            return NextResponse.json(
                { success: false, error: 'Service request not found' },
                { status: 404 }
            );
        }

        // 2. Fetch Logs (Timeline)
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('service_request_logs')
            .select('*')
            .eq('request_id', requestId)
            .order('created_at', { ascending: true });

        // 3. Fetch Customer Details
        const { data: customerData, error: customerError } = await supabaseAdmin
            .from('customers')
            .select('name, phone, address, city')
            .eq('customer_id', requestData.customer_id)
            .single();

        // 4. Fetch Electrician Details (if assigned)
        let electricianDetails = null;
        if (requestData.electrician_id && requestData.electrician_id !== 'BROADCAST') {
            const { data: elec, error: elecError } = await supabaseAdmin
                .from('electricians')
                .select('electrician_id, name, phone_primary')
                .eq('electrician_id', requestData.electrician_id)
                .single();

            if (elec) {
                electricianDetails = {
                    id: elec.electrician_id,
                    name: elec.name,
                    phone: elec.phone_primary
                };
            }
        }

        // Format Response
        const formattedRequest = {
            requestId: requestData.request_id,
            customerId: requestData.customer_id,
            electricianId: requestData.electrician_id,
            serviceType: requestData.service_type,
            status: requestData.status,
            preferredDate: requestData.preferred_date,
            preferredSlot: requestData.preferred_slot,
            timestamp: requestData.created_at,
            address: requestData.customer_address,
            description: requestData.description
        };

        return NextResponse.json({
            success: true,
            request: formattedRequest,
            customer: customerData,
            electrician: electricianDetails,
            logs: logs || []
        });

    } catch (error) {
        console.error('[Service Request API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch service request' },
            { status: 500 }
        );
    }
}
