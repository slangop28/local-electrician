import { NextResponse } from 'next/server';
import { getRows, SHEET_TABS, ensureSheet } from '@/lib/google-sheets';

export async function GET() {
    try {
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);
        // Ensure bank sheet exists
        try {
            await ensureSheet(SHEET_TABS.BANK_DETAILS);
        } catch (e) {
            console.warn('Could not ensure bank sheet:', e);
        }

        const bankRows = await getRows(SHEET_TABS.BANK_DETAILS);

        if (rows.length <= 1) {
            return NextResponse.json({ success: true, electricians: [] });
        }

        // Map rows to electrician objects
        const electricians = rows.slice(1).map((row: string[]) => {
            const electricianId = row[1] || '';
            const bankRow = bankRows.find((r: string[]) => r[1] === electricianId);

            return {
                id: electricianId,
                name: row[2] || '',
                phone: row[3] || '',
                aadhaarFrontURL: row[5] || '',
                aadhaarBackURL: row[6] || '',
                panFrontURL: row[7] || '',
                city: row[10] || '',
                area: row[9] || '',
                status: row[18] || 'PENDING',
                timestamp: row[0] || '',
                bankDetails: bankRow ? {
                    accountName: bankRow[2],
                    accountNumber: bankRow[3],
                    ifscCode: bankRow[4],
                    status: bankRow[5] || 'PENDING'
                } : null
            };
        });

        return NextResponse.json({ success: true, electricians });

    } catch (error) {
        console.error('Fetch electricians error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch electricians'
        }, { status: 500 });
    }
}
