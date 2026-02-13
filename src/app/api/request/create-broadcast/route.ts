import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { generateId, getTimestamp, REQUEST_STATUS } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

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
            customerEmail,
            address,
            city,
            pincode,
            lat,
            lng,
            electricianId // Optional: specific electrician ID for direct booking
        } = body;

        // Validate required fields
        if (!serviceType || !urgency || !customerName || !customerPhone || !city) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // ===== 1. Check/create customer in Supabase =====
        let customerId = '';

        let existingCust = null;

        // 1. Try search by phone
        const { data: matchPhone } = await supabaseAdmin
            .from('customers')
            .select('customer_id, email, phone')
            .eq('phone', customerPhone)
            .maybeSingle();

        if (matchPhone) {
            existingCust = matchPhone;
        } else {
            // Try alternate phone formats
            let altPhone = customerPhone;
            if (customerPhone.startsWith('+91')) altPhone = customerPhone.slice(3);
            else if (customerPhone.length === 10) altPhone = '+91' + customerPhone;

            if (altPhone !== customerPhone) {
                const { data: matchAlt } = await supabaseAdmin
                    .from('customers')
                    .select('customer_id, email, phone')
                    .eq('phone', altPhone)
                    .maybeSingle();
                if (matchAlt) existingCust = matchAlt;
            }
        }

        // 2. Try search by email if phone didn't match
        if (!existingCust && customerEmail) {
            const { data: matchEmail } = await supabaseAdmin
                .from('customers')
                .select('customer_id, email, phone')
                .eq('email', customerEmail)
                .maybeSingle();
            if (matchEmail) existingCust = matchEmail;
        }

        if (existingCust) {
            customerId = existingCust.customer_id;
            // Update address
            await supabaseAdmin
                .from('customers')
                .update({
                    ...(address && { address }),
                    ...(city && { city }),
                    ...(pincode && { pincode }),
                    ...(customerName && { name: customerName }),
                    ...(customerEmail && { email: customerEmail }),
                    ...(lat && { latitude: parseFloat(lat) }),
                    ...(lng && { longitude: parseFloat(lng) })
                })
                .eq('customer_id', customerId);

            // Sync to users table if logged in
            if (customerEmail) {
                await supabaseAdmin
                    .from('users')
                    .update({
                        phone: customerPhone,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', customerEmail)
                    .is('phone', null); // Only update if phone is currently null
            }
        } else {
            customerId = generateId('CUST');
            await supabaseAdmin.from('customers').insert({
                customer_id: customerId,
                name: customerName,
                phone: customerPhone,
                email: customerEmail || '',
                city: city || '',
                pincode: pincode || '',
                address: address || '',
                ...(lat && { latitude: parseFloat(lat) }),
                ...(lng && { longitude: parseFloat(lng) })
            });
        }

        // ===== 2. Sync customer to Google Sheets =====
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
            console.error('[Broadcast] Google Sheets customer sync error:', sheetsErr);
        }

        // ===== 3. Create broadcast service request in Supabase =====
        const requestId = generateId('REQ');

        let description = issueDetail || '';
        if (urgency) description = `${description} [Urgency: ${urgency}]`;

        // Determine assigned electrician (specific ID or 'BROADCAST')
        const assignedElectrician = electricianId || 'BROADCAST';

        await supabaseAdmin.from('service_requests').insert({
            request_id: requestId,
            customer_id: customerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: address || '',
            customer_city: city || '',
            ...(lat && { customer_lat: parseFloat(lat) }),
            ...(lng && { customer_lng: parseFloat(lng) }),
            electrician_id: assignedElectrician, // Set to specific ID or 'BROADCAST'
            service_type: serviceType,
            description: description,
            preferred_date: preferredDate || '',
            preferred_slot: preferredSlot || '',
            status: REQUEST_STATUS.NEW,
        });

        // Log the creation event
        await supabaseAdmin.from('service_request_logs').insert({
            request_id: requestId,
            status: REQUEST_STATUS.NEW,
            description: electricianId ? `Direct request created for ${electricianId}` : 'Broadcast request created'
        });

        // ===== 4. Also write to Google Sheets =====
        try {
            const requestRow = [
                getTimestamp(),
                requestId,
                customerId,
                assignedElectrician, // Write specific ID or 'BROADCAST'
                serviceType,
                REQUEST_STATUS.NEW,
                urgency || 'High',
                preferredDate || '',
                preferredSlot || '',
                issueDetail || description || '',
                city || '',
                pincode || '',
                address || '',
                lat || '',
                lng || '',
            ];
            await appendRow(SHEET_TABS.SERVICE_REQUESTS, requestRow);
        } catch (sheetsErr) {
            console.error('[Broadcast] Google Sheets request sync error:', sheetsErr);
        }

        return NextResponse.json({
            success: true,
            requestId,
            customerId,
            message: 'Service request created successfully'
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
