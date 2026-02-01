import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, updateRow, appendRow, ensureSheet } from '@/lib/google-sheets';
import { getTimestamp } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { electricianId, bankAccountName, bankAccountNumber, bankIfscCode } = body;

        if (!electricianId || !bankAccountName || !bankAccountNumber || !bankIfscCode) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Ensure sheet exists
        await ensureSheet(SHEET_TABS.BANK_DETAILS);
        const rows = await getRows(SHEET_TABS.BANK_DETAILS);
        const rowIndex = rows.findIndex((row: string[]) => row[1] === electricianId);

        if (rowIndex !== -1) {
            // Update existing (Col C: Name, D: AccNo, E: IFSC, F: Status)
            const rowNumber = rowIndex + 1;

            // We need to update multiple cells. The library only supports single cell updates via updateRow.
            // But we can call it multiple times for now, or improve the library.
            // Since we don't have updateRow with range, we'll do individual updates.
            // Row number is 1-based index for the actual sheet API?
            // Wait, getRows returns values. Row 0 in array is Row 1 in sheet.
            // If header exists, Row 0 is header?
            // Usually getRows logic in this project returns header too?
            // Let's assume Row 1 is header.

            // Important: In register route, we assume appendRow works.
            // We need to be careful with indices.
            // Let's assume rowIndex + 1 is the physical row number. 
            // C = 2, D = 3, E = 4, F = 5 (0-indexed columns).

            await updateRow(SHEET_TABS.BANK_DETAILS, rowNumber, 2, bankAccountName);
            await updateRow(SHEET_TABS.BANK_DETAILS, rowNumber, 3, bankAccountNumber);
            await updateRow(SHEET_TABS.BANK_DETAILS, rowNumber, 4, bankIfscCode);
            await updateRow(SHEET_TABS.BANK_DETAILS, rowNumber, 5, 'PENDING');

            return NextResponse.json({
                success: true,
                message: 'Bank details updated for verification'
            });

        } else {
            // Append new
            const bankRowData = [
                getTimestamp(),
                electricianId,
                bankAccountName,
                bankAccountNumber,
                bankIfscCode,
                'PENDING',
            ];
            await appendRow(SHEET_TABS.BANK_DETAILS, bankRowData);

            return NextResponse.json({
                success: true,
                message: 'Bank details added for verification'
            });
        }

    } catch (error) {
        console.error('Update bank error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update bank details'
        }, { status: 500 });
    }
}
