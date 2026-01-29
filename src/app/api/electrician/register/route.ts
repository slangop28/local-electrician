import { NextRequest, NextResponse } from 'next/server';
import { appendRow, SHEET_TABS } from '@/lib/google-sheets';
import { geocodeAddress } from '@/lib/geocoding';
import { getTimestamp } from '@/lib/utils';
import { createElectricianFolder, uploadFile } from '@/lib/google-drive';

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

        // Get uploaded files
        const aadhaarFrontFile = formData.get('aadhaarFront') as File | null;
        const aadhaarBackFile = formData.get('aadhaarBack') as File | null;
        const panFrontFile = formData.get('panFront') as File | null;

        // Initialize URLs
        let aadhaarFrontURL = '';
        let aadhaarBackURL = '';
        let panFrontURL = '';

        // Upload files to Google Drive if present
        if (aadhaarFrontFile || aadhaarBackFile || panFrontFile) {
            try {
                // Create folder for this electrician
                const folder = await createElectricianFolder(electricianId);
                const folderId = folder.id!;

                // Upload Aadhaar Front
                if (aadhaarFrontFile && aadhaarFrontFile.size > 0) {
                    const buffer = Buffer.from(await aadhaarFrontFile.arrayBuffer());
                    const result = await uploadFile(
                        `aadhaar_front_${electricianId}.${aadhaarFrontFile.name.split('.').pop()}`,
                        buffer,
                        aadhaarFrontFile.type || 'image/jpeg',
                        folderId
                    );
                    aadhaarFrontURL = result.webViewLink || '';
                }

                // Upload Aadhaar Back
                if (aadhaarBackFile && aadhaarBackFile.size > 0) {
                    const buffer = Buffer.from(await aadhaarBackFile.arrayBuffer());
                    const result = await uploadFile(
                        `aadhaar_back_${electricianId}.${aadhaarBackFile.name.split('.').pop()}`,
                        buffer,
                        aadhaarBackFile.type || 'image/jpeg',
                        folderId
                    );
                    aadhaarBackURL = result.webViewLink || '';
                }

                // Upload PAN
                if (panFrontFile && panFrontFile.size > 0) {
                    const buffer = Buffer.from(await panFrontFile.arrayBuffer());
                    const result = await uploadFile(
                        `pan_${electricianId}.${panFrontFile.name.split('.').pop()}`,
                        buffer,
                        panFrontFile.type || 'image/jpeg',
                        folderId
                    );
                    panFrontURL = result.webViewLink || '';
                }

                console.log('KYC files uploaded successfully for:', electricianId);
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                // Continue with registration even if upload fails
                aadhaarFrontURL = aadhaarFrontFile ? `upload_failed_${aadhaarFrontFile.name}` : '';
                aadhaarBackURL = aadhaarBackFile ? `upload_failed_${aadhaarBackFile.name}` : '';
                panFrontURL = panFrontFile ? `upload_failed_${panFrontFile.name}` : '';
            }
        }

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
