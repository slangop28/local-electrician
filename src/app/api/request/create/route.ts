import { NextRequest, NextResponse } from 'next/server';
import { appendRow, SHEET_TABS } from '@/lib/google-sheets';
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
        } = body;

        // Validate required fields
        if (!electricianId || !serviceType || !urgency || !customerName || !customerPhone) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Generate IDs
        const requestId = generateId('REQ');
        const customerId = generateId('CUST');

        // First, save customer to Customers sheet
        // Columns: Timestamp, CustomerID, Name, Phone, Email, City, Pincode, Lat, Lng
        const customerRow = [
            getTimestamp(),
            customerId,
            customerName,
            customerPhone,
            '', // Email (optional)
            '', // City
            '', // Pincode
            '', // Lat
            '', // Lng
        ];

        await appendRow(SHEET_TABS.CUSTOMERS, customerRow);

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
