import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // ===== 1. Find customer in Supabase =====
        const { data: customer } = await supabaseAdmin
            .from('customers')
            .select('customer_id')
            .eq('phone', phone)
            .single();

        let customerId = customer?.customer_id;

        // Fallback: find customer in Google Sheets
        if (!customerId) {
            try {
                const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
                const custHeaders = customerRows[0] || [];
                for (let i = 1; i < customerRows.length; i++) {
                    if (customerRows[i][custHeaders.indexOf('Phone')] === phone) {
                        customerId = customerRows[i][custHeaders.indexOf('CustomerID')];
                        break;
                    }
                }
            } catch (e) {
                console.error('[History] Google Sheets customer lookup error:', e);
            }
        }

        if (!customerId) {
            return NextResponse.json({
                success: true,
                serviceRequests: [],
                message: 'No customer profile found'
            });
        }

        // ===== 2. Get service requests from Supabase (All history) =====
        const { data: requests, error: reqError } = await supabaseAdmin
            .from('service_requests')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (requests && requests.length > 0) {
            // Get electrician info for matched requests
            const electricianIds = [...new Set(requests
                .map(r => r.electrician_id)
                .filter(id => id && id !== 'BROADCAST'))];

            let electricianMap: Record<string, { name: string; phone: string }> = {};

            if (electricianIds.length > 0) {
                const { data: electricians } = await supabaseAdmin
                    .from('electricians')
                    .select('electrician_id, name, phone_primary')
                    .in('electrician_id', electricianIds);

                if (electricians) {
                    for (const e of electricians) {
                        electricianMap[e.electrician_id] = {
                            name: e.name,
                            phone: e.phone_primary
                        };
                    }
                }
            }

            const serviceRequests = requests.map(r => ({
                requestId: r.request_id,
                customerId: r.customer_id,
                electricianId: r.electrician_id,
                electricianName: electricianMap[r.electrician_id]?.name || 'Searching...',
                electricianPhone: electricianMap[r.electrician_id]?.phone || '',
                serviceType: r.service_type,
                description: r.description || '',
                preferredDate: r.preferred_date || '',
                preferredSlot: r.preferred_slot || '',
                status: r.status,
                paymentStatus: r.payment_status || '',
                amount: r.amount || 0,
                rating: r.rating || 0,
                review: r.review || '',
                createdAt: r.created_at,
                customerName: r.customer_name || '',
                customerPhone: r.customer_phone || '',
                customerAddress: r.customer_address || '',
                customerCity: r.customer_city || ''
            }));

            return NextResponse.json({
                success: true,
                serviceRequests
            });
        }

        // ===== 3. Fallback: Read from Google Sheets =====
        try {
            const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
            const headers = rows[0] || [];

            const serviceRequests = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row[headers.indexOf('CustomerID')] === customerId) {
                    const electricianId = row[headers.indexOf('ElectricianID')];
                    let electricianName = 'Searching...';
                    let electricianPhone = '';

                    // Look up electrician
                    if (electricianId && electricianId !== 'BROADCAST') {
                        const { data: elec } = await supabaseAdmin
                            .from('electricians')
                            .select('name, phone_primary')
                            .eq('electrician_id', electricianId)
                            .single();

                        if (elec) {
                            electricianName = elec.name;
                            electricianPhone = elec.phone_primary;
                        }
                    }

                    serviceRequests.push({
                        requestId: row[headers.indexOf('RequestID')],
                        customerId: customerId,
                        electricianId: electricianId || '',
                        electricianName,
                        electricianPhone,
                        serviceType: row[headers.indexOf('ServiceType')] || '',
                        description: row[headers.indexOf('Description')] || row[headers.indexOf('IssueDetail')] || '',
                        preferredDate: row[headers.indexOf('PreferredDate')] || '',
                        preferredSlot: row[headers.indexOf('PreferredSlot')] || '',
                        status: row[headers.indexOf('Status')] || 'NEW',
                        createdAt: row[headers.indexOf('Timestamp')] || '',
                        customerName: '',
                        customerPhone: phone,
                        customerAddress: '',
                        customerCity: ''
                    });
                }
            }

            serviceRequests.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            return NextResponse.json({
                success: true,
                serviceRequests
            });
        } catch (sheetsError) {
            console.error('[History] Google Sheets fallback error:', sheetsError);
            return NextResponse.json({
                success: true,
                serviceRequests: []
            });
        }

    } catch (error) {
        console.error('Customer history error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}
