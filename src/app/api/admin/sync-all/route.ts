import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple protection
        if (secret !== 'admin-sync-secret-123') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const results = {
            users: { processed: 0, synced: 0, errors: 0 },
            electricians: { processed: 0, synced: 0, verified_synced: 0, errors: 0 }
        };

        // 1. Sync Users
        try {
            const userRows = await getRows(SHEET_TABS.USERS);
            if (userRows.length > 1) {
                const headers = userRows[0];
                const idIdx = headers.indexOf('UserID');
                const phoneIdx = headers.indexOf('Phone');
                const emailIdx = headers.indexOf('Email');
                const nameIdx = headers.indexOf('Name');
                const typeIdx = headers.indexOf('UserType');
                const usernameIdx = headers.indexOf('Username');
                const authIdx = headers.indexOf('AuthProvider');

                for (let i = 1; i < userRows.length; i++) {
                    const row = userRows[i];
                    results.users.processed++;

                    const userData = {
                        user_id: row[idIdx],
                        phone: row[phoneIdx] || null,
                        email: row[emailIdx] || null,
                        name: row[nameIdx] || null,
                        user_type: row[typeIdx] || 'customer',
                        username: row[usernameIdx] || null,
                        auth_provider: row[authIdx] || 'phone',
                        updated_at: new Date().toISOString()
                    };

                    if (userData.user_id) {
                        const { error } = await supabaseAdmin.from('users').upsert(userData, { onConflict: 'user_id' });
                        if (!error) results.users.synced++;
                        else {
                            console.error(`Error syncing user ${userData.user_id}:`, error);
                            results.users.errors++;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('User sync failed:', e);
        }

        // 2. Sync Electricians
        try {
            const elecRows = await getRows(SHEET_TABS.ELECTRICIANS);
            if (elecRows.length > 1) {
                const headers = elecRows[0];

                // Map headers to indices
                const getVal = (row: string[], colName: string) => {
                    const idx = headers.indexOf(colName);
                    return idx !== -1 ? row[idx] : null;
                };

                for (let i = 1; i < elecRows.length; i++) {
                    const row = elecRows[i];
                    results.electricians.processed++;

                    const electricianId = getVal(row, 'ElectricianID');
                    if (!electricianId) continue;

                    const status = getVal(row, 'Status') || 'PENDING';

                    // Prepare Electrician Data
                    const elecData = {
                        electrician_id: electricianId,
                        name: getVal(row, 'NameAsPerAadhaar'),
                        phone_primary: getVal(row, 'PhonePrimary'),
                        phone_secondary: getVal(row, 'PhoneSecondary'),
                        email: getVal(row, 'Email'),
                        house_no: getVal(row, 'HouseNo'),
                        area: getVal(row, 'Area'),
                        city: getVal(row, 'City'),
                        district: getVal(row, 'District'),
                        state: getVal(row, 'State'),
                        pincode: getVal(row, 'Pincode'),
                        latitude: parseFloat(getVal(row, 'Lat') || '0'),
                        longitude: parseFloat(getVal(row, 'Lng') || '0'),
                        referral_code: getVal(row, 'ReferralCode'),
                        referred_by: getVal(row, 'ReferredBy'),
                        status: status,
                        updated_at: new Date().toISOString()
                    };

                    // Upsert to main electricians table
                    const { error: mainError } = await supabaseAdmin.from('electricians').upsert(elecData, { onConflict: 'electrician_id' });

                    if (!mainError) {
                        results.electricians.synced++;

                        // If VERIFIED, upsert to verified_electricians table
                        if (status === 'VERIFIED') {
                            const verifiedData = {
                                electrician_id: electricianId,
                                name: elecData.name,
                                phone: elecData.phone_primary,
                                city: elecData.city,
                                area: elecData.area,
                                status: 'VERIFIED',
                                updated_at: new Date().toISOString()
                            };

                            const { error: verifyError } = await supabaseAdmin.from('verified_electricians').upsert(verifiedData, { onConflict: 'electrician_id' });
                            if (!verifyError) results.electricians.verified_synced++;
                            else console.error(`Verified sync error for ${electricianId}:`, verifyError);
                        }
                    } else {
                        console.error(`Electrician sync error for ${electricianId}:`, mainError);
                        results.electricians.errors++;
                    }
                }
            }
        } catch (e) {
            console.error('Electrician sync failed:', e);
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
