import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, reverseGeocode } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        // Forward geocoding (address to coordinates)
        if (address) {
            const result = await geocodeAddress(address);

            if (result) {
                return NextResponse.json({
                    success: true,
                    lat: result.lat,
                    lng: result.lng,
                    formattedAddress: result.formattedAddress,
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'Could not geocode address'
                }, { status: 404 });
            }
        }

        // Reverse geocoding (coordinates to address)
        if (lat && lng) {
            const formattedAddress = await reverseGeocode(parseFloat(lat), parseFloat(lng));

            if (formattedAddress) {
                return NextResponse.json({
                    success: true,
                    address: formattedAddress,
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'Could not reverse geocode'
                }, { status: 404 });
            }
        }

        return NextResponse.json({
            success: false,
            error: 'Provide either address or lat/lng'
        }, { status: 400 });

    } catch (error) {
        console.error('Geocode error:', error);
        return NextResponse.json({
            success: false,
            error: 'Geocoding failed'
        }, { status: 500 });
    }
}
