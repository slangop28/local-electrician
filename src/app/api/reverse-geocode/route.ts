import { NextRequest, NextResponse } from 'next/server';

interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

interface ReverseGeocodeResult {
    city: string;
    district: string;
    state: string;
    pincode: string;
    area: string;
    formattedAddress: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (!lat || !lng) {
            return NextResponse.json({
                success: false,
                error: 'Latitude and longitude are required'
            }, { status: 400 });
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'Google Maps API key not configured'
            }, { status: 500 });
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
        );

        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Unable to reverse geocode location'
            }, { status: 400 });
        }

        // Parse address components from the first result
        const result = data.results[0];
        const components: AddressComponent[] = result.address_components || [];

        const parsed: ReverseGeocodeResult = {
            city: '',
            district: '',
            state: '',
            pincode: '',
            area: '',
            formattedAddress: result.formatted_address || ''
        };

        for (const component of components) {
            const types = component.types;

            // Pincode
            if (types.includes('postal_code')) {
                parsed.pincode = component.long_name;
            }

            // State
            if (types.includes('administrative_area_level_1')) {
                parsed.state = component.long_name;
            }

            // District
            if (types.includes('administrative_area_level_2')) {
                parsed.district = component.long_name;
            }

            // City
            if (types.includes('locality')) {
                parsed.city = component.long_name;
            }

            // Area/Sublocality
            if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                parsed.area = component.long_name;
            }

            // Fallback for area
            if (!parsed.area && types.includes('neighborhood')) {
                parsed.area = component.long_name;
            }
        }

        // Fallback: use district as city if city not found
        if (!parsed.city && parsed.district) {
            parsed.city = parsed.district;
        }

        return NextResponse.json({
            success: true,
            address: parsed,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        });

    } catch (error) {
        console.error('Reverse geocode error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to reverse geocode'
        }, { status: 500 });
    }
}
