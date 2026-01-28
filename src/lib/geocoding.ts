const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface GeocodeResult {
    lat: number;
    lng: number;
    formattedAddress: string;
}

// Geocode an address to coordinates
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    const url = new URL(GEOCODING_API_URL);
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey!);
    url.searchParams.set('region', 'in'); // Bias results to India

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
        };
    }

    return null;
}

// Reverse geocode coordinates to address
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    const url = new URL(GEOCODING_API_URL);
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', apiKey!);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
    }

    return null;
}

// Calculate distance between two points using Haversine formula (in km)
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

// Test geocoding by geocoding a known address
export async function testGeocodingConnection(): Promise<{
    success: boolean;
    message: string;
    data?: GeocodeResult
}> {
    try {
        const testAddress = 'Connaught Place, New Delhi, India';
        const result = await geocodeAddress(testAddress);

        if (result) {
            return {
                success: true,
                message: `Successfully geocoded "${testAddress}" to ${result.lat}, ${result.lng}`,
                data: result,
            };
        } else {
            return {
                success: false,
                message: 'Geocoding returned no results',
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Failed to geocode: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
