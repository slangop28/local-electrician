import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

// Debug API to check electrician data and user linking
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');

        if (!email && !phone) {
            return NextResponse.json({
                success: false,
                error: 'Provide either email or phone parameter'
            }, { status: 400 });
        }

        const results: Record<string, unknown> = {
            searchEmail: email,
            searchPhone: phone,
            userFound: false,
            electricianFound: false,
            userData: null,
            electricianData: null,
            diagnosis: []
        };

        // Check Users sheet
        const userRows = await getRows(SHEET_TABS.USERS);
        const userHeaders = userRows[0] || [];
        const userPhoneIndex = userHeaders.indexOf('Phone');
        const userEmailIndex = userHeaders.indexOf('Email');

        console.log('[Debug] User headers:', userHeaders);

        for (let i = 1; i < userRows.length; i++) {
            const row = userRows[i];
            if ((email && row[userEmailIndex] === email) || (phone && row[userPhoneIndex] === phone)) {
                results.userFound = true;
                results.userData = {
                    rowIndex: i,
                    userId: row[userHeaders.indexOf('UserID')],
                    phone: row[userPhoneIndex] || 'MISSING',
                    email: row[userEmailIndex] || 'MISSING',
                    name: row[userHeaders.indexOf('Name')] || 'MISSING',
                    userType: row[userHeaders.indexOf('UserType')] || 'MISSING',
                    authProvider: row[userHeaders.indexOf('AuthProvider')] || 'MISSING',
                };

                // Check if phone is missing for social login
                if (!row[userPhoneIndex] && (row[userHeaders.indexOf('AuthProvider')] === 'google' || row[userHeaders.indexOf('AuthProvider')] === 'facebook')) {
                    (results.diagnosis as string[]).push('⚠️ User has social login but NO phone number stored in Users sheet');
                }
                break;
            }
        }

        // Check Electricians sheet
        const elecRows = await getRows(SHEET_TABS.ELECTRICIANS);
        const elecHeaders = elecRows[0] || [];
        const elecPhoneIndex = elecHeaders.indexOf('PhonePrimary');

        console.log('[Debug] Electrician headers:', elecHeaders);

        // Search by phone (from params or from user data)
        const searchPhoneForElec = phone || (results.userData as { phone?: string })?.phone;

        if (searchPhoneForElec && searchPhoneForElec !== 'MISSING') {
            for (let i = 1; i < elecRows.length; i++) {
                const row = elecRows[i];
                if (row[elecPhoneIndex] === searchPhoneForElec) {
                    results.electricianFound = true;
                    results.electricianData = {
                        rowIndex: i,
                        electricianId: row[elecHeaders.indexOf('ElectricianID')],
                        name: row[elecHeaders.indexOf('NameAsPerAadhaar')],
                        phonePrimary: row[elecPhoneIndex],
                        status: row[elecHeaders.indexOf('Status')],
                        city: row[elecHeaders.indexOf('City')],
                        area: row[elecHeaders.indexOf('Area')],
                    };
                    break;
                }
            }
        }

        // Diagnosis
        if (!results.userFound) {
            (results.diagnosis as string[]).push('❌ User not found in Users sheet');
        }

        if (results.userFound && !results.electricianFound) {
            if (!searchPhoneForElec || searchPhoneForElec === 'MISSING') {
                (results.diagnosis as string[]).push('❌ Cannot search Electricians sheet - no phone number available');
            } else {
                (results.diagnosis as string[]).push(`❌ No electrician found with phone: ${searchPhoneForElec}`);
            }
        }

        if (results.electricianFound) {
            (results.diagnosis as string[]).push('✅ Electrician record found');
            const status = (results.electricianData as { status: string })?.status;
            if (status === 'PENDING') {
                (results.diagnosis as string[]).push('⚠️ Electrician status is PENDING (awaiting verification)');
            } else if (status === 'VERIFIED') {
                (results.diagnosis as string[]).push('✅ Electrician is VERIFIED');
            }
        }

        // Check if there's a phone mismatch
        if (results.userFound && (results.userData as { phone?: string })?.phone === 'MISSING' && results.electricianFound) {
            (results.diagnosis as string[]).push('🔧 FIX NEEDED: Phone needs to be copied from Electricians to Users sheet');
        }

        return NextResponse.json({
            success: true,
            ...results
        });

    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
