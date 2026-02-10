import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Update electrician's live location
export async function POST(request: NextRequest) {
    try {
        const { electricianId, requestId, latitude, longitude } = await request.json();

        if (!electricianId || !latitude || !longitude) {
            return NextResponse.json(
                { success: false, error: 'Missing electricianId, latitude, or longitude' },
                { status: 400 }
            );
        }

        // Upsert live location into Supabase
        const { error } = await supabaseAdmin
            .from('live_locations')
            .upsert({
                electrician_id: electricianId,
                request_id: requestId || null,
                latitude,
                longitude,
                updated_at: new Date().toISOString()
            }, { onConflict: 'electrician_id' });

        if (error) {
            console.error('[LiveLocation] Upsert error:', error);
            return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update location error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
    }
}

// GET: Fetch electrician's live location
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const electricianId = searchParams.get('electricianId');

        if (!electricianId) {
            return NextResponse.json(
                { success: false, error: 'electricianId required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('live_locations')
            .select('*')
            .eq('electrician_id', electricianId)
            .single();

        if (error || !data) {
            return NextResponse.json({ success: true, location: null });
        }

        // Only return if updated within the last 5 minutes (active tracking)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        if (data.updated_at < fiveMinutesAgo) {
            return NextResponse.json({ success: true, location: null });
        }

        return NextResponse.json({
            success: true,
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
                updatedAt: data.updated_at
            }
        });

    } catch (error) {
        console.error('Get location error:', error);
        return NextResponse.json({ success: false, error: 'Failed to get location' }, { status: 500 });
    }
}
