import { NextRequest, NextResponse } from 'next/server';
import { appendRow, SHEET_TABS } from '@/lib/google-sheets';
import { geocodeAddress } from '@/lib/geocoding';
import { getTimestamp } from '@/lib/utils';
import { uploadKYCDocument } from '@/lib/cloudinary';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract form fields
        const name = formData.get('name') as string;
        const email = formData.get('email') as string || '';
        const phonePrimary = formData.get('phonePrimary') as string;
        const phoneSecondary = formData.get('phoneSecondary') as string || '';
        const houseNo = formData.get('houseNo') as string;
        const area = formData.get('area') as string;
        const city = formData.get('city') as string;
        const district = formData.get('district') as string || '';
        const state = formData.get('state') as string;
        const pincode = formData.get('pincode') as string;
        let lat = formData.get('lat') as string || '';
        let lng = formData.get('lng') as string || '';
        const referredBy = formData.get('referredBy') as string || '';
        const electricianId = formData.get('electricianId') as string;
        const referralCode = formData.get('referralCode') as string;

        // Bank details
        const bankAccountName = formData.get('bankAccountName') as string || '';
        const bankAccountNumber = formData.get('bankAccountNumber') as string || '';
        const bankIfscCode = formData.get('bankIfscCode') as string || '';

        // Validate required fields
        if (!name || !email || !phonePrimary || !houseNo || !area || !city || !state || !pincode) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // If no coordinates, geocode the address
        if (!lat || !lng) {
            const fullAddress = `${houseNo}, ${area}, ${city}, ${state}, ${pincode}, India`;
            const geoResult = await geocodeAddress(fullAddress);
            if (geoResult) {
                lat = geoResult.lat.toString();
                lng = geoResult.lng.toString();
            }
        }

        // Initialize URLs (no longer uploaded during registration)
        const aadhaarFrontURL = '';
        const aadhaarBackURL = '';
        const panFrontURL = '';

        // ===== 1. Write to Supabase (primary) =====
        try {
            await supabaseAdmin.from('electricians').insert({
                electrician_id: electricianId,
                name: name,
                phone_primary: phonePrimary,
                phone_secondary: phoneSecondary,
                email: email,
                house_no: houseNo,
                area: area,
                city: city,
                district: district,
                state: state,
                pincode: pincode,
                ...(lat && { latitude: parseFloat(lat) }),
                ...(lng && { longitude: parseFloat(lng) }),
                referral_code: referralCode,
                referred_by: referredBy,
                status: 'PENDING',
                total_referrals: 0,
                wallet_balance: 0
            });
        } catch (supaErr) {
            console.error('[Registration] Supabase insert error:', supaErr);
        }

        // Save bank details to Supabase
        if (bankAccountName && bankAccountNumber && bankIfscCode) {
            try {
                await supabaseAdmin.from('bank_details').insert({
                    electrician_id: electricianId,
                    account_holder_name: bankAccountName,
                    account_number: bankAccountNumber,
                    ifsc_code: bankIfscCode,
                    status: 'PENDING'
                });
            } catch (bankErr) {
                console.error('[Registration] Supabase bank details error:', bankErr);
            }
        }

        // ===== 2. Write to Google Sheets (secondary) =====
        const rowData = [
            getTimestamp(),           // Timestamp
            electricianId,            // ElectricianID
            name,                     // NameAsPerAadhaar
            phonePrimary,             // PhonePrimary
            phoneSecondary,           // PhoneSecondary
            aadhaarFrontURL,          // AadhaarFrontURL
            aadhaarBackURL,           // AadhaarBackURL
            panFrontURL,              // PanFrontURL
            houseNo,                  // HouseNo
            area,                     // Area
            city,                     // City
            district,                 // District
            state,                    // State
            pincode,                  // Pincode
            lat,                      // Lat
            lng,                      // Lng
            referralCode,             // ReferralCode
            referredBy,               // ReferredBy
            'PENDING',                // Status
            '0',                      // TotalReferrals
            '0',                      // WalletBalance
            email,                    // Email (for social login matching)
        ];

        await appendRow(SHEET_TABS.ELECTRICIANS, rowData);

        // Save bank details to separate sheet
        if (bankAccountName && bankAccountNumber && bankIfscCode) {
            const bankRowData = [
                getTimestamp(),       // Timestamp
                electricianId,        // ElectricianID
                bankAccountName,      // AccountHolderName
                bankAccountNumber,    // AccountNumber
                bankIfscCode,         // IFSCCode
                'PENDING',            // Status
            ];
            await appendRow(SHEET_TABS.BANK_DETAILS, bankRowData);
        }

        // Sync phone number to Users sheet if email is provided (critical for social logins)
        if (email) {
            try {
                const { getRows, updateRow } = await import('@/lib/google-sheets');
                const userRows = await getRows(SHEET_TABS.USERS);

                if (userRows.length > 0) {
                    const headers = userRows[0];
                    const emailIndex = headers.indexOf('Email');
                    const phoneIndex = headers.indexOf('Phone');

                    if (emailIndex !== -1 && phoneIndex !== -1) {
                        for (let i = 1; i < userRows.length; i++) {
                            if (userRows[i][emailIndex] === email) {
                                await updateRow(SHEET_TABS.USERS, i + 1, phoneIndex, phonePrimary);
                                console.log(`Updated phone for user ${email}`);
                                break;
                            }
                        }
                    }
                }

                // Also update in Supabase users table
                await supabaseAdmin
                    .from('users')
                    .update({ phone: phonePrimary })
                    .eq('email', email);
            } catch (syncError) {
                console.error('Failed to sync phone to Users:', syncError);
            }
        }

        return NextResponse.json({
            success: true,
            electricianId,
            referralCode,
            message: 'Registration successful! Your application is under review.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({
            success: false,
            error: 'Registration failed. Please try again.'
        }, { status: 500 });
    }
}
