import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
    const results: Record<string, unknown> = {
        env: {
            sheetsId: process.env.GOOGLE_SHEETS_ID ? 'SET' : 'NOT SET',
            driveId: process.env.GOOGLE_DRIVE_FOLDER_ID ? 'SET' : 'NOT SET',
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NOT SET',
            privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_PRIVATE_KEY.length + ')' : 'NOT SET',
        },
    };

    try {
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

        // Try to get spreadsheet metadata first
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        results.spreadsheetTitle = metadata.data.properties?.title;
        results.sheets = metadata.data.sheets?.map(s => s.properties?.title);

        // Now try a simple append
        const appendResult = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Electricians!A:A',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[new Date().toISOString()]],
            },
        });

        results.appendSuccess = true;
        results.updatedRange = appendResult.data.updates?.updatedRange;

    } catch (error) {
        results.error = error instanceof Error ? error.message : 'Unknown error';
        results.errorStack = error instanceof Error ? error.stack : undefined;
    }

    return NextResponse.json(results);
}
