// Last updated: 2026-02-12 - Updated to read from Supabase (primary data source)
import { NextRequest, NextResponse } from 'next/server';
import { calculateDistance } from '@/lib/geocoding';
import { supabaseAdmin } from '@/lib/supabase';

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

        // Check env vars are present
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!hasUrl || (!hasServiceKey && !hasAnonKey)) {
            console.error('[Nearby] Missing Supabase env vars:', { hasUrl, hasServiceKey, hasAnonKey });
            return NextResponse.json({
                success: false,
                error: 'Server configuration error. Please check environment variables.'
            }, { status: 500 });
        }

        // Get all VERIFIED electricians from Supabase
        const { data: rows, error } = await supabaseAdmin
            .from('electricians')
            .select('electrician_id, name, phone_primary, city, area, latitude, longitude, status')
            .eq('status', 'VERIFIED');

        if (error) {
            console.error('[Nearby] Supabase query error:', JSON.stringify(error));
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch electricians from database'
            }, { status: 500 });
        }

        if (!rows || rows.length === 0) {
            console.log('[Nearby] No verified electricians found in database');
            return NextResponse.json({
                success: true,
                electricians: [],
                message: 'No verified electricians found'
            });
        }

        // Process and filter by distance
        const allElectricians: Electrician[] = [];

        for (const row of rows) {
            const electricianLat = parseFloat(row.latitude || '0');
            const electricianLng = parseFloat(row.longitude || '0');

            // Skip if no coordinates
            if (!electricianLat || !electricianLng) {
                continue;
            }

            // Calculate distance
            const distance = calculateDistance(lat, lng, electricianLat, electricianLng);

            // Only include if within radius
            if (distance > radius) {
                continue;
            }

            allElectricians.push({
                id: row.electrician_id || '',
                name: row.name || '',
                phone: row.phone_primary || '',
                city: row.city || '',
                area: row.area || '',
                lat: electricianLat,
                lng: electricianLng,
                distance: Math.round(distance * 10) / 10,
                status: row.status || 'VERIFIED',
            });
        }

        // Sort by distance
        const electricians = allElectricians.sort((a, b) => a.distance - b.distance);

        return NextResponse.json({
            success: true,
            electricians,
            count: electricians.length
        });

    } catch (error: any) {
        console.error('[Nearby] Unexpected error:', error?.message || error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch electricians. Please try again.'
        }, { status: 500 });
    }
}
