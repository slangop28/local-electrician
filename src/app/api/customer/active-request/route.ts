import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phoneOrCustomerId = searchParams.get('customerId');

        if (!phoneOrCustomerId) {
            return NextResponse.json({ success: false, error: 'Customer ID or phone required' }, { status: 400 });
        }

        // ===== 1. Try Supabase first =====
        try {
            // Find customer by phone
            let customerId = phoneOrCustomerId;
            const { data: customer } = await supabaseAdmin
                .from('customers')
                .select('customer_id')
                .eq('phone', phoneOrCustomerId)
                .single();

            if (customer) {
                customerId = customer.customer_id;
            }

            // Get latest active request
            const { data: requests } = await supabaseAdmin
                .from('service_requests')
                .select('*')
                .eq('customer_id', customerId)
                .in('status', ['NEW', 'ACCEPTED', 'SUCCESS'])
                .order('created_at', { ascending: false })
                .limit(1);

            if (requests && requests.length > 0) {
                const req = requests[0];
                const requestData: any = {
                    requestId: req.request_id,
                    customerId: req.customer_id,
                    electricianId: req.electrician_id,
                    serviceType: req.service_type,
                    status: req.status,
                    preferredDate: req.preferred_date || '',
                    preferredSlot: req.preferred_slot || '',
                    timestamp: req.created_at,
                };

                // Fetch electrician details if assigned
                if (req.electrician_id && req.electrician_id !== 'BROADCAST') {
                    const { data: electrician } = await supabaseAdmin
                        .from('electricians')
                        .select('name, phone_primary, city, area, latitude, longitude')
                        .eq('electrician_id', req.electrician_id)
                        .single();

                    if (electrician) {
                        requestData.electricianName = electrician.name;
                        requestData.electricianPhone = electrician.phone_primary;
                        requestData.electricianCity = electrician.city;
                        requestData.electricianArea = electrician.area;
                        requestData.electricianLat = electrician.latitude;
                        requestData.electricianLng = electrician.longitude;
                    }
                }

                return NextResponse.json({ success: true, activeRequest: requestData });
            }

            // No active request in Supabase
            return NextResponse.json({ success: true, activeRequest: null });

        } catch (supaErr) {
            console.error('[ActiveRequest] Supabase error, falling back to Sheets:', supaErr);
        }

        // ===== 2. Fallback to Google Sheets =====
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const customerHeaders = customerRows[0] || [];
        const phoneIndex = customerHeaders.indexOf('Phone');
        const customerIdIndex = customerHeaders.indexOf('CustomerID');

        let actualCustomerId = phoneOrCustomerId;

        for (let i = 1; i < customerRows.length; i++) {
            if (customerRows[i][phoneIndex] === phoneOrCustomerId) {
                actualCustomerId = customerRows[i][customerIdIndex];
                break;
            }
        }

        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const customerRequests = rows.slice(1).filter((row: string[]) => row[2] === actualCustomerId);

        if (customerRequests.length === 0) {
            return NextResponse.json({ success: true, activeRequest: null });
        }

        customerRequests.sort((a: string[], b: string[]) => {
            return new Date(b[0]).getTime() - new Date(a[0]).getTime();
        });

        const latestRequest = customerRequests[0];
        const status = latestRequest[5];
        const activeStatuses = ['NEW', 'ACCEPTED', 'SUCCESS'];

        if (!activeStatuses.includes(status)) {
            return NextResponse.json({ success: true, activeRequest: null });
        }

        const requestData: any = {
            requestId: latestRequest[1],
            customerId: latestRequest[2],
            electricianId: latestRequest[3],
            serviceType: latestRequest[4],
            status: latestRequest[5],
            preferredDate: latestRequest[6] || '',
            preferredSlot: latestRequest[7] || '',
            timestamp: latestRequest[0],
        };

        if (requestData.electricianId && requestData.electricianId !== 'BROADCAST') {
            const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
            const headers = electricianRows[0] || [];
            const idIdx = headers.indexOf('ElectricianID');
            const nameIdx = headers.indexOf('NameAsPerAadhaar');
            const phoneIdx = headers.indexOf('PhonePrimary');

            const electricianRow = electricianRows.find((row: string[]) => row[idIdx] === requestData.electricianId);

            if (electricianRow) {
                requestData.electricianName = electricianRow[nameIdx];
                requestData.electricianPhone = electricianRow[phoneIdx];
            }
        }

        return NextResponse.json({ success: true, activeRequest: requestData });

    } catch (error) {
        console.error('Fetch active request error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch request' }, { status: 500 });
    }
}
