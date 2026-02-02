import { NextRequest, NextResponse } from 'next/server';
import { getRows, updateRow, SHEET_TABS, appendRow } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, rating, feedback } = body;

        if (!requestId || !rating) {
            return NextResponse.json(
                { success: false, error: 'Request ID and rating are required' },
                { status: 400 }
            );
        }

        const rows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        let headers = rows[0] || [];

        // Ensure Rating and Feedback headers exist
        let ratingIndex = headers.indexOf('Rating');
        let feedbackIndex = headers.indexOf('Feedback');

        if (ratingIndex === -1) {
            // Append headers if they don't exist
            // This is a bit of a hack, assuming we can just update the first row
            // We'll append to the end of the header row
            ratingIndex = headers.length;
            feedbackIndex = headers.length + 1;

            // We need to update the header row. 
            // Since updateRow updates a single cell, we do it one by one.
            // Row 1 is the header row (index 1 for updateRow which is 1-based, wait. 
            // updateRow likely takes 1-based row index. 
            // In google-sheets.ts: range: `${tab}!${colLetter}${rowIndex}`

            await updateRow(SHEET_TABS.SERVICE_REQUESTS, 1, ratingIndex, 'Rating');
            await updateRow(SHEET_TABS.SERVICE_REQUESTS, 1, feedbackIndex, 'Feedback');

            // Refresh headers
            headers = [...headers, 'Rating', 'Feedback'];
        }

        let rowIndex = -1;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][headers.indexOf('RequestID')] === requestId) {
                rowIndex = i + 1; // 1-based index
                break;
            }
        }

        if (rowIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'Service request not found' },
                { status: 404 }
            );
        }

        // Update the row
        await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex, ratingIndex, rating.toString());
        if (feedback) {
            await updateRow(SHEET_TABS.SERVICE_REQUESTS, rowIndex, feedbackIndex, feedback);
        }

        return NextResponse.json({
            success: true,
            message: 'Review submitted successfully'
        });

    } catch (error) {
        console.error('Submit review error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit review' },
            { status: 500 }
        );
    }
}
