import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const { requestId } = await params;

        if (!requestId) {
            return NextResponse.json(
                { success: false, error: 'Request ID is required' },
                { status: 400 }
            );
        }

        console.log(`[Service Request API] Fetching details for: ${requestId}`);

        // Get service requests
        const requestRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const requestHeaders = requestRows[0] || [];

        // Find column indices
        const getIndex = (name: string) => requestHeaders.indexOf(name);
        const requestIdIndex = getIndex('RequestID');
        const customerIdIndex = getIndex('CustomerID');
        const electricianIdIndex = getIndex('ElectricianID');
        const serviceTypeIndex = getIndex('ServiceType');
        const statusIndex = getIndex('Status');
        const preferredDateIndex = getIndex('PreferredDate');
        const preferredSlotIndex = getIndex('PreferredSlot');
        const timestampIndex = getIndex('Timestamp');
        const addressIndex = getIndex('Address');
        const descriptionIndex = getIndex('Description');

        // Find the request
        let requestData = null;
        for (let i = 1; i < requestRows.length; i++) {
            if (requestRows[i][requestIdIndex] === requestId) {
                requestData = {
                    requestId: requestRows[i][requestIdIndex],
                    customerId: requestRows[i][customerIdIndex],
                    electricianId: requestRows[i][electricianIdIndex],
                    serviceType: requestRows[i][serviceTypeIndex],
                    status: requestRows[i][statusIndex],
                    preferredDate: requestRows[i][preferredDateIndex],
                    preferredSlot: requestRows[i][preferredSlotIndex],
                    timestamp: requestRows[i][timestampIndex],
                    address: requestRows[i][addressIndex] || '',
                    description: requestRows[i][descriptionIndex] || ''
                };
                break;
            }
        }

        if (!requestData) {
            return NextResponse.json(
                { success: false, error: 'Service request not found' },
                { status: 404 }
            );
        }

        console.log(`[Service Request API] Found request:`, requestData);

        // Get customer details
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const customerHeaders = customerRows[0] || [];
        const custIdIndex = customerHeaders.indexOf('CustomerID');
        const custNameIndex = customerHeaders.indexOf('Name');
        const custPhoneIndex = customerHeaders.indexOf('Phone');
        const custAddressIndex = customerHeaders.indexOf('Address');
        const custCityIndex = customerHeaders.indexOf('City');

        let customerData = null;
        for (let i = 1; i < customerRows.length; i++) {
            if (customerRows[i][custIdIndex] === requestData.customerId) {
                customerData = {
                    name: customerRows[i][custNameIndex],
                    phone: customerRows[i][custPhoneIndex],
                    address: customerRows[i][custAddressIndex] || '',
                    city: customerRows[i][custCityIndex] || ''
                };
                break;
            }
        }

        // Get electrician details if assigned
        let electricianData = null;
        if (requestData.electricianId && requestData.electricianId !== 'BROADCAST') {
            const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
            const elecHeaders = electricianRows[0] || [];
            const elecIdIndex = elecHeaders.indexOf('ElectricianID');
            const elecNameIndex = elecHeaders.indexOf('NameAsPerAadhaar');
            const elecPhoneIndex = elecHeaders.indexOf('PhonePrimary');

            for (let i = 1; i < electricianRows.length; i++) {
                if (electricianRows[i][elecIdIndex] === requestData.electricianId) {
                    electricianData = {
                        id: electricianRows[i][elecIdIndex],
                        name: electricianRows[i][elecNameIndex],
                        phone: electricianRows[i][elecPhoneIndex]
                    };
                    break;
                }
            }
        }

        console.log(`[Service Request API] Customer:`, customerData);
        console.log(`[Service Request API] Electrician:`, electricianData);

        return NextResponse.json({
            success: true,
            request: requestData,
            customer: customerData,
            electrician: electricianData
        });

    } catch (error) {
        console.error('[Service Request API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch service request' },
            { status: 500 }
        );
    }
}
