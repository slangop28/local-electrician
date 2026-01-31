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
