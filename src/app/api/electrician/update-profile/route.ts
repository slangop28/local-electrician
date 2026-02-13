import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocoding';

export async function POST(request: NextRequest) {
    try {
        const { electricianId, address, city, pincode, state } = await request.json();

        if (!electricianId) {
            return NextResponse.json(
                { success: false, error: 'Electrician ID is required' },
                { status: 400 }
            );
        }

        // Prepare update payload
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        if (address) updatePayload.address = address;
        if (city) updatePayload.city = city;
        if (pincode) updatePayload.pincode = pincode;
        if (state) updatePayload.state = state;

        // If address fields are being updated, attempt to geocode
        if (address || city || pincode) {
            try {
                // Fetch current details to form complete address
                const { data: current } = await supabaseAdmin
                    .from('electricians')
                    .select('address, city, state, pincode')
                    .eq('electrician_id', electricianId)
                    .single();

                const fullAddress = `${address || current?.address || ''}, ${city || current?.city || ''}, ${state || current?.state || 'India'}, ${pincode || current?.pincode || ''}`;
                console.log('[UpdateProfile] Geocoding address:', fullAddress);

                const geoResult = await geocodeAddress(fullAddress);

                if (geoResult) {
                    updatePayload.latitude = geoResult.lat;
                    updatePayload.longitude = geoResult.lng;
                    console.log('[UpdateProfile] Geocoding successful:', geoResult.lat, geoResult.lng);
                } else {
                    console.warn('[UpdateProfile] Geocoding returned no result');
                }
            } catch (geoErr) {
                console.error('[UpdateProfile] Geocoding error:', geoErr);
            }
        }

        // Update Supabase
        const { error } = await supabaseAdmin
            .from('electricians')
            .update(updatePayload)
            .eq('electrician_id', electricianId);

        if (error) {
            console.error('[UpdateProfile] Supabase update error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update profile' },
                { status: 500 }
            );
        }

        // Also update verified_electricians if they exist there
        // Note: verified_electricians table might not have lat/lng columns yet
        // If not, we just update the address fields
        try {
            const verifiedPayload: any = { updated_at: new Date().toISOString() };
            if (city) verifiedPayload.city = city;
            // if (address) verifiedPayload.address = address; // synced if column exists

            await supabaseAdmin
                .from('verified_electricians')
                .update(verifiedPayload)
                .eq('electrician_id', electricianId);
        } catch (syncErr) {
            console.warn('[UpdateProfile] Failed to sync verified_electricians:', syncErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('[UpdateProfile] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
