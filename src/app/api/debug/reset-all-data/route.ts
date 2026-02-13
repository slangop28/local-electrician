import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Debug endpoint to reset all data for testing purposes
 * WARNING: This deletes all service requests, service request logs, and clears other test data
 * Use only for testing/development
 */
export async function POST(request: NextRequest) {
    try {
        // Delete all service requests
        const { error: reqError } = await supabaseAdmin
            .from('service_requests')
            .delete()
            .gte('created_at', '2000-01-01'); // Delete all created since 2000

        if (reqError) {
            throw new Error(`Failed to delete service_requests: ${reqError.message}`);
        }

        // Delete all service request logs
        const { error: logError } = await supabaseAdmin
            .from('service_request_logs')
            .delete()
            .gte('created_at', '2000-01-01');

        if (logError) {
            throw new Error(`Failed to delete service_request_logs: ${logError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'All service request data has been cleared successfully',
            note: 'Electricians and Customers data remain intact'
        });
    } catch (error: any) {
        console.error('Data reset error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to reset data'
        }, { status: 500 });
    }
}
