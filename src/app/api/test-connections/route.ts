import { NextResponse } from 'next/server';
import { testSheetsConnection } from '@/lib/google-sheets';
import { testDriveConnection } from '@/lib/google-drive';
import { testGeocodingConnection } from '@/lib/geocoding';

export async function GET() {
    // Using 'any' to avoid strict type checking on test results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: Record<string, any> = {
        sheets: { success: false, message: 'Not tested' },
        drive: { success: false, message: 'Not tested' },
        geocoding: { success: false, message: 'Not tested' },
    };

    // Test Google Sheets
    try {
        results.sheets = await testSheetsConnection();
    } catch (error) {
        results.sheets = {
            success: false,
            message: `Sheets error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }

    // Test Google Drive
    try {
        results.drive = await testDriveConnection();
    } catch (error) {
        results.drive = {
            success: false,
            message: `Drive error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }

    // Test Geocoding
    try {
        results.geocoding = await testGeocodingConnection();
    } catch (error) {
        results.geocoding = {
            success: false,
            message: `Geocoding error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }

    const allPassed = results.sheets.success && results.drive.success && results.geocoding.success;

    return NextResponse.json({
        success: allPassed,
        timestamp: new Date().toISOString(),
        results,
    });
}
