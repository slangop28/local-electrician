import { NextRequest, NextResponse } from 'next/server';
import { appendRow, getRows, SHEET_TABS } from '@/lib/google-sheets';
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

        // Check if user exists by phone or email
        let existingUser = null;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (phone && row[phoneIndex] === phone) {
                existingUser = row;
                break;
            }
            if (email && row[emailIndex] === email) {
                existingUser = row;
                break;
            }
        }

        if (existingUser) {
            // User exists - check if they're an electrician
            const userId = existingUser[userIdIndex];
            const storedUserType = existingUser[userTypeIndex] || 'customer';
            const username = existingUser[usernameIndex];

            // Check if user is a registered electrician
            let electricianData = null;
            if (storedUserType === 'electrician' || phone) {
                const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
                const elecHeaders = electricianRows[0] || [];
                const elecPhoneIndex = elecHeaders.indexOf('PhonePrimary');
                const elecIdIndex = elecHeaders.indexOf('ElectricianID');
                const elecStatusIndex = elecHeaders.indexOf('Status');

                for (let i = 1; i < electricianRows.length; i++) {
                    if (electricianRows[i][elecPhoneIndex] === phone) {
                        electricianData = {
                            electricianId: electricianRows[i][elecIdIndex],
                            status: electricianRows[i][elecStatusIndex]
                        };
                        break;
                    }
                }
            }

            return NextResponse.json({
                success: true,
                isNewUser: false,
                user: {
                    id: userId,
                    phone: existingUser[phoneIndex] || null,
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
