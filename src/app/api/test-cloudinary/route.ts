import { NextResponse } from 'next/server';
import { testCloudinaryConnection, uploadToCloudinary } from '@/lib/cloudinary';

export async function GET() {
    try {
        // Test connection
        const connectionTest = await testCloudinaryConnection();

        if (!connectionTest.success) {
            return NextResponse.json({
                success: false,
                error: 'Cloudinary connection failed',
                message: connectionTest.message
            });
        }

        // Test upload with a small image
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testBuffer = Buffer.from(testImageBase64, 'base64');

        const uploadResult = await uploadToCloudinary(
            testBuffer,
            `test_${Date.now()}`,
            'test'
        );

        if (!uploadResult.success) {
            return NextResponse.json({
                success: false,
                error: 'Upload test failed',
                message: uploadResult.error
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Cloudinary is working!',
            connection: connectionTest,
            testUpload: {
                url: uploadResult.url,
                publicId: uploadResult.publicId
            }
        });

    } catch (error) {
        console.error('Cloudinary test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
