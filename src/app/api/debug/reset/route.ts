import { NextRequest, NextResponse } from 'next/server';
import { SHEET_TABS, clearSheet, appendRow, ensureSheet } from '@/lib/google-sheets';

const HEADERS = {
    ELECTRICIANS: ['Timestamp', 'ElectricianID', 'NameAsPerAadhaar', 'PhonePrimary', 'PhoneSecondary', 'AadhaarFrontURL', 'AadhaarBackURL', 'PanFrontURL', 'HouseNo', 'Area', 'City', 'District', 'State', 'Pincode', 'Lat', 'Lng', 'ReferralCode', 'ReferredBy', 'Status', 'TotalReferrals', 'WalletBalance', 'Email'],
    USERS: ['Timestamp', 'UserID', 'Phone', 'Email', 'Name', 'AuthProvider', 'UserType', 'Username', 'CreatedAt', 'LastLogin'],
    CUSTOMERS: ['Timestamp', 'CustomerID', 'Name', 'Phone', 'Email', 'City', 'Pincode', 'Address'],
    SERVICE_REQUESTS: ['Timestamp', 'RequestID', 'CustomerID', 'ElectricianID', 'ServiceType', 'Status', 'PreferredDate', 'PreferredSlot', 'Description'],
    BANK_DETAILS: ['Timestamp', 'ElectricianId', 'AccountName', 'AccountNumber', 'IFSCCode', 'Status'],
    VERIFIED_ELECTRICIANS: ['Timestamp', 'ElectricianID', 'NameAsPerAadhaar', 'PhonePrimary', 'PhoneSecondary', 'AadhaarFrontURL', 'AadhaarBackURL', 'PanFrontURL', 'HouseNo', 'Area', 'City', 'District', 'State', 'Pincode', 'Lat', 'Lng', 'ReferralCode', 'ReferredBy', 'Status', 'TotalReferrals', 'WalletBalance', 'Email']
};

export async function POST(request: NextRequest) {
    try {
        const sheetsToReset = [
            { id: SHEET_TABS.USERS, headers: HEADERS.USERS },
            { id: SHEET_TABS.ELECTRICIANS, headers: HEADERS.ELECTRICIANS },
            { id: SHEET_TABS.CUSTOMERS, headers: HEADERS.CUSTOMERS },
            { id: SHEET_TABS.SERVICE_REQUESTS, headers: HEADERS.SERVICE_REQUESTS },
            { id: SHEET_TABS.BANK_DETAILS, headers: HEADERS.BANK_DETAILS },
            { id: SHEET_TABS.VERIFIED_TECHNICIANS, headers: HEADERS.VERIFIED_ELECTRICIANS }
        ];

        for (const sheet of sheetsToReset) {
            // 1. Ensure sheet exists (creates it if missing)
            await ensureSheet(sheet.id);
            // 2. Clear all data (removes any existing data + headers added by ensureSheet)
            await clearSheet(sheet.id);
            // 3. Add correct headers
            await appendRow(sheet.id, sheet.headers);
        }

        return NextResponse.json({ success: true, message: 'All sheets reset successfully' });
    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reset sheets' },
            { status: 500 }
        );
    }
}
