import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Auth for Drive
function getDriveAuth() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
}

// Get Drive instance
export function getDriveClient() {
    const auth = getDriveAuth();
    return google.drive({ version: 'v3', auth });
}

// Create a folder in Google Drive
export async function createFolder(folderName: string, parentFolderId?: string) {
    const drive = getDriveClient();

    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink',
        supportsAllDrives: true,
    });

    return response.data;
}

// Upload a file to Google Drive
// NOTE: This requires the user to upload files via client-side OAuth
// Service accounts don't have storage quota for personal Drive
export async function uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    folderId: string
) {
    const drive = getDriveClient();

    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    };

    const media = {
        mimeType,
        body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink',
        supportsAllDrives: true,
    });

    // Make the file publicly viewable
    await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
        supportsAllDrives: true,
    });

    return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
    };
}

// List files in a folder (this works with service accounts)
export async function listFilesInFolder(folderId: string) {
    const drive = getDriveClient();

    const response = await drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name, mimeType, webViewLink)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    return response.data.files || [];
}

// Create folder structure for electrician KYC
export async function createElectricianFolder(electricianId: string) {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

    const drive = getDriveClient();

    // Search for existing KYC folder
    const kycSearch = await drive.files.list({
        q: `name='KYC' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    let kycFolderId: string;

    if (kycSearch.data.files && kycSearch.data.files.length > 0) {
        kycFolderId = kycSearch.data.files[0].id!;
    } else {
        const kycFolder = await createFolder('KYC', rootFolderId);
        kycFolderId = kycFolder.id!;
    }

    // Search for existing Electricians folder
    const electriciansSearch = await drive.files.list({
        q: `name='Electricians' and '${kycFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    let electriciansFolderId: string;

    if (electriciansSearch.data.files && electriciansSearch.data.files.length > 0) {
        electriciansFolderId = electriciansSearch.data.files[0].id!;
    } else {
        const electriciansFolder = await createFolder('Electricians', kycFolderId);
        electriciansFolderId = electriciansFolder.id!;
    }

    // Create folder for this specific electrician
    const electricianFolder = await createFolder(electricianId, electriciansFolderId);

    return electricianFolder;
}

// Test connection by listing files in the shared folder
// Note: File upload won't work with service accounts on personal Drive (no storage quota)
// We test read access instead, upload will be handled via client-side OAuth
export async function testDriveConnection(): Promise<{ success: boolean; message: string; files?: string[] }> {
    try {
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

        const files = await listFilesInFolder(rootFolderId);

        return {
            success: true,
            message: `Drive access verified! Found ${files.length} items in folder.`,
            files: files.map(f => f.name || 'unnamed'),
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to access Drive: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
