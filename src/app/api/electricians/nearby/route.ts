// Last updated: 2026-01-29T05:06:00Z - Fixed TypeScript null type error
import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';
import { calculateDistance } from '@/lib/geocoding';
import { ELECTRICIAN_STATUS } from '@/lib/utils';

interface Electrician {
    id: string;
    name: string;
    phone: string;
    city: string;
    area: string;
    lat: number;
    lng: number;
    distance: number;
    status: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radius = parseFloat(searchParams.get('radius') || '10'); // Default 10km

        if (!lat || !lng) {
            return NextResponse.json({
                success: false,
                error: 'Latitude and longitude are required'
            }, { status: 400 });
        }

        // Get all electricians from sheet
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);

        if (rows.length <= 1) {
            // Only header row or empty
            return NextResponse.json({
                success: true,
                electricians: [],
                message: 'No electricians found'
            });
        }

        // Skip header row and process electricians
        const allElectricians: Electrician[] = [];

        for (const row of rows.slice(1) as string[][]) {
            // Column indices based on sheet structure:
            // 0: Timestamp, 1: ElectricianID, 2: NameAsPerAadhaar, 3: PhonePrimary,
            // 10: City, 9: Area, 14: Lat, 15: Lng, 18: Status
            const electricianLat = parseFloat(row[14] || '0');
            const electricianLng = parseFloat(row[15] || '0');
            const status = row[18] || 'PENDING';

            // Only include verified electricians
            if (status !== ELECTRICIAN_STATUS.VERIFIED) {
                continue;
            }

            // Calculate distance
            const distance = calculateDistance(lat, lng, electricianLat, electricianLng);

            // Only include if within radius
            if (distance > radius) {
                continue;
            }

            allElectricians.push({
                id: row[1] || '',
                name: row[2] || '',
                phone: row[3] || '',
                city: row[10] || '',
                area: row[9] || '',
                lat: electricianLat,
                lng: electricianLng,
                distance: Math.round(distance * 10) / 10,
                status,
            });
        }

        // Sort by distance
        const electricians = allElectricians.sort((a, b) => a.distance - b.distance);

        return NextResponse.json({
            success: true,
            electricians,
            count: electricians.length
        });

    } catch (error) {
        console.error('Fetch electricians error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch electricians'
        }, { status: 500 });
    }
}
