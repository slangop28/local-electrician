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

// Find or create a folder in the shared drive folder
async function getOrCreateFolder(folderName: string, parentFolderId: string): Promise<string> {
    const drive = getDriveClient();

    // Search for existing folder
    const search = await drive.files.list({
        q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    if (search.data.files && search.data.files.length > 0) {
        return search.data.files[0].id!;
    }

    // Create new folder
    const response = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id',
        supportsAllDrives: true,
    });

    return response.data.id!;
}

// Upload a file to Google Drive (to a shared folder)
export async function uploadKYCFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    electricianId: string
): Promise<{ id: string; webViewLink: string }> {
    const drive = getDriveClient();
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

    // Create folder structure: KYC > Electricians > {electricianId}
    const kycFolderId = await getOrCreateFolder('KYC', rootFolderId);
    const electriciansFolderId = await getOrCreateFolder('Electricians', kycFolderId);
    const electricianFolderId = await getOrCreateFolder(electricianId, electriciansFolderId);

    // Upload file to the electrician's folder
    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [electricianFolderId],
        },
        media: {
            mimeType,
            body: Readable.from(fileBuffer),
        },
        fields: 'id, webViewLink',
        supportsAllDrives: true,
    });

    const fileId = response.data.id!;

    // Make the file publicly viewable
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
        supportsAllDrives: true,
    });

    return {
        id: fileId,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
}

// List files in a folder
export async function listFilesInFolder(folderId: string) {
    const drive = getDriveClient();

    const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    return response.data.files || [];
}

// Test connection by listing files
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
            message: `Drive error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
