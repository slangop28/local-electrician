import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');
        const electricianIdParam = searchParams.get('electricianId');

        if (!city) {
            return NextResponse.json({ success: false, error: 'City required' }, { status: 400 });
        }

        const electricianCity = city.trim().toLowerCase();

        // ===== 1. Try Supabase first =====
        try {
            // Fetch requests that are NEW and (BROADCAST or Assigned to this electrician)
            let query = supabaseAdmin
                .from('service_requests')
                .select('*')
                .eq('status', 'NEW'); // strict status check

            if (electricianIdParam) {
                // Logic: (electrician_id is BROADCAST) OR (electrician_id is ME)
                query = query.or(`electrician_id.eq.BROADCAST,electrician_id.eq.${electricianIdParam}`);
            } else {
                query = query.eq('electrician_id', 'BROADCAST');
            }

            const { data: requests, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('[AvailableRequests] Supabase query error:', error);
                throw error;
            }

            if (requests && requests.length > 0) {
                const availableRequests = requests
                    .filter((req: any) => {
                        // Filter by City match
                        const reqCity = (req.customer_city || '').toString().trim().toLowerCase();
                        // Also check if electricianCity is contained in reqCity or vice versa
                        // This handles cases like "New Delhi" vs "Delhi"
                        return reqCity && (reqCity === electricianCity ||
                            reqCity.includes(electricianCity) ||
                            electricianCity.includes(reqCity));
                    })
                    .map((req: any) => ({
                        requestId: req.request_id,
                        customerId: req.customer_id,
                        serviceType: req.service_type,
                        status: req.status,
                        timestamp: req.created_at,
                        urgency: req.urgency || 'Normal',
                        preferredDate: req.preferred_date,
                        preferredSlot: req.preferred_slot,
                        description: req.description || '',
                        customerName: req.customer_name || 'Unknown',
                        customerCity: req.customer_city || '',
                        isDirectRequest: req.electrician_id !== 'BROADCAST' // Flag to identify direct requests
                    }));

                return NextResponse.json({ success: true, requests: availableRequests });
            }
        } catch (supaErr) {
            console.error('[AvailableRequests] Supabase error, falling back:', supaErr);
        }

        // ===== 2. Fallback to Google Sheets =====
        const requestRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);

        // Build customer map for fallback
        const customers: Record<string, any> = {};
        if (customerRows.length > 1) {
            const custHeaders = customerRows[0];
            const cIdIdx = custHeaders.indexOf('CustomerID');
            const cCityIdx = custHeaders.indexOf('City');
            const cNameIdx = custHeaders.indexOf('Name');

            customerRows.slice(1).forEach((row: string[]) => {
                if (row[cIdIdx]) {
                    customers[row[cIdIdx]] = {
                        city: row[cCityIdx],
                        name: row[cNameIdx]
                    };
                }
            });
        }

        const availableRequests: any[] = [];
        const reqHeaders = requestRows[0];
        const rIdIdx = reqHeaders.indexOf('RequestID');
        const rCustIdIdx = reqHeaders.indexOf('CustomerID');
        const rElecIdIdx = reqHeaders.indexOf('ElectricianID');
        const rStatusIdx = reqHeaders.indexOf('Status');
        const rCityIdx = reqHeaders.indexOf('City'); // Sometimes city is in request row

        for (let i = 1; i < requestRows.length; i++) {
            const row = requestRows[i];
            const status = row[rStatusIdx];
            const recordElectricianId = row[rElecIdIdx];

            // Strict filtering: OLD requests must be NEW
            if (status !== 'NEW') continue;

            const isBroadcast = recordElectricianId === 'BROADCAST' || !recordElectricianId;
            const isDirect = electricianIdParam && recordElectricianId === electricianIdParam;

            if (isBroadcast || isDirect) {
                const customerId = row[rCustIdIdx];
                const cust = customers[customerId];
                const reqCity = row[rCityIdx] || cust?.city;

                if (reqCity) {
                    const targetCity = reqCity.toString().trim().toLowerCase();
                    if (targetCity === electricianCity || targetCity.includes(electricianCity) || electricianCity.includes(targetCity)) {
                        availableRequests.push({
                            requestId: row[rIdIdx],
                            customerId: customerId,
                            serviceType: row[reqHeaders.indexOf('ServiceType')],
                            status: status,
                            timestamp: row[0],
                            urgency: row[reqHeaders.indexOf('Urgency')] || 'Normal',
                            preferredDate: row[reqHeaders.indexOf('PreferredDate')],
                            preferredSlot: row[reqHeaders.indexOf('PreferredSlot')],
                            description: row[reqHeaders.indexOf('IssueDetail')] || '',
                            customerName: cust?.name || 'Unknown',
                            customerCity: reqCity,
                            isDirectRequest: isDirect
                        });
                    }
                }
            }
        }

        availableRequests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({ success: true, requests: availableRequests });

    } catch (error) {
        console.error('Fetch available requests error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch requests' }, { status: 500 });
    }
}

async function getCustomersMap() {
    const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
    const customers: Record<string, any> = {};
    if (customerRows.length > 1) {
        const custHeaders = customerRows[0];
        const idIndex = custHeaders.indexOf('CustomerID');
        const cityIndex = custHeaders.indexOf('City');
        const nameIndex = custHeaders.indexOf('Name');

        customerRows.slice(1).forEach((row: string[]) => {
            if (row[idIndex]) {
                customers[row[idIndex]] = {
                    city: row[cityIndex],
                    name: row[nameIndex]
                };
            }
        });
    }
    return customers;
}
