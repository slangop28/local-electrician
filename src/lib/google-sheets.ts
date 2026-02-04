import { google } from 'googleapis';

// Initialize Google Auth
function getGoogleAuth() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

// Get Sheets instance
export function getSheetsClient() {
    const auth = getGoogleAuth();
    return google.sheets({ version: 'v4', auth });
}

// Sheet tab names - IMPORTANT: These must match exactly with the Google Sheet tabs
export const SHEET_TABS = {
    ELECTRICIANS: 'Electricians',
    CUSTOMERS: 'Customers',
    SERVICE_REQUESTS: 'ServiceRequests',
    REFERRALS: 'Referrals',
    USERS: 'Users',
    BANK_DETAILS: 'Bank Details',
    VERIFIED_TECHNICIANS: 'Verified Electricians', // New sheet for verified electricians
} as const;

// Append a row to a specific sheet tab
export async function appendRow(tabName: string, values: string[]) {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A1:Z1000`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [values],
        },
    });

    return response.data;
}

// Get all rows from a specific sheet tab
export async function getRows(tabName: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabName}!A:Z`,
    });

    return response.data.values || [];
}

// Update a specific cell in a sheet
export async function updateRow(tabName: string, rowNumber: number, columnIndex: number, value: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // Convert column index to letter (0 = A, 1 = B, etc.)
    const columnLetter = String.fromCharCode(65 + columnIndex);
    const range = `${tabName}!${columnLetter}${rowNumber}`;

    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[value]],
        },
    });

    return response.data;
}

// Test connection by writing a test row
export async function testSheetsConnection(): Promise<{ success: boolean; message: string }> {
    try {
        const timestamp = new Date().toISOString();
        const testRow = [timestamp, 'TEST-CONNECTION', 'Connection Test', 'Successful'];

        await appendRow(SHEET_TABS.ELECTRICIANS, testRow);

        return {
            success: true,
            message: `Successfully wrote test row to ${SHEET_TABS.ELECTRICIANS} sheet at ${timestamp}`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to write to sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
// Delete a row from a specific sheet tab
export async function deleteRow(tabName: string, rowNumber: number) {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 1. Get sheet ID
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = metadata.data.sheets?.find(s => s.properties?.title === tabName);

    if (sheet?.properties?.sheetId === undefined) {
        throw new Error(`Sheet ${tabName} not found`);
    }

    const sheetId = sheet.properties.sheetId;

    // 2. Delete the row (rowNumber is 1-indexed)
    // startIndex is 0-indexed inclusive, endIndex is 0-indexed exclusive
    // To delete row 5 (1-indexed), we delete index 4.
    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId,
                        dimension: 'ROWS',
                        startIndex: rowNumber - 1,
                        endIndex: rowNumber,
                    },
                },
            }],
        },
    });

    return response.data;
}

// Ensure a sheet exists, create it if not
export async function ensureSheet(tabName: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    try {
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = metadata.data.sheets?.find(s => s.properties?.title === tabName);

        if (!sheet) {
            console.log(`Sheet ${tabName} not found, creating...`);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: tabName,
                            }
                        }
                    }]
                }
            });

            // Add headers if it's BANK_DETAILS
            if (tabName === SHEET_TABS.BANK_DETAILS) {
                await appendRow(tabName, ['Timestamp', 'ElectricianId', 'AccountName', 'AccountNumber', 'IFSCCode', 'Status']);
            } else if (tabName === SHEET_TABS.VERIFIED_TECHNICIANS) {
                // Fetch Electricians headers to copy them or define a standard set
                // For simplicity, we'll try to get headers from the Electricians sheet dynamically if possible, or use a hardcoded set that matches
                // Since we can't easily fetch other sheets here without risk of loops/errors, let's use a standard comprehensive set or just empty because we append the whole row from Electricians which INCLUDES the timestamp and ID usually.
                // However, appendRow usually appends DATA. If we append a row from Electricians, it presumably has data values.
                // If we create a NEW sheet, we want the first row to be headers.
                // When we copy from Electricians, we copy the specific electrician's row, not the header row.
                // So we SHOULD add headers here.
                // Assuming Electricians sheet structure:
                // [Timestamp, ElectricianID, Name, Phone, ... ]
                // It's safer to fetch the Electricians sheet headers once and copy them, but to keep it simple and fast:
                // We'll define a generic set or just let the first row define columns (which is bad for headers).
                // Let's add a generic set based on known columns.
                await appendRow(tabName, ['Timestamp', 'ElectricianID', 'NameAsPerAadhaar', 'PhonePrimary', 'PhoneSecondary', 'AadhaarFrontURL', 'AadhaarBackURL', 'PanFrontURL', 'Address', 'City', 'Area', 'State', 'Pincode', 'Latitude', 'Longitude', 'GeocodingStatus', 'TotalReferrals', 'ReferralCode', 'Status', 'WalletBalance']);
            }
        }
    } catch (error) {
        console.error(`Error ensuring sheet ${tabName}:`, error);
        // Don't throw, let the caller try and fail if needed
    }
}

// Clear all data from a specific sheet tab
export async function clearSheet(tabName: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: tabName,
    });
}
