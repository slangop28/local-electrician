import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: electricians, error } = await supabaseAdmin
            .from('electricians')
            .select('*')
            .eq('status', 'VERIFIED')
            .limit(5);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Map to test format
        const formatted = (electricians || []).map((e: any) => ({
            id: e.electrician_id,
            name: e.name,
            phone: e.phone_primary,
            city: e.city,
            area: e.area,
            lat: e.latitude || 28.6139,
            lng: e.longitude || 77.2090,
        }));

        return NextResponse.json({
            success: true,
            electricians: formatted,
            count: formatted.length
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
