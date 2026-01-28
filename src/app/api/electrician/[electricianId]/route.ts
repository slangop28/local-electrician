import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ electricianId: string }> }
) {
    try {
        const { electricianId } = await params;

        // Get all electricians from sheet
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);

        if (rows.length <= 1) {
            return NextResponse.json({
                success: false,
                error: 'Electrician not found'
            }, { status: 404 });
        }

        // Find the electrician by ID
        const electricianRow = rows.slice(1).find((row: string[]) => row[1] === electricianId);

        if (!electricianRow) {
            return NextResponse.json({
                success: false,
                error: 'Electrician not found'
            }, { status: 404 });
        }

        // Map to electrician object
        const electrician = {
            id: electricianRow[1],
            name: electricianRow[2],
            phone: electricianRow[3],
            city: electricianRow[10],
            area: electricianRow[9],
            lat: parseFloat(electricianRow[14] || '0'),
            lng: parseFloat(electricianRow[15] || '0'),
            status: electricianRow[18],
        };

        return NextResponse.json({
            success: true,
            electrician
        });

    } catch (error) {
        console.error('Fetch electrician error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch electrician'
        }, { status: 500 });
    }
}
