require('dotenv').config({ path: '.env.local' });

const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
if (key) {
    console.log('✅ NEXT_PUBLIC_GOOGLE_MAPS_KEY is set (length: ' + key.length + ')');
} else {
    console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_KEY is MISSING in .env.local');
}
