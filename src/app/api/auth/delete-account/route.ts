import { NextRequest, NextResponse } from 'next/server';
import { getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
    try {
        const { userId, userType } = await request.json();

        if (!userId || !userType) {
            return NextResponse.json(
                { success: false, error: 'User ID and User Type are required' },
                { status: 400 }
            );
        }

        if (userType === 'electrician') {
            const rows = await getRows(SHEET_TABS.ELECTRICIANS);
            const headers = rows[0] || [];
            const idIndex = headers.indexOf('ElectricianID');
            const statusIndex = headers.indexOf('Status');

            if (idIndex === -1 || statusIndex === -1) {
                return NextResponse.json({ success: false, error: 'Invalid sheet structure' }, { status: 500 });
            }

            const rowIndex = rows.findIndex((row: string[]) => row[idIndex] === userId);

            if (rowIndex === -1) {
                return NextResponse.json({ success: false, error: 'Electrician not found' }, { status: 404 });
            }

            // Update status to DELETED
            // rowIndex needs +1 because sheets are 1-indexed
            await updateRow(SHEET_TABS.ELECTRICIANS, rowIndex + 1, statusIndex, 'DELETED');

            // Also mark in Users sheet if possible to prevent login
            // We need to find the user in Users sheet using phone or electricanId logic matches
            // But simplest is to trust the client to logout. 
            // Ideally we should also find the user in USERS sheet and mangle the data.

            // Let's try to find in USERS sheet by searching for this electricianId if strictly linked, 
            // but Users sheet links by Phone usually.
            const phoneIndex = headers.indexOf('PhonePrimary');
            const phone = rows[rowIndex][phoneIndex];

            if (phone) {
                const userRows = await getRows(SHEET_TABS.USERS);
                const userHeaders = userRows[0];
                const userPhoneIndex = userHeaders.indexOf('Phone');

                const userRowIndex = userRows.findIndex((row: string[]) => row[userPhoneIndex] === phone);
                if (userRowIndex !== -1) {
                    // Mangle phone to prevent login
                    await updateRow(SHEET_TABS.USERS, userRowIndex + 1, userPhoneIndex, `DELETED_${phone}`);
                }
            }

            return NextResponse.json({ success: true, message: 'Account deleted successfully' });

        } else {
            // Customer Deletion
            const rows = await getRows(SHEET_TABS.USERS);
            const headers = rows[0] || [];
            const idIndex = headers.indexOf('UserID');
            const phoneIndex = headers.indexOf('Phone');
            const emailIndex = headers.indexOf('Email');
            const nameIndex = headers.indexOf('Name');

            if (idIndex === -1) {
                return NextResponse.json({ success: false, error: 'Invalid sheet structure' }, { status: 500 });
            }

            const rowIndex = rows.findIndex((row: string[]) => row[idIndex] === userId);

            if (rowIndex === -1) {
                return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
            }

            // We verify it's a customer to avoid deleting admin/electrician by mistake if passed wrong userType
            // But we trust the input for now combined with the sheet logic.

            // Mangle PII data to "Delete"
            // We can't actually DELETE the row easily without shifting everything, so we update values.
            const rowNumber = rowIndex + 1;

            if (phoneIndex !== -1) await updateRow(SHEET_TABS.USERS, rowNumber, phoneIndex, `DELETED_${rows[rowIndex][phoneIndex]}`);
            if (emailIndex !== -1) await updateRow(SHEET_TABS.USERS, rowNumber, emailIndex, `DELETED_${rows[rowIndex][emailIndex]}`);
            if (nameIndex !== -1) await updateRow(SHEET_TABS.USERS, rowNumber, nameIndex, 'DELETED_USER');

            return NextResponse.json({ success: true, message: 'Account deleted successfully' });
        }

    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}
