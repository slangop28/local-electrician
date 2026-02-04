import { testSheetsConnection } from '../src/lib/google-sheets';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifySetup() {
    console.log('🔍 Starting System Verification...\n');

    // 1. Check Environment Variables
    console.log('1. Checking Environment Variables...');
    const requiredEnv = [
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_SHEETS_ID',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const missingEnv = requiredEnv.filter(env => !process.env[env]);
    if (missingEnv.length > 0) {
        console.error('❌ Missing Environment Variables:', missingEnv.join(', '));
        process.exit(1);
    }
    console.log('✅ All required environment variables present.\n');

    // 2. Check Google Sheets Connection
    console.log('2. Testing Google Sheets Connection...');
    try {
        const sheetResult = await testSheetsConnection();
        if (sheetResult.success) {
            console.log('✅ Google Sheets Connection Successful');
        } else {
            console.error('❌ Google Sheets Connection Failed:', sheetResult.message);
        }
    } catch (error) {
        console.error('❌ Google Sheets Connection Error:', error);
    }
    console.log('\n');

    // 3. Check Cloudinary Connection
    console.log('3. Testing Cloudinary Connection...');
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            console.log('✅ Cloudinary Connection Successful');
        } else {
            console.error('❌ Cloudinary Connection Failed:', result);
        }
    } catch (error) {
        console.error('❌ Cloudinary Connection Error:', error);
    }

    console.log('\n✨ Verification Complete!');
}

verifySetup().catch(console.error);
