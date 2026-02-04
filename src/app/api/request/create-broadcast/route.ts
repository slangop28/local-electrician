import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { generateId, getTimestamp, REQUEST_STATUS } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            serviceType,
            urgency,
            preferredDate,
            preferredSlot,
            issueDetail,
            customerName,
            customerPhone,
            address,
            city,
            pincode,
            lat,
            lng
        } = body;

        // Validate required fields
        if (!serviceType || !urgency || !customerName || !customerPhone || !city) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Check if customer exists or create new
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const custHeaders = customerRows[0] || [];
        let existingCustId = null;
        let existingRowIndex = -1;

        for (let i = 1; i < customerRows.length; i++) {
            if (customerRows[i][custHeaders.indexOf('Phone')] === customerPhone) {
                existingCustId = customerRows[i][custHeaders.indexOf('CustomerID')];
                existingRowIndex = i + 1;
                break;
            }
        }

        let customerId = existingCustId || generateId('CUST');

        if (existingRowIndex > 0) {
            // Update existing customer address if provided
            if (address) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Address'), address);
            if (city) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('City'), city);
            if (pincode) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Pincode'), pincode);
            await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Name'), customerName);
        } else {
            // Create New Customer
            const customerRow = [
                getTimestamp(),
                customerId,
                customerName,
                customerPhone,
                '', // Email
                city || '',
                pincode || '',
                address || '',
            ];
            await appendRow(SHEET_TABS.CUSTOMERS, customerRow);
        }

        // Generate Request ID
        const requestId = generateId('REQ');

        // Headers: Timestamp, RequestID, CustomerID, ElectricianID, ServiceType, Status, PreferredDate, PreferredSlot, Description
        // Note: We are using a fixed mapping based on the verified sheet headers to avoid dynamic fetch errors.

        let description = issueDetail || '';
        if (urgency) description = `${description} [Urgency: ${urgency}]`;

        const requestRow = [
            getTimestamp(),   // 0: Timestamp
            requestId,        // 1: RequestID
            customerId,       // 2: CustomerID
            'BROADCAST',      // 3: ElectricianID
            serviceType,      // 4: ServiceType
            REQUEST_STATUS.NEW, // 5: Status
            urgency,          // 6: Urgency
            preferredDate || '', // 7: PreferredDate
            preferredSlot || '', // 8: PreferredSlot
            description,      // 9: Description
            city || '',       // 10: City
            pincode || '',    // 11: Pincode
            address || '',    // 12: Address
            lat || '',        // 13: Lat
            lng || '',        // 14: Lng
        ];

        await appendRow(SHEET_TABS.SERVICE_REQUESTS, requestRow);

        return NextResponse.json({
            success: true,
            requestId,
            customerId,
            message: 'Broadcast request created successfully'
        });

    } catch (error: any) {
        console.error('Create broadcast request error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
