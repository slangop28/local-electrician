
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

const logFile = path.resolve(__dirname, 'diagnosis.log');
fs.writeFileSync(logFile, '--- START DIAGNOSIS (Log File) ---\n');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function diagnose() {
    log('--- START DIAGNOSIS (CommonJS) ---');

    console.log('Fetching requests...');
    // 1. Get last 5 service requests
    const { data: requests, error: reqError } = await supabaseAdmin
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (reqError) {
        log('Error fetching requests: ' + JSON.stringify(reqError));
        return;
    }

    log(`Found ${requests?.length} recent requests.`);

    if (!requests || requests.length === 0) return;

    for (const r of requests) {
        log(`\nRequest ID: ${r.request_id}`);
        log(`Status: ${r.status}`);
        log(`Electrician ID in Request: ${r.electrician_id}`);

        if (r.electrician_id && r.electrician_id !== 'BROADCAST') {
            // Check Electrician Table (allow multiple)
            const { data: elecs, error: elecError } = await supabaseAdmin
                .from('electricians')
                .select('*')
                .eq('electrician_id', r.electrician_id);

            if (elecError) {
                log(`  ❌ Error fetching electrician ${r.electrician_id}: ` + elecError.message);
            } else if (!elecs || elecs.length === 0) {
                log(`  ❌ Electrician ${r.electrician_id} NOT FOUND in electricians table.`);
            } else {
                log(`  ✅ Found ${elecs.length} records for ${r.electrician_id}`);
                elecs.forEach((elec, i) => {
                    log(`    [${i}] Name: ${elec.name}, Phone: ${elec.phone_primary}, City: ${elec.city}, Area: ${elec.area}`);
                });
            }
        } else {
            log('  ⚠️ No Electrician Assigned or BROADCAST');
        }
    }
    log('--- END DIAGNOSIS ---');
}
// Add Sheets check logic? 
// It's complex to add Google Sheets to this script due to auth.
// Let's rely on api/electrician/register check.

diagnose();
