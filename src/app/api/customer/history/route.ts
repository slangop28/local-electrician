import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const email = searchParams.get('email'); // Allow lookup by email

        if (!phone && !email) {
            return NextResponse.json({
                success: false,
                error: 'Phone number or email is required'
            }, { status: 400 });
        }

        let customerId: string | null = null;

        if (phone) {
            // 1. Try finding customer by phone
            const { data: exactMatch } = await supabaseAdmin
                .from('customers')
                .select('customer_id')
                .eq('phone', phone)
                .maybeSingle();

            if (exactMatch) {
                customerId = exactMatch.customer_id;
            } else {
                // Fuzzy match (+91 handling)
                let altPhone = phone;
                if (phone.startsWith('+91')) altPhone = phone.slice(3);
                else if (phone.length === 10) altPhone = '+91' + phone;

                if (altPhone !== phone) {
                    const { data: fuzzyMatch } = await supabaseAdmin
                        .from('customers')
                        .select('customer_id')
                        .eq('phone', altPhone)
                        .maybeSingle();
                    if (fuzzyMatch) customerId = fuzzyMatch.customer_id;
                }
            }
        }

        if (!customerId && email) {
            // 2. Try finding customer by email
            const { data: emailMatch } = await supabaseAdmin
                .from('customers')
                .select('customer_id')
                .eq('email', email)
                .maybeSingle();

            if (emailMatch) {
                customerId = emailMatch.customer_id;
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

            let electricianMap: Record<string, { name: string; phone: string; location?: string }> = {};

            if (electricianIds.length > 0) {
                const { data: electricians } = await supabaseAdmin
                    .from('electricians')
                    .select('electrician_id, name, phone_primary, city, area')
                    .in('electrician_id', electricianIds);

                if (electricians) {
                    for (const e of electricians) {
                        electricianMap[e.electrician_id] = {
                            name: e.name,
                            phone: e.phone_primary,
                            location: e.area ? `${e.area}, ${e.city}` : e.city
                        };
                    }
                }

                // Check for missing electricians and fallback to Google Sheets
                const foundIds = Object.keys(electricianMap);
                const missingIds = electricianIds.filter(id => !foundIds.includes(id));

                if (missingIds.length > 0) {
                    try {
                        const elecRows = await getRows(SHEET_TABS.ELECTRICIANS);
                        const headers = elecRows[0] || [];
                        const idIndex = headers.indexOf('ElectricianID');

                        if (idIndex !== -1) {
                            for (let i = 1; i < elecRows.length; i++) {
                                const row = elecRows[i];
                                const currentId = row[idIndex];

                                if (missingIds.includes(currentId)) {
                                    electricianMap[currentId] = {
                                        name: row[headers.indexOf('NameAsPerAadhaar')] || 'Electrician',
                                        phone: row[headers.indexOf('PhonePrimary')] || '',
                                        location: `${row[headers.indexOf('Area')]}, ${row[headers.indexOf('City')]}`
                                    };
                                }
                            }
                        }
                    } catch (sheetError) {
                        console.error('Failed to fallback to Sheets for electricians:', sheetError);
                    }
                }
            }

            const serviceRequests = requests.map(r => ({
                requestId: r.request_id,
                customerId: r.customer_id,
                electricianId: r.electrician_id,
                electricianName: r.electrician_name || electricianMap[r.electrician_id]?.name,
                electricianPhone: r.electrician_phone || electricianMap[r.electrician_id]?.phone,
                electricianLocation: r.electrician_city || electricianMap[r.electrician_id]?.location,
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
                        electricianName: electricianName !== 'Searching...' ? electricianName : undefined,
                        electricianPhone,
                        serviceType: row[headers.indexOf('ServiceType')] || '',
                        description: row[headers.indexOf('Description')] || row[headers.indexOf('IssueDetail')] || '',
                        preferredDate: row[headers.indexOf('PreferredDate')] || '',
                        preferredSlot: row[headers.indexOf('PreferredSlot')] || '',
                        status: row[headers.indexOf('Status')] || 'NEW',
                        createdAt: row[headers.indexOf('Timestamp')] || '',
                        customerName: '',
                        customerPhone: phone || '', // Best guess
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
