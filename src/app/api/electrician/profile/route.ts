import { NextRequest, NextResponse } from 'next/server';
import { getRows, SHEET_TABS, ensureSheet } from '@/lib/google-sheets';
import { supabaseAdmin } from '@/lib/supabase';

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
        const searchElectricianId = searchParams.get('electricianId');

        if (!phone && !searchElectricianId) {
            return NextResponse.json(
                { success: false, error: 'Phone number or electricianId is required' },
                { status: 400 }
            );
        }

        // ===== 1. Try Supabase first =====
        try {
            let supaElectrician = null;

            if (phone) {
                const { data } = await supabaseAdmin
                    .from('electricians')
                    .select('*')
                    .eq('phone_primary', phone)
                    .single();
                supaElectrician = data;
            }
            if (!supaElectrician && searchElectricianId) {
                const { data } = await supabaseAdmin
                    .from('electricians')
                    .select('*')
                    .eq('electrician_id', searchElectricianId)
                    .single();
                supaElectrician = data;
            }

            if (supaElectrician) {
                const electricianId = supaElectrician.electrician_id;

                // Get service requests
                const { data: serviceRequests } = await supabaseAdmin
                    .from('service_requests')
                    .select('*')
                    .eq('electrician_id', electricianId)
                    .order('created_at', { ascending: false });

                let completedCount = 0;
                let totalRating = 0;
                let ratingCount = 0;
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

                const services = (serviceRequests || [])
                    .map((req: any) => {
                        if (req.status === 'SUCCESS') completedCount++;
                        if (req.rating && req.rating > 0) {
                            totalRating += req.rating;
                            ratingCount++;
                        }
                        return req;
                    })
                    .filter((req: any) => {
                        // Filter out completed requests older than 1 hour
                        if (req.status === 'SUCCESS' && req.completed_at && req.completed_at < oneHourAgo) {
                            return false;
                        }
                        return true;
                    })
                    .map((req: any) => ({
                        requestId: req.request_id,
                        customerName: req.customer_name || 'Unknown',
                        customerPhone: req.customer_phone || '',
                        customerAddress: req.customer_address || '',
                        customerCity: req.customer_city || '',
                        serviceType: req.service_type,
                        status: req.status,
                        preferredDate: req.preferred_date,
                        preferredSlot: req.preferred_slot,
                        timestamp: req.created_at,
                        description: req.description,
                        rating: req.rating
                    }));

                // Get bank details
                let bankDetails = undefined;
                const { data: bankData } = await supabaseAdmin
                    .from('bank_details')
                    .select('*')
                    .eq('electrician_id', electricianId)
                    .single();

                if (bankData) {
                    bankDetails = {
                        accountName: bankData.account_holder_name,
                        accountNumber: bankData.account_number,
                        ifscCode: bankData.ifsc_code,
                        status: bankData.status || 'PENDING'
                    };
                }

                const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 'New';

                return NextResponse.json({
                    success: true,
                    electrician: {
                        electricianId,
                        name: supaElectrician.name,
                        phonePrimary: supaElectrician.phone_primary,
                        phoneSecondary: supaElectrician.phone_secondary || '',
                        city: supaElectrician.city,
                        area: supaElectrician.area,
                        state: supaElectrician.state,
                        pincode: supaElectrician.pincode,
                        status: supaElectrician.status,
                        referralCode: supaElectrician.referral_code,
                        totalReferrals: supaElectrician.total_referrals || 0,
                        walletBalance: supaElectrician.wallet_balance || 0,
                        aadhaarFrontURL: supaElectrician.aadhaar_front_url || null,
                        aadhaarBackURL: supaElectrician.aadhaar_back_url || null,
                        panFrontURL: supaElectrician.pan_front_url || null,
                        servicesCompleted: completedCount,
                        rating: averageRating,
                        totalReviews: ratingCount,
                        bankDetails
                    },
                    services
                });
            }
        } catch (supaErr) {
            console.error('[ElectricianProfile] Supabase error, falling back:', supaErr);
        }

        // ===== 2. Fallback to Google Sheets =====
        const electricianRows = await getRows(SHEET_TABS.ELECTRICIANS);
        const headers = electricianRows[0] || [];

        let electricianData = null;
        let electricianId = null;

        for (let i = 1; i < electricianRows.length; i++) {
            const row = electricianRows[i];
            const rowPhone = row[headers.indexOf('PhonePrimary')];
            const rowId = row[headers.indexOf('ElectricianID')];

            if ((phone && rowPhone === phone) || (searchElectricianId && rowId === searchElectricianId)) {
                electricianId = rowId;
                electricianData = {
                    electricianId,
                    name: row[headers.indexOf('NameAsPerAadhaar')],
                    phonePrimary: rowPhone,
                    phoneSecondary: row[headers.indexOf('PhoneSecondary')] || '',
                    city: row[headers.indexOf('City')],
                    area: row[headers.indexOf('Area')],
                    state: row[headers.indexOf('State')],
                    pincode: row[headers.indexOf('Pincode')],
                    status: row[headers.indexOf('Status')],
                    referralCode: row[headers.indexOf('ReferralCode')],
                    totalReferrals: parseInt(row[headers.indexOf('TotalReferrals')] || '0'),
                    walletBalance: parseFloat(row[headers.indexOf('WalletBalance')] || '0'),
                    aadhaarFrontURL: row[headers.indexOf('AadhaarFrontURL')] || null,
                    aadhaarBackURL: row[headers.indexOf('AadhaarBackURL')] || null,
                    panFrontURL: row[headers.indexOf('PanFrontURL')] || null,
                    servicesCompleted: 0
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

        // Get service requests from Sheets
        const serviceRows = await getRows(SHEET_TABS.SERVICE_REQUESTS);
        const serviceHeaders = serviceRows[0] || [];
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
        const ratingIndex = serviceHeaders.indexOf('Rating');
        const completedAtIndex = serviceHeaders.indexOf('CompletedAt');
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        let totalRating = 0;
        let ratingCount = 0;

        for (let i = 1; i < serviceRows.length; i++) {
            const row = serviceRows[i];
            if (row[serviceHeaders.indexOf('ElectricianID')] === electricianId) {
                const status = row[serviceHeaders.indexOf('Status')];
                if (status === 'SUCCESS') stats.completed++;

                if (ratingIndex !== -1 && row[ratingIndex]) {
                    const r = parseFloat(row[ratingIndex]);
                    if (!isNaN(r) && r > 0) {
                        totalRating += r;
                        ratingCount++;
                    }
                }

                let includeInList = true;
                if (status === 'SUCCESS' && completedAtIndex !== -1 && row[completedAtIndex]) {
                    const completedTime = new Date(row[completedAtIndex]).getTime();
                    if (completedTime < oneHourAgo) {
                        includeInList = false;
                    }
                }

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

        services.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        let bankDetails = null;
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
