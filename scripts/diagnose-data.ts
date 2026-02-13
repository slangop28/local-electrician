
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
    console.log('--- START DIAGNOSIS (CommonJS) ---');

    // 1. Get last 5 service requests
    const { data: requests, error: reqError } = await supabaseAdmin
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (reqError) {
        console.error('Error fetching requests:', reqError);
        return;
    }

    console.log(`Found ${requests?.length} recent requests.`);

    if (!requests || requests.length === 0) return;

    for (const r of requests) {
        console.log(`\nRequest ID: ${r.request_id}`);
        console.log(`Status: ${r.status}`);
        console.log(`Electrician ID in Request: ${r.electrician_id}`);

        if (r.electrician_id && r.electrician_id !== 'BROADCAST') {
            // Check Electrician Table
            const { data: elec, error: elecError } = await supabaseAdmin
                .from('electricians')
                .select('*')
                .eq('electrician_id', r.electrician_id)
                .single();

            if (elecError) {
                console.error(`  ❌ Error fetching electrician ${r.electrician_id}:`, elecError.message);
            } else if (!elec) {
                console.error(`  ❌ Electrician ${r.electrician_id} NOT FOUND in electricians table.`);
            } else {
                console.log(`  ✅ Electrician Found: ${elec.name} (${elec.phone_primary})`);
                console.log(`  📍 Location: ${elec.area}, ${elec.city}`);
            }
        } else {
            console.log('  ⚠️ No Electrician Assigned or BROADCAST');
        }
    }
    console.log('--- END DIAGNOSIS ---');
}

diagnose();
