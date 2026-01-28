import { NextRequest, NextResponse } from 'next/server';
import { appendRow, SHEET_TABS } from '@/lib/google-sheets';
import { geocodeAddress } from '@/lib/geocoding';
import { getTimestamp } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract form fields
        const name = formData.get('name') as string;
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

        // Validate required fields
        if (!name || !phonePrimary || !houseNo || !area || !city || !state || !pincode) {
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

        // Handle file uploads (for now, we'll store them as placeholder URLs)
        // In production, you would upload to Google Drive and get actual URLs
        const aadhaarFrontFile = formData.get('aadhaarFront') as File | null;
        const aadhaarBackFile = formData.get('aadhaarBack') as File | null;
        const panFrontFile = formData.get('panFront') as File | null;

        // Placeholder URLs (in production, upload to Drive and get real URLs)
        const aadhaarFrontURL = aadhaarFrontFile ? `pending_upload_${aadhaarFrontFile.name}` : '';
        const aadhaarBackURL = aadhaarBackFile ? `pending_upload_${aadhaarBackFile.name}` : '';
        const panFrontURL = panFrontFile ? `pending_upload_${panFrontFile.name}` : '';

        // Prepare row data matching the sheet columns:
        // Timestamp, ElectricianID, NameAsPerAadhaar, PhonePrimary, PhoneSecondary, 
        // AadhaarFrontURL, AadhaarBackURL, PanFrontURL, HouseNo, Area, City, District, 
        // State, Pincode, Lat, Lng, ReferralCode, ReferredBy, Status, TotalReferrals, WalletBalance
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
        ];

        // Append to Google Sheets
        await appendRow(SHEET_TABS.ELECTRICIANS, rowData);

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
