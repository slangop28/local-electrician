
import { NextRequest, NextResponse } from 'next/server';
import { getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, oldPhone, newPhone } = body;

        if (!userId || !newPhone) {
            return NextResponse.json(
                { success: false, error: 'User ID and new phone number are required' },
                { status: 400 }
            );
        }

        if (newPhone.length !== 10) {
            return NextResponse.json(
                { success: false, error: 'Phone number must be 10 digits' },
                { status: 400 }
            );
        }

        // 1. Check if new phone is already in use (Supabase Users)
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('phone', newPhone)
            .neq('user_id', userId) // Exclude current user (though unlikely if changing)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Phone number already in use' },
                { status: 400 }
            );
        }

        // 2. Check Google Sheets Users (Secondary check)
        const userRows = await getRows(SHEET_TABS.USERS);
        const uHeaders = userRows[0];
        const uPhoneIdx = uHeaders.indexOf('Phone');

        for (let i = 1; i < userRows.length; i++) {
            if (userRows[i][uPhoneIdx] === newPhone) {
                // Check if it's a different user? 
                // We can't easily check UserID here without iterating, but if Supabase didn't catch it, 
                // it might be a sync issue or just a raw sheet entry. Safe to block.
                // However, if the user account is the same, we should allow. 
                // Let's rely on Supabase check mostly, but if we want to be strict:
                if (userRows[i][uHeaders.indexOf('UserID')] !== userId) {
                    return NextResponse.json(
                        { success: false, error: 'Phone number already in use (Sheets)' },
                        { status: 400 }
                    );
                }
            }
        }

        // ===== UPDATE Supabase =====

        // Update 'users' table
        const { error: userUpdateError } = await supabaseAdmin
            .from('users')
            .update({ phone: newPhone })
            .eq('user_id', userId);

        if (userUpdateError) throw userUpdateError;

        // Update 'customers' table (if exists) via oldPhone
        if (oldPhone) {
            await supabaseAdmin
                .from('customers')
                .update({ phone: newPhone })
                .eq('phone', oldPhone);
        }

        // ===== UPDATE Google Sheets =====

        // 1. Update 'Users' Sheet
        const uIdIdx = uHeaders.indexOf('UserID');
        let userRowIndex = -1;

        for (let i = 1; i < userRows.length; i++) {
            if (userRows[i][uIdIdx] === userId) {
                userRowIndex = i + 1;
                break;
            }
        }

        if (userRowIndex !== -1 && uPhoneIdx !== -1) {
            await updateRow(SHEET_TABS.USERS, userRowIndex, uPhoneIdx, newPhone);
        }

        // 2. Update 'Customers' Sheet
        if (oldPhone) {
            const custRows = await getRows(SHEET_TABS.CUSTOMERS);
            const cHeaders = custRows[0];
            const cPhoneIdx = cHeaders.indexOf('Phone');

            let custRowIndex = -1;
            for (let i = 1; i < custRows.length; i++) {
                if (custRows[i][cPhoneIdx] === oldPhone) {
                    custRowIndex = i + 1;
                    break;
                }
            }

            if (custRowIndex !== -1 && cPhoneIdx !== -1) {
                await updateRow(SHEET_TABS.CUSTOMERS, custRowIndex, cPhoneIdx, newPhone);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Phone number updated successfully'
        });

    } catch (error) {
        console.error('Update phone error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update phone number' },
            { status: 500 }
        );
    }
}
