import { NextResponse } from 'next/server';
import { uploadKYCFile, testDriveConnection } from '@/lib/google-drive';

// Test endpoint for Drive upload functionality
export async function GET() {
    try {
        // First test connection
        const connectionTest = await testDriveConnection();
        if (!connectionTest.success) {
            return NextResponse.json({
                success: false,
                error: 'Drive connection failed',
                details: connectionTest.message
            });
        }

        const testElectricianId = 'TEST-' + Date.now();

        // Create a small test file (1x1 pixel PNG)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testBuffer = Buffer.from(testImageBase64, 'base64');

        console.log('Uploading test file for:', testElectricianId);
        const uploadResult = await uploadKYCFile(
            'test_upload.png',
            testBuffer,
            'image/png',
            testElectricianId
        );
        console.log('Upload result:', uploadResult);

        return NextResponse.json({
            success: true,
            message: 'Drive upload test successful!',
            connection: connectionTest,
            file: {
                id: uploadResult.id,
                viewLink: uploadResult.webViewLink
            }
        });

    } catch (error) {
        console.error('Drive test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
