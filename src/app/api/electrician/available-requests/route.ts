import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');

        if (!city) {
            return NextResponse.json({ success: false, error: 'City required' }, { status: 400 });
        }

        const requestRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const headers = requestRows[0] || [];
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const custHeaders = customerRows[0] || [];

        // Map customers for quick lookup
        const customers: Record<string, any> = {};
        customerRows.slice(1).forEach((row: string[]) => {
            customers[row[custHeaders.indexOf('CustomerID')]] = {
                city: row[custHeaders.indexOf('City')],
                area: row[custHeaders.indexOf('City')], // Fallback if area not separate
                name: row[custHeaders.indexOf('Name')],
                phone: row[custHeaders.indexOf('Phone')]
            };
        });

        // Filter for NEW broadcast requests
        const availableRequests: any[] = [];

        // Skip header
        for (let i = 1; i < requestRows.length; i++) {
            const row = requestRows[i];
            const status = row[headers.indexOf('Status')];
            const electricianId = row[headers.indexOf('ElectricianID')];
            const customerId = row[headers.indexOf('CustomerID')];

            if (status === 'NEW' && electricianId?.trim() === 'BROADCAST') {
                // Check location match
                // Prioritize City from Request, fallback to Customer
                const reqCity = row[headers.indexOf('City')];
                const cust = customers[customerId];

                // Effective City: Request City > Customer City (from join)
                const effectiveCity = reqCity || cust?.city;

                if (effectiveCity) {
                    const targetCity = effectiveCity.toString().trim().toLowerCase();
                    const electricianCity = city.trim().toLowerCase();

                    // Loose matching: check for inclusion or exact match
                    if (targetCity === electricianCity || targetCity.includes(electricianCity) || electricianCity.includes(targetCity)) {
                        availableRequests.push({
                            requestId: row[headers.indexOf('RequestID')],
                            customerId: customerId,
                            serviceType: row[headers.indexOf('ServiceType')],
                            status: status,
                            timestamp: row[headers.indexOf('Timestamp')],
                            urgency: row[headers.indexOf('Urgency')] || 'Normal', // Fallback if column missing
                            preferredDate: row[headers.indexOf('PreferredDate')],
                            preferredSlot: row[headers.indexOf('PreferredSlot')],
                            description: row[headers.indexOf('Description')] || row[headers.indexOf('IssueDetail')] || '',
                            // Include customer details for the card
                            customerName: cust?.name || 'Unknown', // Fallback
                            customerCity: effectiveCity,
                        });
                    }
                }
            }
        }

        // Sort by timestamp desc (newest first)
        availableRequests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({ success: true, requests: availableRequests });

    } catch (error) {
        console.error('Fetch available requests error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch requests' }, { status: 500 });
    }
}
