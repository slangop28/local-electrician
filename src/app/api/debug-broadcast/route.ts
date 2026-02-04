import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cityQuery = searchParams.get('city');

        const requestRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const headers = requestRows[0] || [];
        const custHeaders = customerRows[0] || [];

        // Map customers
        const customers: any = {};
        customerRows.slice(1).forEach((row: string[]) => {
            const cid = row[custHeaders.indexOf('CustomerID')];
            customers[cid] = {
                id: cid,
                name: row[custHeaders.indexOf('Name')],
                city: row[custHeaders.indexOf('City')],
                phone: row[custHeaders.indexOf('Phone')]
            };
        });

        // Parse requests
        const allRequests = requestRows.slice(1).map((row: string[]) => {
            const cid = row[headers.indexOf('CustomerID')];
            const eid = row[headers.indexOf('ElectricianID')];
            const status = row[headers.indexOf('Status')];
            const customer = customers[cid] || {};

            return {
                rawRow: row, // Added for debug
                requestId: row[headers.indexOf('RequestID')],
                electricianId: eid || '(empty)',
                status: status || '(empty)',
                customerId: cid,
                customerCityRaw: customer.city,
                customerCityMapped: customer.city ? customer.city.toString().trim().toLowerCase() : 'N/A',
                isBroadcastCandidate: (status === 'NEW' && eid === 'BROADCAST'),
                matchCityQuery: cityQuery ? cityQuery.toLowerCase() : 'N/A'
            };
        });

        const newBroadcasts = allRequests.filter((r: any) => r.isBroadcastCandidate);

        return NextResponse.json({
            success: true,
            totalRequests: allRequests.length,
            allRequests: allRequests,
            sheetHeaders: headers,
            sampleCustomer: Object.values(customers)[0],
            cityQueryReceived: cityQuery
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
