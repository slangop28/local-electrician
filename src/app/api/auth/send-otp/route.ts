import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone || phone.length !== 10) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number' },
                { status: 400 }
            );
        }

        const apiKey = process.env.FAST2SMS_API_KEY;
        const otpSecret = process.env.OTP_SECRET || 'default_secret_please_change';

        console.log('Debug Auth: API Key present?', !!apiKey);
        console.log('Debug Auth: Secret present?', !!process.env.OTP_SECRET);

        if (!apiKey) {
            console.error('FAST2SMS_API_KEY is missing in environment variables');
            return NextResponse.json(
                { success: false, error: 'Server configuration error: Missing API Key' },
                { status: 500 }
            );
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 5 minutes expiry
        const ttl = 5 * 60 * 1000;
        const expiresAt = Date.now() + ttl;

        // Create hash: phone.otp.expiresAt
        const data = `${phone}.${otp}.${expiresAt}`;
        const hash = crypto
            .createHmac('sha256', otpSecret)
            .update(data)
            .digest('hex');

        const fullHash = `${hash}.${expiresAt}`;

        // Send to Fast2SMS
        // API Doc: https://www.fast2sms.com/dev/bulkV2
        // route: "otp", variables_values: otp, numbers: phone

        const url = 'https://www.fast2sms.com/dev/bulkV2';
        const params = new URLSearchParams({
            authorization: apiKey,
            route: 'otp',
            variables_values: otp,
            flash: '0',
            numbers: phone
        });

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET'
        });

        const result = await response.json();

        // DEV MODE BYPASS: Always log the OTP so you can login even if SMS fails
        console.log('=================================================');
        console.log(`🔐 DEV MODE OTP for ${phone}: ${otp}`);
        console.log('=================================================');

        if (result.return) {
            return NextResponse.json({
                success: true,
                message: 'OTP sent successfully',
                hash: fullHash,
                phone
            });
        } else {
            console.error('Fast2SMS Error:', result);

            // If in Development, return success anyway so we can test
            // The user can get the OTP from the console logs above
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️ SMS failed but proceeding in DEV MODE.');
                return NextResponse.json({
                    success: true,
                    message: 'Dev Mode: SMS failed but check console for OTP',
                    hash: fullHash,
                    phone
                });
            }

            return NextResponse.json(
                { success: false, error: result.message || 'Failed to send SMS' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
