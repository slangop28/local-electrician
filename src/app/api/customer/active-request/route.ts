import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerIdParam = searchParams.get('customerId');
        const phone = searchParams.get('phone') || customerIdParam; // Map customerId to phone
        const email = searchParams.get('email'); // Allow lookup by email

        if (!phone && !email) {
            return NextResponse.json({
                success: false,
                error: 'Phone number, Customer ID or email is required'
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
                // removing everything non-digit
                const digits = phone.replace(/\D/g, '');
                if (digits.startsWith('91') && digits.length === 12) altPhone = '+' + digits;
                else if (digits.length === 10) altPhone = '+91' + digits;

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

        if (customerId) {
            // Get latest active request from Supabase
            const { data: requests } = await supabaseAdmin
                .from('service_requests')
                .select('*')
                .eq('customer_id', customerId)
                .in('status', ['NEW', 'ACCEPTED', 'IN_PROGRESS', 'SUCCESS'])
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

            // No active request in Supabase found for this customer ID
            return NextResponse.json({ success: true, activeRequest: null });
        }

        // ===== 2. Fallback to Google Sheets (Only if phone provided) =====
        if (phone) {
            try {
                const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
                const customerHeaders = customerRows[0] || [];
                const phoneIndex = customerHeaders.indexOf('Phone');
                const customerIdIndex = customerHeaders.indexOf('CustomerID');

                let actualCustomerId: string | null = null;

                // Simple search in sheets
                for (let i = 1; i < customerRows.length; i++) {
                    if (customerRows[i][phoneIndex] === phone) {
                        actualCustomerId = customerRows[i][customerIdIndex];
                        break;
                    }
                }

                if (!actualCustomerId) {
                    return NextResponse.json({ success: true, activeRequest: null });
                }

                const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
                const serviceHeaders = rows[0] || [];
                const statusIndex = serviceHeaders.indexOf('Status');
                const requestIdIndex = serviceHeaders.indexOf('RequestID');
                const serviceCustIdIndex = serviceHeaders.indexOf('CustomerID');
                const serviceTypeIndex = serviceHeaders.indexOf('ServiceType');
                const dateIndex = serviceHeaders.indexOf('PreferredDate');
                const slotIndex = serviceHeaders.indexOf('PreferredSlot');
                const electricianIdIndex = serviceHeaders.indexOf('ElectricianID');

                const customerRequests = rows.slice(1).filter((row: string[]) => row[serviceCustIdIndex] === actualCustomerId);

                if (customerRequests.length === 0) {
                    return NextResponse.json({ success: true, activeRequest: null });
                }

                customerRequests.sort((a: string[], b: string[]) => {
                    return new Date(b[0]).getTime() - new Date(a[0]).getTime();
                });

                const latestRequest = customerRequests[0];
                const status = latestRequest[statusIndex] || '';

                if (!['NEW', 'ACCEPTED', 'IN_PROGRESS', 'SUCCESS'].includes(status)) {
                    return NextResponse.json({ success: true, activeRequest: null });
                }

                const requestData: any = {
                    requestId: latestRequest[requestIdIndex],
                    customerId: latestRequest[serviceCustIdIndex],
                    electricianId: latestRequest[electricianIdIndex],
                    serviceType: latestRequest[serviceTypeIndex],
                    status: status,
                    preferredDate: latestRequest[dateIndex] || '',
                    preferredSlot: latestRequest[slotIndex] || '',
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

            } catch (sheetErr) {
                console.error('Sheets fallback error:', sheetErr);
            }
        }

        return NextResponse.json({ success: true, activeRequest: null });

    } catch (error) {
        console.error('Fetch active request error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch request' }, { status: 500 });
    }
}
