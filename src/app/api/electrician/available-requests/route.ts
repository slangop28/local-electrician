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
        const customers = await getCustomersMap(); // Helper to get customers

        // Filter for NEW broadcast requests
        const availableRequests: any[] = [];

        // Skip header
        for (let i = 1; i < requestRows.length; i++) {
            const row = requestRows[i];
            // Schema: 0:Timestamp, 1:RequestID, 2:CustomerID, 3:ElectricianID, 4:ServiceType, 
            // 5:Status, 6:Urgency, 7:PreferredDate, 8:PreferredSlot, 9:Description, 
            // 10:City, 11:Pincode, 12:Address, 13:Lat, 14:Lng
            const status = row[5];
            const electricianId = row[3];
            const customerId = row[2];

            if (status === 'NEW' && electricianId?.trim() === 'BROADCAST') {
                // Check location match
                // Prioritize City from Request (Index 10), fallback to Customer
                const reqCity = row[10];
                const cust = customers[customerId];

                // Effective City: Request City > Customer City (from join)
                const effectiveCity = reqCity || cust?.city;

                if (effectiveCity) {
                    const targetCity = effectiveCity.toString().trim().toLowerCase();
                    const electricianCity = city.trim().toLowerCase();

                    // Loose matching: check for inclusion or exact match
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
