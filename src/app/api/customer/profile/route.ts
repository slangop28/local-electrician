import { NextRequest, NextResponse } from 'next/server';
import { getRows, updateRow, appendRow, SHEET_TABS } from '@/lib/google-sheets';
import { getTimestamp, generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const rows = await getRows(SHEET_TABS.CUSTOMERS);
        const headers = rows[0] || [];

        // Find customer by phone
        // Headers: Timestamp, CustomerID, Name, Phone, Email, City, Pincode, Address
        let customer = null;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[headers.indexOf('Phone')] === phone) {
                customer = {
                    customerId: row[headers.indexOf('CustomerID')],
                    name: row[headers.indexOf('Name')],
                    phone: row[headers.indexOf('Phone')],
                    email: row[headers.indexOf('Email')] || '',
                    city: row[headers.indexOf('City')] || '',
                    pincode: row[headers.indexOf('Pincode')] || '',
                    address: row[headers.indexOf('Address')] || '',
                };
                break;
            }
        }

        if (customer) {
            return NextResponse.json({ success: true, customer });
        } else {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
        }

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

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const rows = await getRows(SHEET_TABS.CUSTOMERS);
        const headers = rows[0] || [];

        let rowIndex = -1;
        let customerId = '';

        // Find if customer exists
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][headers.indexOf('Phone')] === phone) {
                rowIndex = i + 1; // 1-based index
                customerId = rows[i][headers.indexOf('CustomerID')];
                break;
            }
        }

        if (rowIndex > 0) {
            // Update existing customer
            // We need to update specific columns
            // This is inefficient with individual cell updates, but safe
            // Ideally should update whole row or use batchUpdate

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
            // Create new customer
            customerId = generateId('CUST');
            const newRow = [
                getTimestamp(),
                customerId,
                name || '',
                phone,
                email || '',
                city || '',
                pincode || '',
                address || '' // Ensure 'Address' column exists
            ];
            await appendRow(SHEET_TABS.CUSTOMERS, newRow);
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
