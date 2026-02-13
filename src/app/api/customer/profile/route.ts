import { NextRequest, NextResponse } from 'next/server';
import { getRows, updateRow, appendRow, SHEET_TABS } from '@/lib/google-sheets';
import { getTimestamp, generateId } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const email = searchParams.get('email');

        if (!phone && !email) {
            return NextResponse.json(
                { success: false, error: 'Phone number or email is required' },
                { status: 400 }
            );
        }

        // ===== 1. Try Supabase first =====
        let query = supabaseAdmin.from('customers').select('*');
        if (phone) query = query.eq('phone', phone);
        else if (email) query = query.eq('email', email);

        const { data: supaCustomer } = await query.maybeSingle();

        if (supaCustomer) {
            return NextResponse.json({
                success: true,
                customer: {
                    customerId: supaCustomer.customer_id,
                    name: supaCustomer.name,
                    phone: supaCustomer.phone,
                    email: supaCustomer.email || '',
                    city: supaCustomer.city || '',
                    pincode: supaCustomer.pincode || '',
                    address: supaCustomer.address || '',
                }
            });
        }

        // ===== 2. Fallback to Google Sheets =====
        const rows = await getRows(SHEET_TABS.CUSTOMERS);
        const headers = rows[0] || [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowPhone = row[headers.indexOf('Phone')];
            const rowEmail = row[headers.indexOf('Email')];

            if ((phone && rowPhone === phone) || (email && rowEmail === email)) {
                return NextResponse.json({
                    success: true,
                    customer: {
                        customerId: row[headers.indexOf('CustomerID')],
                        name: row[headers.indexOf('Name')],
                        phone: rowPhone,
                        email: rowEmail || '',
                        city: row[headers.indexOf('City')] || '',
                        pincode: row[headers.indexOf('Pincode')] || '',
                        address: row[headers.indexOf('Address')] || '',
                    }
                });
            }
        }

        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });

    } catch (error) {
        console.error('Get customer profile error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, name, email, city, pincode, address } = body;

        if (!phone && !email) {
            return NextResponse.json(
                { success: false, error: 'Phone number or email is required' },
                { status: 400 }
            );
        }

        let customerId = '';

        // ===== 1. Supabase upsert (primary) =====
        let query = supabaseAdmin.from('customers').select('customer_id');
        if (phone) query = query.eq('phone', phone);
        else if (email) query = query.eq('email', email);

        const { data: existingCust } = await query.maybeSingle();

        if (existingCust) {
            customerId = existingCust.customer_id;
            // Supabase types check
            await supabaseAdmin
                .from('customers')
                .update({
                    ...(name !== undefined && { name }),
                    ...(email !== undefined && { email }),
                    ...(phone !== undefined && { phone }),
                    ...(city !== undefined && { city }),
                    ...(pincode !== undefined && { pincode }),
                    ...(address !== undefined && { address }),
                })
                .eq('customer_id', customerId);
        } else {
            customerId = generateId('CUST');
            await supabaseAdmin.from('customers').insert({
                customer_id: customerId,
                name: name || '',
                phone: phone || '',
                email: email || '',
                city: city || '',
                pincode: pincode || '',
                address: address || ''
            });
        }

        // ===== 2. Google Sheets sync (secondary) =====
        try {
            const rows = await getRows(SHEET_TABS.CUSTOMERS);
            const headers = rows[0] || [];

            let rowIndex = -1;

            for (let i = 1; i < rows.length; i++) {
                const rowPhone = rows[i][headers.indexOf('Phone')];
                const rowEmail = rows[i][headers.indexOf('Email')];

                if ((phone && rowPhone === phone) || (email && rowEmail === email)) {
                    rowIndex = i + 1;
                    break;
                }
            }

            if (rowIndex > 0) {
                const updates = [
                    { col: headers.indexOf('Name'), val: name },
                    { col: headers.indexOf('Email'), val: email },
                    { col: headers.indexOf('City'), val: city },
                    { col: headers.indexOf('Pincode'), val: pincode },
                    { col: headers.indexOf('Address'), val: address }
                ];

                for (const update of updates) {
                    if (update.col !== -1 && update.val !== undefined) {
                        await updateRow(SHEET_TABS.CUSTOMERS, rowIndex, update.col, update.val);
                    }
                }
            } else {
                const newRow = [
                    getTimestamp(),
                    customerId,
                    name || '',
                    phone || '',
                    email || '',
                    city || '',
                    pincode || '',
                    address || ''
                ];
                await appendRow(SHEET_TABS.CUSTOMERS, newRow);
            }
        } catch (sheetsErr) {
            console.error('[Customer Profile] Google Sheets sync error:', sheetsErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            customerId
        });

    } catch (error) {
        console.error('Update customer profile error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
