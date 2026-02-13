import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params;

        if (!requestId) {
            return NextResponse.json(
                { success: false, error: 'Request ID is required' },
                { status: 400 }
            );
        }

        // Fetch from Supabase using Admin Client (bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('service_requests')
            .select('*')
            .eq('request_id', requestId)
            .single();

        if (error) {
            console.error('[RequestAPI] Fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Request not found' },
                { status: 404 }
            );
        }

        // If electrician is assigned, fetch their details to ensure we have the latest
        let electricianDetails = {
            name: data.electrician_name,
            phone: data.electrician_phone,
            city: data.electrician_city
        };

        if (data.electrician_id && !data.electrician_name && data.electrician_id !== 'BROADCAST') {
            console.log(`[RequestAPI] Fetching electrician details for ${data.electrician_id}`);
            const { data: elecData, error: elecError } = await supabaseAdmin
                .from('electricians')
                .select('name, phone_primary, city')
                .eq('electrician_id', data.electrician_id)
                .maybeSingle();

            if (elecError) {
                console.error('[RequestAPI] Electrician fetch error:', elecError);
            }

            if (elecData) {
                console.log('[RequestAPI] Electrician found:', elecData.name);
                electricianDetails = {
                    name: elecData.name,
                    phone: elecData.phone_primary,
                    city: elecData.city
                };
            } else {
                console.warn('[RequestAPI] Electrician not found');
            }
        }

        return NextResponse.json({
            success: true,
            request: {
                ...data,
                electricianName: electricianDetails.name,
                electricianPhone: electricianDetails.phone,
                electricianCity: electricianDetails.city
            }
        });

    } catch (error) {
        console.error('[RequestAPI] Internal error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
