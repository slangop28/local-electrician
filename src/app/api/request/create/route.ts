import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { generateId, getTimestamp, REQUEST_STATUS } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

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

        // ===== 1. Check/create customer in Supabase =====
        let customerId = '';

        const { data: existingCust } = await supabaseAdmin
            .from('customers')
            .select('customer_id')
            .eq('phone', customerPhone)
            .single();

        if (existingCust) {
            customerId = existingCust.customer_id;
            // Update address if provided
            if (address || city || pincode) {
                await supabaseAdmin
                    .from('customers')
                    .update({
                        ...(address && { address }),
                        ...(city && { city }),
                        ...(pincode && { pincode }),
                        ...(customerName && { name: customerName })
                    })
                    .eq('customer_id', customerId);
            }
        } else {
            customerId = generateId('CUST');
            await supabaseAdmin.from('customers').insert({
                customer_id: customerId,
                name: customerName,
                phone: customerPhone,
                email: '',
                city: city || '',
                pincode: pincode || '',
                address: address || ''
            });
        }

        // ===== 2. Also sync customer to Google Sheets =====
        try {
            const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
            const custHeaders = customerRows[0] || [];
            let existingRowIndex = -1;

            for (let i = 1; i < customerRows.length; i++) {
                if (customerRows[i][custHeaders.indexOf('Phone')] === customerPhone) {
                    existingRowIndex = i + 1;
                    break;
                }
            }

            if (existingRowIndex > 0) {
                if (address) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Address'), address);
                if (city) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('City'), city);
                if (pincode) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Pincode'), pincode);
                await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Name'), customerName);
            } else {
                const customerRow = [
                    getTimestamp(),
                    customerId,
                    customerName,
                    customerPhone,
                    '',
                    city || '',
                    pincode || '',
                    address || '',
                ];
                await appendRow(SHEET_TABS.CUSTOMERS, customerRow);
            }
        } catch (sheetsErr) {
            console.error('[Request/Create] Google Sheets customer sync error:', sheetsErr);
        }

        // ===== 3. Create service request in Supabase =====
        const requestId = generateId('REQ');

        await supabaseAdmin.from('service_requests').insert({
            request_id: requestId,
            customer_id: customerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: address || '',
            customer_city: city || '',
            electrician_id: electricianId,
            service_type: serviceType,
            description: issueDetail || '',
            preferred_date: preferredDate || '',
            preferred_slot: preferredSlot || '',
            status: REQUEST_STATUS.NEW,
        });

        // ===== 4. Also write to Google Sheets =====
        try {
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
                '',
                REQUEST_STATUS.NEW,
            ];
            await appendRow(SHEET_TABS.SERVICE_REQUESTS, requestRow);
        } catch (sheetsErr) {
            console.error('[Request/Create] Google Sheets request sync error:', sheetsErr);
        }

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
