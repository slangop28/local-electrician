import { NextResponse } from 'next/server';
import { clearSheet, appendRow, SHEET_TABS } from '@/lib/google-sheets';

export async function POST() {
    try {
        // Define Headers
        const HEADERS = {
            [SHEET_TABS.ELECTRICIANS]: [
                'Timestamp', 'ElectricianID', 'NameAsPerAadhaar', 'PhonePrimary', 'PhoneSecondary',
                'AadhaarFrontURL', 'AadhaarBackURL', 'PanFrontURL', 'HouseNo', 'Area', 'City',
                'District', 'State', 'Pincode', 'Latitude', 'Longitude', 'ReferralCode', 'ReferredBy',
                'Status', 'TotalReferrals', 'WalletBalance', 'Email', 'ProfilePic'
            ],
            [SHEET_TABS.CUSTOMERS]: [
                'Timestamp', 'CustomerID', 'Name', 'Phone', 'Email', 'City', 'Pincode', 'Address'
            ],
            [SHEET_TABS.SERVICE_REQUESTS]: [
                'Timestamp', 'RequestID', 'CustomerID', 'ElectricianID', 'ServiceType', 'Status',
                'PreferredDate', 'PreferredSlot', 'Description', 'City', 'Pincode', 'Address', 'Lat', 'Lng'
            ],
            [SHEET_TABS.USERS]: [
                'Timestamp', 'UserID', 'Phone', 'Email', 'Name', 'AuthProvider', 'UserType',
                'Username', 'CreatedAt', 'LastLogin'
            ],
            [SHEET_TABS.BANK_DETAILS]: [
                'Timestamp', 'ElectricianId', 'AccountName', 'AccountNumber', 'IFSCCode', 'Status'
            ],
            [SHEET_TABS.VERIFIED_TECHNICIANS]: [
                'Timestamp', 'ElectricianID', 'NameAsPerAadhaar', 'PhonePrimary', 'PhoneSecondary',
                'AadhaarFrontURL', 'AadhaarBackURL', 'PanFrontURL', 'HouseNo', 'Area', 'City',
                'District', 'State', 'Pincode', 'Latitude', 'Longitude', 'ReferralCode', 'ReferredBy',
                'Status', 'TotalReferrals', 'WalletBalance', 'Email', 'ProfilePic'
            ]
        };

        const results = [];

        // Clear and Reset each sheet
        for (const [tabName, headers] of Object.entries(HEADERS)) {
            try {
                // 1. Clear Sheet
                await clearSheet(tabName);

                // 2. Append Headers
                await appendRow(tabName, headers);

                results.push({ sheet: tabName, status: 'Reset Successful' });
            } catch (error: any) {
                console.error(`Failed to reset ${tabName}:`, error);
                results.push({ sheet: tabName, status: 'Failed', error: error.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
