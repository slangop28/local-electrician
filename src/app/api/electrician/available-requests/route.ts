import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');

        if (!city) {
            return NextResponse.json({ success: false, error: 'City required' }, { status: 400 });
        }

        const electricianCity = city.trim().toLowerCase();

        // ===== 1. Try Supabase first =====
        try {
            const { data: requests, error } = await supabaseAdmin
                .from('service_requests')
                .select('*')
                .eq('status', 'NEW')
                .eq('electrician_id', 'BROADCAST')
                .order('created_at', { ascending: false });

            if (!error && requests && requests.length > 0) {
                const availableRequests = requests
                    .filter((req: any) => {
                        const reqCity = (req.customer_city || '').toString().trim().toLowerCase();
                        return reqCity === electricianCity ||
                            reqCity.includes(electricianCity) ||
                            electricianCity.includes(reqCity);
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
                    }));

                return NextResponse.json({ success: true, requests: availableRequests });
            }
        } catch (supaErr) {
            console.error('[AvailableRequests] Supabase error:', supaErr);
        }

        // ===== 2. Fallback to Google Sheets =====
        const requestRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const customers = await getCustomersMap();

        const availableRequests: any[] = [];

        for (let i = 1; i < requestRows.length; i++) {
            const row = requestRows[i];
            const status = row[5];
            const electricianId = row[3];
            const customerId = row[2];

            if (status === 'NEW' && electricianId?.trim() === 'BROADCAST') {
                const reqCity = row[10];
                const cust = customers[customerId];
                const effectiveCity = reqCity || cust?.city;

                if (effectiveCity) {
                    const targetCity = effectiveCity.toString().trim().toLowerCase();

                    if (targetCity === electricianCity || targetCity.includes(electricianCity) || electricianCity.includes(targetCity)) {
                        availableRequests.push({
                            requestId: row[1],
                            customerId: customerId,
                            serviceType: row[4],
                            status: status,
                            timestamp: row[0],
                            urgency: row[6] || 'Normal',
                            preferredDate: row[7],
                            preferredSlot: row[8],
                            description: row[9] || '',
                            customerName: cust?.name || 'Unknown',
                            customerCity: effectiveCity,
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
