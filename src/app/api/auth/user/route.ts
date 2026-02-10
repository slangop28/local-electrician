import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { generateId, getTimestamp } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

// Generate a unique username
function generateUsername(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'USER-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// POST - Create or login user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, email, name, authProvider, userType } = body;

        if (!authProvider) {
            return NextResponse.json(
                { success: false, error: 'Auth provider is required' },
                { status: 400 }
            );
        }

        // ===== 1. Check Supabase first (fast) =====
        let supaUser = null;

        if (phone) {
            const { data } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('phone', phone)
                .eq('user_type', userType || 'customer')
                .single();
            if (data) supaUser = data;
        }

        if (!supaUser && email) {
            const { data } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('user_type', userType || 'customer')
                .single();
            if (data) supaUser = data;
        }

        // ===== 2. If found in Supabase =====
        if (supaUser) {
            // Update last_login
            await supabaseAdmin
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('user_id', supaUser.user_id);

            // Check electrician status
            let electricianData = null;
            if (userType === 'electrician') {
                electricianData = await findElectricianInSupabase(
                    phone || supaUser.phone,
                    email || supaUser.email
                );
            }

            return NextResponse.json({
                success: true,
                isNewUser: false,
                user: {
                    id: supaUser.user_id,
                    phone: supaUser.phone || electricianData?.phone || null,
                    email: supaUser.email || null,
                    name: supaUser.name || null,
                    username: supaUser.username,
                    userType: supaUser.user_type,
                    authProvider: authProvider,
                    isElectrician: !!electricianData,
                    electricianStatus: electricianData?.status || null,
                    electricianId: electricianData?.electricianId || null
                }
            });
        }

        // ===== 3. Fallback: Check Google Sheets =====
        const rows = await getRows(SHEET_TABS.USERS);
        const headers = rows[0] || [];
        const phoneIndex = headers.indexOf('Phone');
        const emailIndex = headers.indexOf('Email');
        const userIdIndex = headers.indexOf('UserID');
        const usernameIndex = headers.indexOf('Username');
        const userTypeIndex = headers.indexOf('UserType');

        let existingUser = null;
        let existingUserIndex = -1;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowUserType = row[userTypeIndex];

            if (phone && row[phoneIndex] === phone && rowUserType === userType) {
                existingUser = row;
                existingUserIndex = i;
                break;
            }
            if (email && row[emailIndex] === email && rowUserType === userType) {
                existingUser = row;
                existingUserIndex = i;
                break;
            }
        }

        if (existingUser) {
            const userId = existingUser[userIdIndex];
            const storedUserType = existingUser[userTypeIndex] || 'customer';
            const username = existingUser[usernameIndex];
            let existingPhone = existingUser[phoneIndex];

            // Update missing phone
            if (phone && !existingPhone && existingUserIndex !== -1) {
                try {
                    await updateRow(SHEET_TABS.USERS, existingUserIndex + 1, phoneIndex, phone);
                    existingPhone = phone;
                } catch (e) {
                    console.error('[Auth API] Failed to update user phone:', e);
                }
            }

            // Sync to Supabase (backfill from Sheets)
            try {
                await supabaseAdmin.from('users').upsert({
                    user_id: userId,
                    phone: existingPhone || phone || null,
                    email: existingUser[emailIndex] || email || null,
                    name: existingUser[headers.indexOf('Name')] || name || null,
                    auth_provider: authProvider,
                    user_type: storedUserType,
                    username: username,
                    last_login: new Date().toISOString()
                }, { onConflict: 'user_id' });
            } catch (syncErr) {
                console.error('[Auth API] Supabase sync error:', syncErr);
            }

            // Check electrician status
            let electricianData = null;
            if (userType === 'electrician') {
                electricianData = await findElectricianInSupabase(
                    phone || existingPhone,
                    email || existingUser[emailIndex]
                );

                // Fallback to Sheets if not in Supabase
                if (!electricianData) {
                    electricianData = await findElectricianInSheets(
                        phone || existingPhone,
                        email || existingUser[emailIndex]
                    );
                }
            }

            return NextResponse.json({
                success: true,
                isNewUser: false,
                user: {
                    id: userId,
                    phone: existingPhone || electricianData?.phone || null,
                    email: existingUser[emailIndex] || null,
                    name: existingUser[headers.indexOf('Name')] || null,
                    username: username,
                    userType: storedUserType,
                    authProvider: authProvider,
                    isElectrician: !!electricianData,
                    electricianStatus: electricianData?.status || null,
                    electricianId: electricianData?.electricianId || null
                }
            });
        }

        // ===== 4. Create new user in both Supabase + Google Sheets =====
        const timestamp = getTimestamp();
        const userId = generateId('USER');
        const username = generateUsername();

        // Write to Supabase first (primary)
        try {
            await supabaseAdmin.from('users').insert({
                user_id: userId,
                phone: phone || null,
                email: email || null,
                name: name || null,
                auth_provider: authProvider,
                user_type: userType || 'customer',
                username: username,
            });
        } catch (supaErr) {
            console.error('[Auth API] Supabase insert error:', supaErr);
        }

        // Write to Google Sheets (secondary)
        const newRow = [
            timestamp,
            userId,
            phone || '',
            email || '',
            name || '',
            authProvider,
            userType || 'customer',
            username,
            timestamp,
            timestamp
        ];
        await appendRow(SHEET_TABS.USERS, newRow);

        return NextResponse.json({
            success: true,
            isNewUser: true,
            user: {
                id: userId,
                phone: phone || null,
                email: email || null,
                name: name || null,
                username: username,
                userType: userType || 'customer',
                authProvider: authProvider,
                isElectrician: false,
                electricianStatus: null,
                electricianId: null
            }
        });
    } catch (error) {
        console.error('User API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process user' },
            { status: 500 }
        );
    }
}

// GET - Get user by phone or email
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const email = searchParams.get('email');

        if (!phone && !email) {
            return NextResponse.json(
                { success: false, error: 'Phone or email is required' },
                { status: 400 }
            );
        }

        // Try Supabase first
        let query = supabaseAdmin.from('users').select('*');
        if (phone) query = query.eq('phone', phone);
        else if (email) query = query.eq('email', email);

        const { data: supaUser } = await query.single();

        if (supaUser) {
            return NextResponse.json({
                success: true,
                user: {
                    id: supaUser.user_id,
                    phone: supaUser.phone || null,
                    email: supaUser.email || null,
                    name: supaUser.name || null,
                    username: supaUser.username,
                    userType: supaUser.user_type || 'customer',
                    authProvider: supaUser.auth_provider
                }
            });
        }

        // Fallback to Google Sheets
        const rows = await getRows(SHEET_TABS.USERS);
        const headers = rows[0] || [];
        const phoneIndex = headers.indexOf('Phone');
        const emailIndex = headers.indexOf('Email');

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if ((phone && row[phoneIndex] === phone) || (email && row[emailIndex] === email)) {
                return NextResponse.json({
                    success: true,
                    user: {
                        id: row[headers.indexOf('UserID')],
                        phone: row[phoneIndex] || null,
                        email: row[emailIndex] || null,
                        name: row[headers.indexOf('Name')] || null,
                        username: row[headers.indexOf('Username')],
                        userType: row[headers.indexOf('UserType')] || 'customer',
                        authProvider: row[headers.indexOf('AuthProvider')]
                    }
                });
            }
        }

        return NextResponse.json({
            success: false,
            error: 'User not found'
        }, { status: 404 });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get user' },
            { status: 500 }
        );
    }
}

// Helper: Find electrician in Supabase
async function findElectricianInSupabase(phone: string | null, email: string | null) {
    if (phone) {
        const { data } = await supabaseAdmin
            .from('electricians')
            .select('electrician_id, status, phone_primary')
            .eq('phone_primary', phone)
            .single();
        if (data) return { electricianId: data.electrician_id, status: data.status, phone: data.phone_primary };
    }
    if (email) {
        const { data } = await supabaseAdmin
            .from('electricians')
            .select('electrician_id, status, phone_primary')
            .eq('email', email)
            .single();
        if (data) return { electricianId: data.electrician_id, status: data.status, phone: data.phone_primary };
    }
    return null;
}

// Helper: Find electrician in Google Sheets
async function findElectricianInSheets(phone: string | null, email: string | null) {
    try {
        const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
        const elecHeaders = electricianRows[0] || [];
        const elecPhoneIndex = elecHeaders.indexOf('PhonePrimary');
        const elecIdIndex = elecHeaders.indexOf('ElectricianID');
        const elecStatusIndex = elecHeaders.indexOf('Status');
        const elecEmailIndex = elecHeaders.indexOf('Email');

        if (phone) {
            for (let i = 1; i < electricianRows.length; i++) {
                if (electricianRows[i][elecPhoneIndex] === phone) {
                    return {
                        electricianId: electricianRows[i][elecIdIndex],
                        status: electricianRows[i][elecStatusIndex],
                        phone: electricianRows[i][elecPhoneIndex]
                    };
                }
            }
        }

        if (email && elecEmailIndex !== -1) {
            for (let i = 1; i < electricianRows.length; i++) {
                if (electricianRows[i][elecEmailIndex] === email) {
                    return {
                        electricianId: electricianRows[i][elecIdIndex],
                        status: electricianRows[i][elecStatusIndex],
                        phone: electricianRows[i][elecPhoneIndex]
                    };
                }
            }
        }
    } catch (e) {
        console.error('[Auth API] Sheets electrician lookup error:', e);
    }
    return null;
}
