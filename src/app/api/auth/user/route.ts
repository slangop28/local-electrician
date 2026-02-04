import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, updateRow, SHEET_TABS } from '@/lib/google-sheets';
import { generateId } from '@/lib/utils';

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

        // Get existing users
        const rows = await getRows(SHEET_TABS.USERS);
        const headers = rows[0] || [];
        const phoneIndex = headers.indexOf('Phone');
        const emailIndex = headers.indexOf('Email');
        const userIdIndex = headers.indexOf('UserID');
        const usernameIndex = headers.indexOf('Username');
        const userTypeIndex = headers.indexOf('UserType');

        console.log('[Auth API] Headers:', headers);
        console.log('[Auth API] Indices - Phone:', phoneIndex, 'Email:', emailIndex);

        // Check if user exists by phone or email
        let existingUser = null;
        let existingUserIndex = -1;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowUserType = row[userTypeIndex];

            // Prioritize UserType match to distinguish between Customer and Electrician accounts
            if (phone && row[phoneIndex] === phone && rowUserType === userType) {
                existingUser = row;
                existingUserIndex = i;
                console.log('[Auth API] Found existing user by phone + userType');
                break;
            }
            if (email && row[emailIndex] === email && rowUserType === userType) {
                existingUser = row;
                existingUserIndex = i;
                console.log('[Auth API] Found existing user by email + userType');
                break;
            }
        }

        if (existingUser) {
            // User exists - check if they're an electrician
            const userId = existingUser[userIdIndex];
            const storedUserType = existingUser[userTypeIndex] || 'customer';
            const username = existingUser[usernameIndex];

            let existingPhone = existingUser[phoneIndex];

            // CRITICAL: If we found user by email but they don't have a phone stored, 
            // and the current request HAS a phone (e.g. from a previous step or merged data), 
            // we should update the Users sheet!
            // BUT for social login, 'phone' is usually undefined in the request body.
            // So this only helps if we somehow pass phone + email.

            // If we have a phone in the request but not in the sheet, update the sheet
            if (phone && !existingPhone && existingUserIndex !== -1) {
                try {
                    const { updateRow } = await import('@/lib/google-sheets');
                    // Update phone (1-based row index)
                    await updateRow(SHEET_TABS.USERS, existingUserIndex + 1, phoneIndex, phone);
                    console.log('[Auth API] Updated missing phone for user:', email);
                    existingPhone = phone; // Use it for lookup below
                } catch (e) {
                    console.error('[Auth API] Failed to update user phone:', e);
                }
            }

            // Check if user is a registered electrician
            let electricianData: { electricianId: string; status: string; phone: string } | null = null;

            // Only check electrician status if the user is logging in AS an electrician
            if (userType === 'electrician') {
                const searchPhone = phone || existingPhone; // Use request phone or stored phone
                const searchEmail = email || existingUser[emailIndex]; // Use request email or stored email

                console.log('[Auth API] Checking electrician status for phone:', searchPhone, 'email:', searchEmail);

                // Get electrician sheet data
                const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
                const elecHeaders = electricianRows[0] || [];
                const elecPhoneIndex = elecHeaders.indexOf('PhonePrimary');
                const elecIdIndex = elecHeaders.indexOf('ElectricianID');
                const elecStatusIndex = elecHeaders.indexOf('Status');
                const elecEmailIndex = elecHeaders.indexOf('Email'); // Try to find Email column if it exists

                if (searchPhone) {
                    for (let i = 1; i < electricianRows.length; i++) {
                        if (electricianRows[i][elecPhoneIndex] === searchPhone) {
                            electricianData = {
                                electricianId: electricianRows[i][elecIdIndex],
                                status: electricianRows[i][elecStatusIndex],
                                phone: electricianRows[i][elecPhoneIndex]
                            };
                            console.log('[Auth API] Found electrician profile by phone:', electricianData);
                            break;
                        }
                    }
                }

                // If not found by phone and we have email, try email lookup
                if (!electricianData && searchEmail && elecEmailIndex !== -1) {
                    for (let i = 1; i < electricianRows.length; i++) {
                        if (electricianRows[i][elecEmailIndex] === searchEmail) {
                            const elecPhone = electricianRows[i][elecPhoneIndex];
                            electricianData = {
                                electricianId: electricianRows[i][elecIdIndex],
                                status: electricianRows[i][elecStatusIndex],
                                phone: elecPhone
                            };
                            console.log('[Auth API] Found electrician profile by email:', electricianData);

                            // Sync phone back to Users sheet if missing
                            if (elecPhone && !existingPhone && existingUserIndex !== -1) {
                                try {
                                    await updateRow(SHEET_TABS.USERS, existingUserIndex + 1, phoneIndex, elecPhone);
                                    console.log('[Auth API] Synced phone from Electricians to Users for:', searchEmail);
                                    existingPhone = elecPhone;
                                } catch (e) {
                                    console.error('[Auth API] Failed to sync phone:', e);
                                }
                            }
                            break;
                        }
                    }
                }

                if (!electricianData) {
                    console.log('[Auth API] No electrician profile found by phone or email');
                }
            }

            return NextResponse.json({
                success: true,
                isNewUser: false,
                user: {
                    id: userId,
                    // Use electrician's phone if we found one and user doesn't have phone stored
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

        // Create new user
        const timestamp = new Date().toISOString();
        const userId = generateId('USER');
        const username = generateUsername();

        const newRow = [
            timestamp,          // Timestamp
            userId,             // UserID
            phone || '',        // Phone
            email || '',        // Email
            name || '',         // Name
            authProvider,       // AuthProvider
            userType || 'customer', // UserType
            username,           // Username
            timestamp,          // CreatedAt
            timestamp           // LastLogin
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
