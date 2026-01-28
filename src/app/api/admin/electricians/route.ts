import { NextResponse } from 'next/server';
import { getRows, SHEET_TABS } from '@/lib/google-sheets';

export async function GET() {
    try {
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);

        if (rows.length <= 1) {
            return NextResponse.json({ success: true, electricians: [] });
        }

        // Map rows to electrician objects
        const electricians = rows.slice(1).map((row: string[]) => ({
            id: row[1] || '',
            name: row[2] || '',
            phone: row[3] || '',
            city: row[10] || '',
            area: row[9] || '',
            status: row[18] || 'PENDING',
            timestamp: row[0] || '',
        }));

        return NextResponse.json({ success: true, electricians });

    } catch (error) {
        console.error('Fetch electricians error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch electricians'
        }, { status: 500 });
    }
}
