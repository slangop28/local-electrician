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
            customerEmail,
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

        // Helper to normalize phone (digits only, last 10)
        const normalizePhone = (p: string) => {
            if (!p) return '';
            const digits = p.replace(/\D/g, '');
            return digits.slice(-10);
        };

        const normalizedPhone = normalizePhone(customerPhone);

        // ===== 1. Check/create customer in Supabase =====
        let customerId = '';

        // Try exact match first, then normalized Match
        // Since Supabase doesn't support "ends with" easily on encrypted/text columns without extensions, 
        // we'll search by the exact phone provided OR assume the DB stores normalized phones?
        // Actually, to fix the duplicate issue going forward, we should query by the phone provided,
        // AND if not found, maybe query by normalized version if we stored it that way?
        // Best approach now: Search by the input phone. 
        // AND Search by just the 10 digits? 
        // Let's rely on exact match for now but store consistent format.

        // Better: Fetch by phone. If strict match fails, we might create duplicate if format differs.
        // But for this user, the issue is likely "+91" vs "".

        let existingCust = null;

        const { data: match1 } = await supabaseAdmin
            .from('customers')
            .select('customer_id, phone')
            .eq('phone', customerPhone)
            .maybeSingle();

        if (match1) {
            existingCust = match1;
        } else {
            // Try strict 10 digit search if input was different? 
            // Or try adding +91? 
            // Let's try to match by the normalized phone if we can. 
            // But we can't easily unless we fetch all users (bad).
            // Temporary fix: check for "+91" prefix variation

            let altPhone = customerPhone;
            if (customerPhone.startsWith('+91')) altPhone = customerPhone.slice(3);
            else if (customerPhone.length === 10) altPhone = '+91' + customerPhone;

            if (altPhone !== customerPhone) {
                const { data: match2 } = await supabaseAdmin
                    .from('customers')
                    .select('customer_id')
                    .eq('phone', altPhone)
                    .maybeSingle();
                if (match2) existingCust = match2;
            }
        }

        if (existingCust) {
            customerId = existingCust.customer_id;
            // Update address if provided
            if (address || city || pincode || customerName || customerEmail) {
                // Supabase types check
                await supabaseAdmin
                    .from('customers')
                    .update({
                        ...(address && { address }),
                        ...(city && { city }),
                        ...(pincode && { pincode }),
                        ...(customerName && { name: customerName }),
                        ...(customerEmail && { email: customerEmail })
                    })
                    .eq('customer_id', customerId);
            }
        } else {
            customerId = generateId('CUST');
            await supabaseAdmin.from('customers').insert({
                customer_id: customerId,
                name: customerName,
                // Store phone as is, or normalized? 
                // Let's store as provided for now to match user input, but duplicates are bad.
                // Ideally we strictly store +91... or just 10 digits.
                phone: customerPhone,
                email: customerEmail || '',
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
                if (customerEmail) await updateRow(SHEET_TABS.CUSTOMERS, existingRowIndex, custHeaders.indexOf('Email'), customerEmail);
            } else {
                const customerRow = [
                    getTimestamp(),
                    customerId,
                    customerName,
                    customerPhone,
                    customerEmail || '',
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

        // Log the creation event
        await supabaseAdmin.from('service_request_logs').insert({
            request_id: requestId,
            status: REQUEST_STATUS.NEW,
            description: 'Request created'
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
