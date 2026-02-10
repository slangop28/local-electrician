import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

// POST - Validate a stored session by checking if user exists in DB
export async function POST(request: NextRequest) {
    try {
        const { userId, phone, email, userType } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // 1. Check Supabase first (fast)
        const { data: supaUser, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (supaUser && !error) {
            // User found in Supabase - update last_login
            await supabaseAdmin
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('user_id', userId);

            // Check if electrician
            let electricianData = null;
            if (supaUser.user_type === 'electrician' || userType === 'electrician') {
                const lookupPhone = phone || supaUser.phone;
                const lookupEmail = email || supaUser.email;

                if (lookupPhone) {
                    const { data: elec } = await supabaseAdmin
                        .from('electricians')
                        .select('electrician_id, status, phone_primary')
                        .eq('phone_primary', lookupPhone)
                        .single();
                    if (elec) {
                        electricianData = {
                            electricianId: elec.electrician_id,
                            status: elec.status,
                            phone: elec.phone_primary
                        };
                    }
                }

                if (!electricianData && lookupEmail) {
                    const { data: elec } = await supabaseAdmin
                        .from('electricians')
                        .select('electrician_id, status, phone_primary')
                        .eq('email', lookupEmail)
                        .single();
                    if (elec) {
                        electricianData = {
                            electricianId: elec.electrician_id,
                            status: elec.status,
                            phone: elec.phone_primary
                        };
                    }
                }
            }

            return NextResponse.json({
                success: true,
                valid: true,
                user: {
                    id: supaUser.user_id,
                    phone: supaUser.phone,
                    email: supaUser.email,
                    name: supaUser.name,
                    username: supaUser.username,
                    userType: supaUser.user_type,
                    authProvider: supaUser.auth_provider,
                    isElectrician: !!electricianData,
                    electricianStatus: electricianData?.status || null,
                    electricianId: electricianData?.electricianId || null
                }
            });
        }

        // 2. Fallback to Google Sheets
        try {
            const rows = await getRows(SHEET_TABS.USERS);
            const headers = rows[0] || [];
            const userIdIndex = headers.indexOf('UserID');

            for (let i = 1; i < rows.length; i++) {
                if (rows[i][userIdIndex] === userId) {
                    const row = rows[i];
                    return NextResponse.json({
                        success: true,
                        valid: true,
                        user: {
                            id: row[headers.indexOf('UserID')],
                            phone: row[headers.indexOf('Phone')] || null,
                            email: row[headers.indexOf('Email')] || null,
                            name: row[headers.indexOf('Name')] || null,
                            username: row[headers.indexOf('Username')],
                            userType: row[headers.indexOf('UserType')] || 'customer',
                            authProvider: row[headers.indexOf('AuthProvider')],
                            isElectrician: false,
                            electricianStatus: null,
                            electricianId: null
                        }
                    });
                }
            }
        } catch (sheetsError) {
            console.error('[ValidateSession] Google Sheets fallback error:', sheetsError);
        }

        // User not found anywhere
        return NextResponse.json({
            success: true,
            valid: false,
            error: 'User not found'
        });

    } catch (error) {
        console.error('Validate session error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to validate session' },
            { status: 500 }
        );
    }
}
