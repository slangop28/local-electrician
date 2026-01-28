import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function GET() {
    const results: Record<string, unknown> = {};

    try {
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // Step 1: Try to list files in the folder
        results.step1_list = 'Attempting to list files...';
        const listResponse = await drive.files.list({
            q: `'${folderId}' in parents`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        results.step1_list = {
            success: true,
            files: listResponse.data.files,
        };

        // Step 2: Try to get folder metadata
        results.step2_metadata = 'Attempting to get folder metadata...';
        const folderMetadata = await drive.files.get({
            fileId: folderId!,
            fields: 'id, name, mimeType, driveId, capabilities',
            supportsAllDrives: true,
        });
        results.step2_metadata = {
            success: true,
            folder: folderMetadata.data,
        };

        // Step 3: Try simple file creation with explicit parent
        results.step3_upload = 'Attempting file upload...';
        const testContent = `Test at ${new Date().toISOString()}`;
        const testBuffer = Buffer.from(testContent, 'utf-8');

        const uploadResponse = await drive.files.create({
            requestBody: {
                name: `test-${Date.now()}.txt`,
                parents: [folderId!],
            },
            media: {
                mimeType: 'text/plain',
                body: Readable.from(testBuffer),
            },
            fields: 'id, name, webViewLink',
            supportsAllDrives: true,
        });

        results.step3_upload = {
            success: true,
            file: uploadResponse.data,
        };

    } catch (error) {
        results.error = error instanceof Error ? error.message : 'Unknown error';
        results.errorDetails = error instanceof Error ? {
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 5),
        } : undefined;
    }

    return NextResponse.json(results);
}
