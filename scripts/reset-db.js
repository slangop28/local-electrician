require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const googleEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

if (!supabaseUrl || !supabaseKey || !googleKey || !googleEmail || !spreadsheetId) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SHEET_TABS = {
    ELECTRICIANS: 'Electricians',
    CUSTOMERS: 'Customers',
    SERVICE_REQUESTS: 'ServiceRequests',
    REFERRALS: 'Referrals',
    USERS: 'Users',
    BANK_DETAILS: 'Bank Details',
    VERIFIED_ELECTRICIANS: 'Verified Electricians',
};

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: googleEmail, private_key: googleKey },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

async function resetSupabase() {
    console.log('🗑️  Clearing Supabase tables...');

    // Order matters due to foreign keys
    const tables = [
        'service_request_logs', // Child of service_requests
        'service_requests',     // Child of customers/electricians
        'bank_details',         // Child of electricians
        'verified_electricians', // Standalone/Related
        'electricians',         // Child of users (maybe)
        'customers',            // Child of users
        'users'                 // Top level
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows. neq id 0 is a hack to match all if id is uuid

        // Better way to truncate if RLS allows, or just delete all
        // Since we are admin, we can just delete everything.
        // using .neq('id', '0') might not work for UUIDs if not 0.
        // Actually, without a where clause, delete() is blocked in some clients, but service_role might allow it or we need a condition.
        // Let's use a condition that is always true or just try to delete all

        // For tables with UUID, .neq('id', '0000') works. For others, we need to know the PK.
        // service_requests: request_id (UUID)
        // users: id (UUID)
        // electricians: electrician_id (TEXT)
        // customers: customer_id (UUID/TEXT)

        let deleteQuery = supabase.from(table).delete();

        if (table === 'electricians' || table === 'verified_electricians' || table === 'bank_details') {
            deleteQuery = deleteQuery.neq('electrician_id', 'placeholdervalue');
        } else if (table === 'service_requests') {
            deleteQuery = deleteQuery.neq('request_id', '00000000-0000-0000-0000-000000000000');
        } else {
            deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error: err } = await deleteQuery;

        if (err) console.error(`❌ Failed to clear ${table}:`, err.message);
        else console.log(`✅ Cleared ${table}`);
    }
}

async function resetSheets() {
    console.log('🗑️  Clearing Google Sheets...');
    const sheets = await getSheetsClient();

    for (const [key, tabName] of Object.entries(SHEET_TABS)) {
        try {
            // Get headers first to preserve them
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${tabName}!1:1`,
            });

            const headers = res.data.values ? res.data.values[0] : [];

            // Clear the whole sheet
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: tabName,
            });

            // Write headers back
            if (headers.length > 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${tabName}!1:1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [headers] },
                });
                console.log(`✅ Cleared ${tabName} (Headers preserved)`);
            } else {
                console.log(`⚠️  ${tabName} was empty or had no headers.`);
            }

        } catch (error) {
            console.error(`❌ Failed to clear ${tabName}:`, error.message);
        }
    }
}

async function main() {
    await resetSupabase();
    await resetSheets();
    console.log('✨ Database reset complete!');
}

main();
