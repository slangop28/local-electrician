import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

interface MigrationResult {
    success: boolean;
    message: string;
    results: {
        electricians: { cleared: number; inserted: number };
        customers: { cleared: number; inserted: number };
        users: { cleared: number; inserted: number };
        serviceRequests: { cleared: number; inserted: number };
        bankDetails: { cleared: number; inserted: number };
    };
    errors: string[];
}

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Supabase admin not configured' },
                { status: 500 }
            );
        }

        const result: MigrationResult = {
            success: true,
            message: 'Data migration started',
            results: {
                electricians: { cleared: 0, inserted: 0 },
                customers: { cleared: 0, inserted: 0 },
                users: { cleared: 0, inserted: 0 },
                serviceRequests: { cleared: 0, inserted: 0 },
                bankDetails: { cleared: 0, inserted: 0 },
            },
            errors: [],
        };

        console.log('[Migration] Starting data migration from Google Sheets to Supabase...');

        // ===== 1. MIGRATE ELECTRICIANS =====
        try {
            console.log('[Migration] Clearing electricians table...');
            const { count: clearedCount } = await supabaseAdmin
                .from('electricians')
                .delete()
                .neq('electrician_id', ''); // Delete all rows

            result.results.electricians.cleared = clearedCount || 0;

            console.log('[Migration] Fetching electricians from Google Sheets...');
            const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);

            // Skip header row
            const electricianData = electricianRows.slice(1).map((row: string[]) => {
                const obj: any = {
                    electrician_id: row[1] || '',
                    name: row[2] || '',
                    phone_primary: row[3] || '',
                    phone_secondary: row[4] || '',
                    email: row[21] || '',
                    house_no: row[8] || '',
                    area: row[9] || '',
                    city: row[10] || '',
                    district: row[11] || '',
                    state: row[12] || '',
                    pincode: row[13] || '',
                    referral_code: row[16] || '',
                    referred_by: row[17] || '',
                    status: row[18] || 'PENDING',
                    total_referrals: parseInt(row[19] || '0'),
                    wallet_balance: parseFloat(row[20] || '0'),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                // Only add optional fields if they exist
                if (row[14]) obj.latitude = parseFloat(row[14]);
                if (row[15]) obj.longitude = parseFloat(row[15]);
                if (row[5]) obj.aadhaar_front_url = row[5];
                if (row[6]) obj.aadhaar_back_url = row[6];
                if (row[7]) obj.pan_front_url = row[7];
                return obj;
            }).filter((e: any) => e.electrician_id); // Only non-empty IDs

            if (electricianData.length > 0) {
                console.log(`[Migration] Inserting ${electricianData.length} electricians...`);
                const { error } = await supabaseAdmin.from('electricians').insert(electricianData);
                if (error) {
                    result.errors.push(`Electricians insert error: ${error.message}`);
                    console.error('[Migration] Electricians insert error:', error);
                } else {
                    result.results.electricians.inserted = electricianData.length;
                    console.log(`[Migration] Successfully inserted ${electricianData.length} electricians`);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            result.errors.push(`Electricians migration error: ${error}`);
            console.error('[Migration] Electricians error:', err);
        }

        // ===== 2. MIGRATE CUSTOMERS =====
        try {
            console.log('[Migration] Clearing customers table...');
            const { count: clearedCount } = await supabaseAdmin
                .from('customers')
                .delete()
                .neq('customer_id', ''); // Delete all rows

            result.results.customers.cleared = clearedCount || 0;

            console.log('[Migration] Fetching customers from Google Sheets...');
            const customerRows = await getRows(SHEET_TABS.CUSTOMERS);

            const customerData = customerRows.slice(1).map((row: string[]) => ({
                customer_id: row[1] || '',
                name: row[2] || '',
                phone: row[3] || '',
                email: row[4] || '',
                city: row[5] || '',
                pincode: row[6] || '',
                address: row[7] || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })).filter((c: any) => c.customer_id);

            if (customerData.length > 0) {
                console.log(`[Migration] Inserting ${customerData.length} customers...`);
                const { error } = await supabaseAdmin.from('customers').insert(customerData);
                if (error) {
                    result.errors.push(`Customers insert error: ${error.message}`);
                    console.error('[Migration] Customers insert error:', error);
                } else {
                    result.results.customers.inserted = customerData.length;
                    console.log(`[Migration] Successfully inserted ${customerData.length} customers`);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            result.errors.push(`Customers migration error: ${error}`);
            console.error('[Migration] Customers error:', err);
        }

        // ===== 3. MIGRATE USERS =====
        try {
            console.log('[Migration] Clearing users table...');
            const { count: clearedCount } = await supabaseAdmin
                .from('users')
                .delete()
                .neq('user_id', ''); // Delete all rows

            result.results.users.cleared = clearedCount || 0;

            console.log('[Migration] Fetching users from Google Sheets...');
            const userRows = await getRows(SHEET_TABS.USERS);

            const userData = userRows.slice(1).map((row: string[]) => ({
                user_id: row[1] || '',
                phone: row[2] || '',
                email: row[3] || '',
                name: row[4] || '',
                auth_provider: row[5] || '',
                user_type: row[6] || '',
                username: row[7] || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })).filter((u: any) => u.user_id);

            if (userData.length > 0) {
                console.log(`[Migration] Inserting ${userData.length} users...`);
                const { error } = await supabaseAdmin.from('users').insert(userData);
                if (error) {
                    result.errors.push(`Users insert error: ${error.message}`);
                    console.error('[Migration] Users insert error:', error);
                } else {
                    result.results.users.inserted = userData.length;
                    console.log(`[Migration] Successfully inserted ${userData.length} users`);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            result.errors.push(`Users migration error: ${error}`);
            console.error('[Migration] Users error:', err);
        }

        // ===== 4. MIGRATE SERVICE REQUESTS =====
        try {
            console.log('[Migration] Clearing service requests table...');
            const { count: clearedCount } = await supabaseAdmin
                .from('service_requests')
                .delete()
                .neq('request_id', ''); // Delete all rows

            result.results.serviceRequests.cleared = clearedCount || 0;

            console.log('[Migration] Fetching service requests from Google Sheets...');
            const serviceRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);

            const serviceData = serviceRows.slice(1).map((row: string[]) => ({
                request_id: row[1] || '',
                customer_id: row[2] || '',
                electrician_id: row[3] || '',
                service_type: row[4] || '',
                status: row[5] || 'NEW',
                preferred_date: row[6] || '',
                preferred_slot: row[7] || '',
                description: row[8] || '',
                customer_name: '',
                customer_phone: '',
                customer_address: '',
                customer_city: '',
                electrician_name: '',
                electrician_phone: '',
                electrician_city: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })).filter((s: any) => s.request_id);

            if (serviceData.length > 0) {
                console.log(`[Migration] Inserting ${serviceData.length} service requests...`);
                const { error } = await supabaseAdmin.from('service_requests').insert(serviceData);
                if (error) {
                    result.errors.push(`Service requests insert error: ${error.message}`);
                    console.error('[Migration] Service requests insert error:', error);
                } else {
                    result.results.serviceRequests.inserted = serviceData.length;
                    console.log(`[Migration] Successfully inserted ${serviceData.length} service requests`);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            result.errors.push(`Service requests migration error: ${error}`);
            console.error('[Migration] Service requests error:', err);
        }

        // ===== 5. MIGRATE BANK DETAILS =====
        try {
            console.log('[Migration] Clearing bank details table...');
            const { count: clearedCount } = await supabaseAdmin
                .from('bank_details')
                .delete()
                .neq('id', ''); // Delete all rows

            result.results.bankDetails.cleared = clearedCount || 0;

            console.log('[Migration] Fetching bank details from Google Sheets...');
            const bankRows = await getRows(SHEET_TABS.BANK_DETAILS);

            const bankData = bankRows.slice(1).map((row: string[]) => ({
                electrician_id: row[1] || '',
                account_name: row[2] || '',
                account_number: row[3] || '',
                ifsc_code: row[4] || '',
                status: row[5] || 'PENDING',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })).filter((b: any) => b.electrician_id && b.account_number && b.account_name);

            if (bankData.length > 0) {
                console.log(`[Migration] Inserting ${bankData.length} bank details...`);
                const { error } = await supabaseAdmin.from('bank_details').insert(bankData);
                if (error) {
                    result.errors.push(`Bank details insert error: ${error.message}`);
                    console.error('[Migration] Bank details insert error:', error);
                } else {
                    result.results.bankDetails.inserted = bankData.length;
                    console.log(`[Migration] Successfully inserted ${bankData.length} bank details`);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            result.errors.push(`Bank details migration error: ${error}`);
            console.error('[Migration] Bank details error:', err);
        }

        console.log('[Migration] Data migration completed');
        console.log('[Migration] Results:', result);

        return NextResponse.json({
            success: result.errors.length === 0,
            message: result.errors.length === 0 
                ? 'Data migration completed successfully' 
                : 'Data migration completed with errors',
            ...result
        });

    } catch (error) {
        console.error('[Migration] Fatal error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Data migration failed',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
