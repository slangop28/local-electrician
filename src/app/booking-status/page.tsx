'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Card, useToast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingDetails {
    requestId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    serviceType: string;
    status: string;
    preferredDate: string;
    preferredSlot: string;
    description?: string;
    timestamp: string;
    electricianId?: string;
    electricianName?: string;
    electricianPhone?: string;
    electricianCity?: string;
    electricianImage?: string;
    rating?: number;
    otp?: string; // If OTP verification is needed later
}

const STEPS = [
    { key: 'NEW', label: 'Booking Placed', icon: '📝' },
    { key: 'ACCEPTED', label: 'Booking Confirmed', icon: '✅' },
    { key: 'IN_PROGRESS', label: 'Work Started', icon: '⚡' },
    { key: 'SUCCESS', label: 'Completed', icon: '✅' },
];

export default function BookingStatusPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile, isAuthenticated, isLoading } = useAuth();
    const { showToast } = useToast();

    const requestIdFromUrl = searchParams.get('requestId') || '';
    const [activeRequestId, setActiveRequestId] = useState<string>(requestIdFromUrl);
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    // Update activeRequestId if search param changes
    useEffect(() => {
        if (requestIdFromUrl) {
            setActiveRequestId(requestIdFromUrl);
        }
    }, [requestIdFromUrl]);

    // Fetch booking details
    useEffect(() => {
        console.log('[BookingStatus] Effect running:', {
            isLoading,
            isAuthenticated,
            activeRequestId,
            phone: userProfile?.phone,
            userProfile
        });

        // Wait for auth to finish loading
        if (isLoading) return;

        // If not authenticated, the other effect will handle redirect
        if (!isAuthenticated) return;

        if (!activeRequestId && !userProfile?.phone) {
            console.warn('[BookingStatus] Missing ID and phone');
            setError('No booking ID or phone number found');
            setLoading(false);
            return;
        }

        const fetchBooking = async () => {
            try {
                setLoading(true);
                setError(null);

                let targetRequestId = activeRequestId;

                // If no ID provided, try to fetch active booking for user
                if (!targetRequestId && userProfile?.phone) {
                    try {
                        const activeRes = await fetch(`/api/customer/active-request?customerId=${encodeURIComponent(userProfile?.phone)}`);
                        const activeData = await activeRes.json();
                        if (activeData.success && activeData.activeRequest) {
                            targetRequestId = activeData.activeRequest.requestId;
                            setActiveRequestId(targetRequestId); // Update state to trigger subscription
                        } else {
                            setError('No active booking found');
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.error('Failed to auto-fetch active booking:', e);
                        setError('No booking ID provided');
                        setLoading(false);
                        return;
                    }
                }

                if (!targetRequestId) return;

                // Fetch from API (Secure, bypasses RLS)
                const response = await fetch(`/api/request/${targetRequestId}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch booking');
                }

                const bookingData = data.request;

                if (bookingData) {
                    setBooking({
                        requestId: bookingData.request_id || bookingData.requestId,
                        customerName: bookingData.customer_name || bookingData.customerName || userProfile?.name || 'You',
                        customerPhone: bookingData.customer_phone || bookingData.customerPhone,
                        customerAddress: bookingData.customer_address || bookingData.customerAddress || '',
                        customerCity: bookingData.customer_city || bookingData.customerCity || '',
                        serviceType: bookingData.service_type || bookingData.serviceType,
                        status: bookingData.status,
                        preferredDate: bookingData.preferred_date || bookingData.preferredDate,
                        preferredSlot: bookingData.preferred_slot || bookingData.preferredSlot,
                        description: bookingData.description || '',
                        timestamp: bookingData.created_at || bookingData.timestamp,
                        electricianId: bookingData.electrician_id || bookingData.electricianId,
                        // Support both snake_case and camelCase for electrician details
                        electricianName: bookingData.electrician_name || bookingData.electricianName,
                        electricianPhone: bookingData.electrician_phone || bookingData.electricianPhone,
                        electricianCity: bookingData.electrician_city || bookingData.electricianCity,
                        rating: bookingData.rating
                    });
                } else {
                    setError('Booking not found');
                }
            } catch (err: any) {
                console.error('Error fetching booking:', err);
                setError(err.message || 'Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();

        // Subscribe to real-time updates ONLY if we have a request ID
        if (!activeRequestId) return;

        const subscription = supabase
            .channel(`request:${activeRequestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'service_requests',
                    filter: `request_id=eq.${activeRequestId}`,
                },
                async (payload: any) => {
                    console.log('Real-time update received:', payload.new.status);
                    // Re-fetch full details from API which handles both DB and Sheets logic
                    fetchBooking();
                    showToast(`Booking status: ${payload.new.status}`, 'info');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [activeRequestId, userProfile, isAuthenticated, isLoading, showToast]);


    const getStatusIndex = (status: string) => {
        // Map various DB statuses to our 4 steps
        if (status === 'NEW' || status === 'PENDING') return 0;
        if (status === 'ACCEPTED') return 1;
        if (status === 'IN_PROGRESS' || status === 'STARTED') return 2;
        if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'DONE') return 3;
        if (status === 'CANCELLED' || status === 'DECLINED') return -1;
        return 0;
    };

    const currentStepIndex = booking ? getStatusIndex(booking.status) : 0;
    const isCancelled = booking?.status === 'CANCELLED' || booking?.status === 'DECLINED';

    const getStatusBadge = (status: string) => {
        const styles = {
            NEW: 'bg-amber-100 text-amber-800 border-amber-200',
            ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
            IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
            SUCCESS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            CANCELLED: 'bg-red-100 text-red-800 border-red-200',
            DECLINED: 'bg-red-100 text-red-800 border-red-200',
        };
        // @ts-ignore
        const className = styles[status] || styles.NEW;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${className}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading booking details...</p>
                </div>
            </main>
        );
    }

    if (error || !booking) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-4">😕</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
                <p className="text-gray-600 mb-6 text-center max-w-md">{error || "We couldn't find the booking you're looking for."}</p>
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <span className="text-white text-sm font-bold">LE</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg tracking-tight">Local Electrician</span>
                    </Link>
                    <Link href="/profile">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            My Bookings
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Status Hero */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    {isCancelled ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✕</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Cancelled</h2>
                            <p className="text-gray-600">This request has been cancelled. Please make a new booking if needed.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Status</p>
                                    {getStatusBadge(booking.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 font-medium mb-1">Booking ID</p>
                                    <p className="font-mono text-gray-900 font-bold tracking-wider">#{booking.requestId.slice(0, 8)}</p>
                                </div>
                            </div>

                            {/* Stepper */}
                            <div className="relative flex justify-between">
                                {/* Connecting Line */}
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                                <div
                                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
                                    style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                                ></div>

                                {STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isActive = index === currentStepIndex;

                                    return (
                                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 border-4 
                                               ${isCompleted ? 'bg-emerald-500 border-white text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 border-white text-gray-400'}`}
                                            >
                                                {step.icon}
                                            </div>
                                            <span className={`text-[10px] sm:text-xs font-bold mt-2 whitespace-nowrap ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {booking.status === 'NEW' && (
                                <div className="mt-8 bg-amber-50 rounded-xl p-4 flex items-start gap-3 border border-amber-100">
                                    <div className="text-amber-500 text-xl animate-pulse">⏳</div>
                                    <div>
                                        <p className="text-amber-900 font-bold text-sm">Finding best electrician nearby...</p>
                                        <p className="text-amber-700 text-xs mt-1">We have notified electricians in your area. Usually takes 2-5 minutes.</p>
                                    </div>
                                </div>
                            )}

                            {booking.status === 'ACCEPTED' && (
                                <div className="mt-8 bg-blue-50 rounded-xl p-4 flex items-start gap-3 border border-blue-100">
                                    <div className="text-blue-500 text-xl">🎉</div>
                                    <div>
                                        <p className="text-blue-900 font-bold text-sm">Booking Confirmed!</p>
                                        <p className="text-blue-700 text-xs mt-1">Technician has accepted your request. Expect a call shortly.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Electrician Card - Only Show if Assigned */}
                    {booking.electricianId && !isCancelled && (
                        <Card className="border-t-4 border-t-emerald-500 p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>

                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>⚡</span> Your Electrician
                            </h3>

                            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl mb-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
                                    👨‍🔧
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">
                                    {booking.electricianName || 'Electrician'}
                                </h4>
                                {booking.electricianCity && (
                                    <p className="text-sm text-gray-500">📍 {booking.electricianCity}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${booking.electricianPhone}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <span>📞</span> Call Now
                                </a>
                            </div>
                        </Card>
                    )}

                    {/* Booking Details */}
                    <Card className="p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Details</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-gray-100 pb-3">
                                <span className="text-sm text-gray-500">Service</span>
                                <span className="text-sm font-bold text-gray-900">{booking.serviceType}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3">
                                <span className="text-sm text-gray-500">Date</span>
                                <span className="text-sm font-bold text-gray-900">{booking.preferredDate}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-3">
                                <span className="text-sm text-gray-500">Time</span>
                                <span className="text-sm font-bold text-gray-900">{booking.preferredSlot}</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm text-gray-500 mb-1">Issue Description</p>
                                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg leading-relaxed">
                                    {booking.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Customer Details */}
                    <Card className="p-6 shadow-sm md:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Location & Contact</h3>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                📍
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{booking.customerName}</p>
                                <p className="text-sm text-gray-600">{booking.customerAddress}</p>
                                <p className="text-sm text-gray-600">{booking.customerCity}</p>
                                <p className="text-sm text-gray-900 mt-1">📞 +91 {booking.customerPhone}</p>
                            </div>
                        </div>
                    </Card>

                </div>

                {/* Footer Actions */}
                <div className="flex justify-center pt-6 opacity-80">
                    <p className="text-xs text-gray-400">
                        Need help? Contact support at support@localelectrician.com
                    </p>
                </div>
            </div>
        </main>
    );
}

