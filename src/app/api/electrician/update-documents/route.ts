import { NextRequest, NextResponse } from 'next/server';
import { updateRow, getRows, SHEET_TABS } from '@/lib/google-sheets';
import { uploadKYCDocument } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const electricianId = formData.get('electricianId') as string;

        if (!electricianId) {
            return NextResponse.json({ success: false, error: 'Electrician ID is required' }, { status: 400 });
        }

        // Get uploaded files
        const aadhaarFrontFile = formData.get('aadhaarFront') as File | null;
        const aadhaarBackFile = formData.get('aadhaarBack') as File | null;
        const panFrontFile = formData.get('panFront') as File | null;

        if (!aadhaarFrontFile && !aadhaarBackFile && !panFrontFile) {
            return NextResponse.json({ success: false, error: 'No files to upload' }, { status: 400 });
        }

        // Find electrician row
        const rows = await getRows(SHEET_TABS.ELECTRICIANS);
        const headers = rows[0] || [];
        const idIndex = headers.indexOf('ElectricianID');
        const rowIndex = rows.findIndex((row: string[]) => row[idIndex] === electricianId);

        if (rowIndex === -1) {
            return NextResponse.json({ success: false, error: 'Electrician not found' }, { status: 404 });
        }

        // Column indices (0-based) must match SHEET structure
        // Assuming:
        // AadhaarFrontURL -> Index 5 (F)
        // AadhaarBackURL  -> Index 6 (G)
        // PanFrontURL     -> Index 7 (H)

        const aadhaarFrontIndex = headers.indexOf('AadhaarFrontURL');
        const aadhaarBackIndex = headers.indexOf('AadhaarBackURL');
        const panFrontIndex = headers.indexOf('PanFrontURL');

        // Helper to upload and update
        const uploadAndUpdate = async (file: File, publicIdSuffix: 'aadhaar_front' | 'aadhaar_back' | 'pan', colIndex: number) => {
            try {
                const buffer = Buffer.from(await file.arrayBuffer());
                const url = await uploadKYCDocument(buffer, publicIdSuffix, electricianId);
                // Row index + 1 because Sheets are 1-indexed
                await updateRow(SHEET_TABS.ELECTRICIANS, rowIndex + 1, colIndex, url);
                return { success: true, url };
            } catch (error) {
                console.error(`Error uploading ${publicIdSuffix}:`, error);
                return { success: false, error };
            }
        };

        const results = {
            aadhaarFront: aadhaarFrontFile && aadhaarFrontIndex !== -1 ? await uploadAndUpdate(aadhaarFrontFile, 'aadhaar_front', aadhaarFrontIndex) : null,
            aadhaarBack: aadhaarBackFile && aadhaarBackIndex !== -1 ? await uploadAndUpdate(aadhaarBackFile, 'aadhaar_back', aadhaarBackIndex) : null,
            panFront: panFrontFile && panFrontIndex !== -1 ? await uploadAndUpdate(panFrontFile, 'pan', panFrontIndex) : null,
        };

        return NextResponse.json({
            success: true,
            message: 'Documents updated successfully',
            results
        });

    } catch (error) {
        console.error('Update documents error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update documents'
        }, { status: 500 });
    }
}
