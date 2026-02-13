import { NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Try Fetching from Supabase (Primary Source)
        try {
            const { data: requests, error } = await supabaseAdmin
                .from('service_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && requests) {
                const mappedRequests = requests.map(req => ({
                    id: req.request_id,
                    customerId: req.customer_id,
                    electricianId: req.electrician_id || '',
                    customerName: req.customer_name || 'Unknown',
                    electricianName: req.electrician_name || '', // Use denormalized name
                    customerPhone: req.customer_phone || '',
                    electricianPhone: req.electrician_phone || '',
                    serviceType: req.service_type,
                    urgency: 'Standard', // Default as not in DB strictly
                    preferredDate: req.preferred_date,
                    preferredSlot: req.preferred_slot,
                    issueDetail: req.description || '',
                    status: req.status,
                    timestamp: req.created_at,
                    city: req.customer_city || '',
                    pincode: '',
                    address: req.customer_address || ''
                }));

                return NextResponse.json({ success: true, requests: mappedRequests });
            }
        } catch (supaError) {
            console.error('[AdminRequests] Supabase error, falling back to Sheets:', supaError);
        }

        // 2. Fallback to Google Sheets (Legacy)
        console.warn('[AdminRequests] Using Google Sheets fallback');
        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);

        if (rows.length <= 1) {
            return NextResponse.json({ success: true, requests: [] });
        }

        // Columns: 0:Timestamp, 1:RequestID, 2:CustomerID, 3:ElectricianID, 4:ServiceType, 
        // 5:Status, 6:Urgency, 7:PreferredDate, 8:PreferredSlot, 9:Description, 
        // 10:City, 11:Pincode, 12:Address, 13:Lat, 14:Lng
        const sheetRequests = rows.slice(1).map((row: string[]) => ({
            id: row[1] || '',
            customerId: row[2] || '',
            electricianId: row[3] || '',
            customerName: '', // Will be populated
            electricianName: '', // Will be populated
            serviceType: row[4] || '',
            urgency: row[6] || '',
            preferredDate: row[7] || '',
            preferredSlot: row[8] || '',
            issueDetail: row[9] || '',
            status: row[5] || 'NEW',
            timestamp: row[0] || '',
        }));

        // Fetch Customers and Electricians to map IDs to Names
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);

        // Create Maps
        const customerMap = new Map<string, string>();
        if (customerRows.length > 1) {
            const headers = customerRows[0];
            const idIndex = headers.indexOf('CustomerID');
            const nameIndex = headers.indexOf('Name');
            if (idIndex !== -1 && nameIndex !== -1) {
                customerRows.slice(1).forEach(row => {
                    if (row[idIndex]) customerMap.set(row[idIndex], row[nameIndex] || 'Unknown');
                });
            }
        }

        const electricianMap = new Map<string, string>();
        if (electricianRows.length > 1) {
            const headers = electricianRows[0];
            const idIndex = headers.indexOf('ElectricianID');
            const nameIndex = headers.indexOf('Name');
            if (idIndex !== -1 && nameIndex !== -1) {
                electricianRows.slice(1).forEach(row => {
                    if (row[idIndex]) electricianMap.set(row[idIndex], row[nameIndex] || 'Unknown');
                });
            }
        }

        // Attach names
        sheetRequests.forEach((req: any) => {
            req.customerName = customerMap.get(req.customerId) || req.customerId;
            req.electricianName = electricianMap.get(req.electricianId) || req.electricianId;
        });

        return NextResponse.json({ success: true, requests: sheetRequests });

    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch requests'
        }, { status: 500 });
    }
}
