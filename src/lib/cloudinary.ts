import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
    success: boolean;
    url: string;
    publicId: string;
    error?: string;
}

/**
 * Upload a file to Cloudinary
 * @param buffer - File buffer
 * @param fileName - Original file name
 * @param folder - Folder path in Cloudinary (e.g., "kyc/ELEC-123456")
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    fileName: string,
    folder: string
): Promise<UploadResult> {
    try {
        // Convert buffer to base64 data URI
        const base64 = buffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `local-electrician/${folder}`,
            public_id: fileName.split('.')[0], // Remove extension
            resource_type: 'image',
            overwrite: true,
        });

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            url: '',
            publicId: '',
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Upload KYC document for an electrician
 */
export async function uploadKYCDocument(
    buffer: Buffer,
    documentType: 'aadhaar_front' | 'aadhaar_back' | 'pan',
    electricianId: string
): Promise<string> {
    const folder = `kyc/${electricianId}`;
    const result = await uploadToCloudinary(buffer, documentType, folder);

    if (result.success) {
        return result.url;
    }

    throw new Error(`Upload failed for ${documentType}: ${result.error}`);
}

/**
 * Test Cloudinary connection
 */
export async function testCloudinaryConnection(): Promise<{ success: boolean; message: string }> {
    try {
        const result = await cloudinary.api.ping();
        return {
            success: result.status === 'ok',
            message: result.status === 'ok' ? 'Cloudinary connected!' : 'Cloudinary ping failed',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}
