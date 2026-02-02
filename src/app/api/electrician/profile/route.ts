import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, ensureSheet } from '@/lib/google-sheets';

interface CustomerMap {
    [key: string]: {
        name: string;
        phone: string;
        address: string;
        city: string;
        pincode: string;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Get electrician data
        const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
        const headers = electricianRows[0] || [];

        let electricianData = null;
        let electricianId = null;

        for (let i = 1; i < electricianRows.length; i++) {
            const row = electricianRows[i];
            if (row[headers.indexOf('PhonePrimary')] === phone) {
                electricianId = row[headers.indexOf('ElectricianID')];
                electricianData = {
                    electricianId,
                    name: row[headers.indexOf('NameAsPerAadhaar')],
                    phonePrimary: row[headers.indexOf('PhonePrimary')],
                    phoneSecondary: row[headers.indexOf('PhoneSecondary')] || '',
                    city: row[headers.indexOf('City')],
                    area: row[headers.indexOf('Area')],
                    state: row[headers.indexOf('State')],
                    pincode: row[headers.indexOf('Pincode')],
                    status: row[headers.indexOf('Status')],
                    referralCode: row[headers.indexOf('ReferralCode')],
                    totalReferrals: parseInt(row[headers.indexOf('TotalReferrals')] || '0'),
                    walletBalance: parseFloat(row[headers.indexOf('WalletBalance')] || '0'),
                    servicesCompleted: 0 // Will be calculated below
                };
                break;
            }
        }

        if (!electricianData) {
            return NextResponse.json(
                { success: false, error: 'Electrician not found' },
                { status: 404 }
            );
        }

        // Get service requests for this electrician
        const serviceRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const serviceHeaders = serviceRows[0] || [];

        // Get customers to map names and addresses
        const customerRows = await getRows(SHEET_TABS.CUSTOMERS);
        const customerHeaders = customerRows[0] || [];
        const customerMap: CustomerMap = {};

        for (let i = 1; i < customerRows.length; i++) {
            const row = customerRows[i];
            const custId = row[customerHeaders.indexOf('CustomerID')];
            if (custId) {
                customerMap[custId] = {
                    name: row[customerHeaders.indexOf('Name')],
                    phone: row[customerHeaders.indexOf('Phone')],
                    address: row[customerHeaders.indexOf('Address')] || '',
                    city: row[customerHeaders.indexOf('City')] || '',
                    pincode: row[customerHeaders.indexOf('Pincode')] || ''
                };
            }
        }

        const services = [];
        let stats = { completed: 0 };

        // Check if Rating column exists
        const ratingIndex = serviceHeaders.indexOf('Rating');
        const completedAtIndex = serviceHeaders.indexOf('CompletedAt');
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        let totalRating = 0;
        let ratingCount = 0;

        for (let i = 1; i < serviceRows.length; i++) {
            const row = serviceRows[i];
            if (row[serviceHeaders.indexOf('ElectricianID')] === electricianId) {
                const status = row[serviceHeaders.indexOf('Status')];

                // Calculate stats
                if (status === 'SUCCESS') stats.completed++;

                // Calculate Rating
                if (ratingIndex !== -1 && row[ratingIndex]) {
                    const r = parseFloat(row[ratingIndex]);
                    if (!isNaN(r) && r > 0) {
                        totalRating += r;
                        ratingCount++;
                    }
                }

                // Filter out completed requests older than 1 hour for the list
                let includeInList = true;
                if (status === 'SUCCESS' && completedAtIndex !== -1 && row[completedAtIndex]) {
                    const completedTime = new Date(row[completedAtIndex]).getTime();
                    if (completedTime < oneHourAgo) {
                        includeInList = false;
                    }
                }

                // Start of service mapping logic (same as before)
                if (includeInList) {
                    services.push({
                        requestId: row[serviceHeaders.indexOf('RequestID')],
                        customerName: customerMap[row[serviceHeaders.indexOf('CustomerID')]]?.name || 'Unknown',
                        customerPhone: customerMap[row[serviceHeaders.indexOf('CustomerID')]]?.phone || '',
                        customerAddress: customerMap[row[serviceHeaders.indexOf('CustomerID')]]?.address || '',
                        customerCity: customerMap[row[serviceHeaders.indexOf('CustomerID')]]?.city || '',
                        serviceType: row[serviceHeaders.indexOf('ServiceType')],
                        status: row[serviceHeaders.indexOf('Status')],
                        preferredDate: row[serviceHeaders.indexOf('PreferredDate')],
                        preferredSlot: row[serviceHeaders.indexOf('PreferredSlot')],
                        timestamp: row[serviceHeaders.indexOf('Timestamp')],
                        description: row[serviceHeaders.indexOf('IssueDetail')],
                        rating: row[ratingIndex] ? parseFloat(row[ratingIndex]) : undefined
                    });
                }
            }
        }

        // Sort services by timestamp descending
        services.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Get bank details
        let bankDetails = null;

        // Find bank details for this electrician
        // Assuming columns: Timestamp, ElectricianID, AccountantName, AccountNumber, IFSCCode, Status
        // Indices: 0, 1, 2, 3, 4, 5
        // Ensure sheet exists before reading
        try {
            await ensureSheet(SHEET_TABS.BANK_DETAILS);
        } catch (e) {
            console.warn('Could not ensure bank sheet:', e);
        }

        const bankRows = await getRows(SHEET_TABS.BANK_DETAILS);
        const bankRow = bankRows.find((row: string[]) => row[1] === electricianId);

        if (bankRow) {
            bankDetails = {
                accountName: bankRow[2],
                accountNumber: bankRow[3],
                ifscCode: bankRow[4],
                status: bankRow[5] || 'PENDING'
            };
        }

        // Calculate average rating
        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 'New';

        return NextResponse.json({
            success: true,
            electrician: {
                ...electricianData,
                servicesCompleted: stats.completed,
                rating: averageRating,
                totalReviews: ratingCount,
                bankDetails: bankDetails || undefined
            },
            services
        });
    } catch (error) {
        console.error('Get electrician profile error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get electrician profile' },
            { status: 500 }
        );
    }
}
