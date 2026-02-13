require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkElectrician() {
    const electricianId = 'ELEC-20260213-9360';
    console.log(`Checking electrician: ${electricianId}`);

    const { data, error } = await supabase
        .from('electricians')
        .select('*')
        // .eq('electrician_id', electricianId) // Commented out to see all if specific fails
        .single();

    // Let's search by ID first
    const { data: specificData, error: specificError } = await supabase
        .from('electricians')
        .select('*')
        .eq('electrician_id', electricianId);

    if (specificError) {
        console.error('Error fetching electrician:', specificError);
    } else if (!specificData || specificData.length === 0) {
        console.log('Electrician not found with that ID.');
        // List all to see what's there
        const { data: all, error: allError } = await supabase.from('electricians').select('electrician_id, name, status, latitude, longitude');
        console.log('All electricians:', all);
    } else {
        const el = specificData[0];
        console.log('Found Electrician:', {
            id: el.electrician_id,
            name: el.name,
            status: el.status,
            lat: el.latitude,
            lng: el.longitude,
            city: el.city
        });

        if (el.status !== 'VERIFIED') {
            console.warn('⚠️ Electrician is NOT VERIFIED. API requires status to be VERIFIED.');
        }
        if (!el.latitude || !el.longitude) {
            console.warn('⚠️ Electrician has NO COORDINATES. API requires valid lat/lng.');

            // Auto-fix for testing
            const { error: updateError } = await supabase
                .from('electricians')
                .update({
                    latitude: 28.6139,
                    longitude: 77.2090,
                    status: 'VERIFIED' // Ensure verified too
                })
                .eq('electrician_id', electricianId);

            if (updateError) console.error('Failed to update coordinates:', updateError);
            else console.log('✅ Updated electrician with New Delhi coordinates and VERIFIED status.');
        }
    }
}

checkElectrician();
