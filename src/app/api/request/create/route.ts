import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { generateId, getTimestamp, REQUEST_STATUS } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            electricianId,
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
        } = body;

        // Validate required fields
        if (!electricianId || !serviceType || !urgency || !customerName || !customerPhone) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Check if customer exists
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
            // Update existing customer with new address if provided
            if (address) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Address'), address);
            if (city) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('City'), city);
            if (pincode) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Pincode'), pincode);
            // Update name if it was empty or changed? Let's just update name to be sure
            await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Name'), customerName);
        } else {
            // Create New Customer
            // Columns: Timestamp, CustomerID, Name, Phone, Email, City, Pincode, Address
            // Note: Changed schema slightly to include Address at end if not present
            const customerRow = [
                getTimestamp(),
                customerId,
                customerName,
                customerPhone,
                '', // Email
                city || '',
                pincode || '',
                address || '', // Using Address column
            ];
            await appendRow(SHEET_TABS.CUSTOMERS, customerRow);
        }

        // Generate Request ID
        const requestId = generateId('REQ');

        // Save service request
        // Columns: Timestamp, RequestID, CustomerID, ElectricianID, ServiceType, 
        // Urgency, PreferredDate, PreferredSlot, IssueDetail, IssuePhotoURL, Status
        const requestRow = [
            getTimestamp(),
            requestId,
            customerId,
            electricianId,
            serviceType,
            urgency,
            preferredDate || '',
            preferredSlot || '',
            issueDetail || '',
            '', // IssuePhotoURL (optional)
            REQUEST_STATUS.NEW,
        ];

        await appendRow(SHEET_TABS.SERVICE_REQUESTS, requestRow);

        return NextResponse.json({
            success: true,
            requestId,
            customerId,
            message: 'Service request created successfully'
        });

    } catch (error) {
        console.error('Create request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create request'
        }, { status: 500 });
    }
}
