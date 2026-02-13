'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, useToast, NotificationBell } from '@/components/ui';
import { PaymentModal } from '@/components/ui/PaymentModal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

interface Electrician {
    id: string;
    name: string;
    phone: string;
    city: string;
    area: string;
    lat: number;
    lng: number;
    distance: number;
}

export default function CustomerDashboard() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationAddress, setLocationAddress] = useState(''); // Display detected location
    const [address, setAddress] = useState('');
    const [electricians, setElectricians] = useState<Electrician[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [gettingLocation, setGettingLocation] = useState(false);

    // Check for redirect param
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('broadcast_initiated') === 'true') {
                // Clear the param to prevent showing again on reload (optional but good ux)
                window.history.replaceState(null, '', '/app');

                // Show Special Notification
                showToast('We are finding the best technician for you.. Hold on and grab a Coffee ☕', 'info');
            }
        }
    }, []);

    // Request & Payment State
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Derived Notifications (Removed)

    // Fetch active request
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchRequest = async () => {
            if (userProfile?.id) {
                await fetchActiveRequest();
            }
        };

        if (userProfile?.id) {
            fetchRequest();
            // Poll every 3 seconds for faster real-time updates
            intervalId = setInterval(fetchRequest, 3000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [userProfile]);

    const fetchActiveRequest = async () => {
        try {
            const response = await fetch(`/api/customer/active-request?phone=${userProfile?.phone || ''}&email=${userProfile?.email || ''}`);
            const data = await response.json();
            if (data.success && data.activeRequest) {
                if (['NEW', 'ACCEPTED', 'IN_PROGRESS'].includes(data.activeRequest.status)) {
                    setActiveRequest(data.activeRequest);
                }
            }
        } catch (error) {
            console.error('Failed to fetch request:', error);
        }
    };

    const handlePaymentSuccess = async () => {
        if (!activeRequest) return;
        try {
            const response = await fetch('/api/customer/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: activeRequest.requestId })
            });
            const data = await response.json();
            if (data.success) {
                showToast('Payment successful! Technician rated.', 'success');
                setActiveRequest(null); // Clear request or showing rated state
                setShowPaymentModal(false);
            } else {
                showToast('Failed to record payment', 'error');
            }
        } catch (error) {
            showToast('Payment processing error', 'error');
        }
    };

    // Get user's location with improved reliability
    const handleGetLocation = () => {
        if ('geolocation' in navigator) {
            setGettingLocation(true);
            setError('');

            // First try with high accuracy
            const highAccuracyOptions = {
                enableHighAccuracy: true,
                timeout: 10000, // 10 second timeout
                maximumAge: 60000 // Accept cached position up to 1 minute old
            };

            // Fallback to lower accuracy if high accuracy fails
            const lowAccuracyOptions = {
                enableHighAccuracy: false,
                timeout: 15000, // 15 second timeout
                maximumAge: 300000 // Accept cached position up to 5 minutes old
            };

            const onSuccess = async (position: GeolocationPosition) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setLocation(coords);
                console.log('Location detected:', coords);

                // Fetch address for the detected location
                try {
                    const response = await fetch(`/api/geocode?lat=${coords.lat}&lng=${coords.lng}`);
                    const data = await response.json();
                    if (data.success && data.address) {
                        setLocationAddress(data.address);
                        console.log('Address:', data.address);
                    }
                } catch (err) {
                    console.error('Failed to get address:', err);
                }

                setGettingLocation(false);
            };

            const onHighAccuracyError = (err: GeolocationPositionError) => {
                console.warn('High accuracy location failed, trying low accuracy...', err);
                // Try again with lower accuracy as fallback
                navigator.geolocation.getCurrentPosition(
                    onSuccess,
                    onFinalError,
                    lowAccuracyOptions
                );
            };

            const onFinalError = (err: GeolocationPositionError) => {
                console.error('Location error:', err);
                setGettingLocation(false);

                // Provide more specific error messages
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Location permission denied. Please enable location access in your browser settings and try again.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Location unavailable. Please check your GPS/network connection or enter address manually.');
                        break;
                    case err.TIMEOUT:
                        setError('Location request timed out. Please try again or enter address manually.');
                        break;
                    default:
                        setError('Could not get your location. Please enter address manually.');
                }
            };

            navigator.geolocation.getCurrentPosition(
                onSuccess,
                onHighAccuracyError,
                highAccuracyOptions
            );
        } else {
            setError('Geolocation is not supported by your browser. Please enter address manually.');
        }
    };

    // Search by address
    const handleAddressSearch = async () => {
        if (!address.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
            const data = await response.json();

            if (data.lat && data.lng) {
                setLocation({ lat: data.lat, lng: data.lng });
                setLocationAddress(data.formattedAddress || address);
                console.log('Address search result:', { lat: data.lat, lng: data.lng, address: data.formattedAddress });
            } else {
                setError('Could not find location. Please try a different address.');
            }
        } catch (err) {
            console.error('Geocode error:', err);
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch nearby electricians when location changes
    useEffect(() => {
        if (location) {
            fetchElectricians();
        }
    }, [location]);

    const fetchElectricians = async () => {
        if (!location) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/electricians/nearby?lat=${location.lat}&lng=${location.lng}&radius=15`
            );
            const data = await response.json();

            if (data.success) {
                setElectricians(data.electricians || []);
                if (data.electricians?.length === 0) {
                    setError(data.message || 'No electricians found within 15km of your location.');
                }
            } else {
                console.error('Nearby API error:', data.error);
                setError(data.error || 'Failed to fetch electricians');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Network error. Could not connect to server. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookElectrician = async (electricianId: string) => {
        if (!userProfile?.id || !location) return;

        try {
            // Optimistic UI update
            showToast('Sending booking request...', 'info');

            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const response = await fetch('/api/request/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: userProfile.id,
                    customerName: userProfile.name || '',
                    customerPhone: userProfile.phone || '',
                    customerEmail: userProfile.email || '',
                    serviceType: 'General Electrical Work',
                    address: locationAddress || 'Current Location',
                    city: 'Location Search', // Or derive from geocode
                    electricianId: electricianId,
                    preferredDate: today,
                    preferredSlot: 'ASAP', // Or `Now (${currentTime})`
                    urgency: 'High'
                })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Booking request sent!', 'success');
                setActiveRequest(data.request); // Ensure this has the new fields
                // Redirect to booking status page for better UX
                router.push(`/booking-status?requestId=${data.requestId}`);
            } else {
                showToast(data.error || 'Failed to book electrician', 'error');
            }
        } catch (error) {
            console.error('Booking error:', error);
            showToast('Failed to book electrician. Please try again.', 'error');
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="font-bold text-gray-900 hidden sm:block">Local Electrician</span>
                    </Link>

                    {/* Navigation & Actions */}
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-gray-600">
                                🏠 Home
                            </Button>
                        </Link>
                        <Link href="/profile">
                            <Button variant="outline" size="sm" className="flex items-center gap-2 border-blue-100 text-blue-600 hover:bg-blue-50">
                                👤 My Profile
                            </Button>
                        </Link>
                        <NotificationBell notifications={[]} />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Payment Modal */}
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={250}
                    serviceType={activeRequest?.serviceType || 'Service'}
                />

                {/* Location Section */}
                <Card variant="elevated" padding="lg" className="mb-6 border-none shadow-xl shadow-gray-200/50 bg-white">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">📍</span>
                        Your Service Location
                    </h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant={location ? 'outline' : 'primary'}
                                onClick={handleGetLocation}
                                loading={gettingLocation}
                                className="flex-shrink-0 h-12"
                                fullWidth={true} // Priority on mobile
                            >
                                <span className="mr-2 text-xl">🎯</span>
                                {location ? 'Update GPS Location' : 'Detect My Location'}
                            </Button>

                            <div className="hidden sm:flex items-center px-4 text-gray-300 font-bold">OR</div>

                            <div className="flex-1 flex gap-2">
                                <Input
                                    label="Search Address"
                                    placeholder="Enter area or landmark..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleAddressSearch}
                                    loading={loading}
                                    className="h-11"
                                >
                                    🔍
                                </Button>
                            </div>
                        </div>

                        {location && (
                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    Location Set
                                </div>
                                {locationAddress && (
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                        {locationAddress}
                                    </p>
                                )}
                                <p className="text-[10px] text-gray-400 font-mono italic">
                                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                </Card>

                {/* View Toggle */}
                {/* Book Electrician Button - Premium Design */}
                {
                    location && (
                        <div className="mb-8 relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-2xl shadow-cyan-100/50 flex flex-col items-center text-center gap-6">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10">
                                <h2 className="text-2xl font-black mb-2 text-gray-900 tracking-tight">Need an Electrician?</h2>
                                <p className="text-gray-500 max-w-md text-sm sm:text-base">Get instant help from the nearest verified technician in your area.</p>
                            </div>

                            <Link href="/request/broadcast" className="w-full sm:w-auto relative z-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
                                    <Button size="lg" className="relative h-14 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold rounded-2xl px-10 shadow-lg border-t border-cyan-400/30 w-full sm:w-auto">
                                        <span className="mr-2 text-xl">⚡</span>
                                        Book Now
                                    </Button>
                                </div>
                            </Link>
                        </div>
                    )
                }



                {
                    location && (
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-600">
                                {electricians.length > 0
                                    ? `Found ${electricians.length} electrician${electricians.length > 1 ? 's' : ''} nearby`
                                    : 'No electricians found within 15km'
                                }
                            </p>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                        viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                                    )}
                                >
                                    📋 List
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={cn(
                                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                        viewMode === 'map' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                                    )}
                                >
                                    🗺️ Map
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Loading State */}
                {
                    loading && location && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} variant="default" padding="md" className="animate-pulse">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )
                }

                {/* Electricians List */}
                {
                    !loading && location && viewMode === 'list' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {electricians.length === 0 ? (
                                <Card variant="bordered" padding="lg" className="col-span-full text-center">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Electricians Found</h3>
                                    <p className="text-gray-600 mb-4">
                                        We couldn&apos;t find verified electricians in your area yet.
                                    </p>

                                </Card>
                            ) : (
                                electricians.map((electrician) => (
                                    <ElectricianCard
                                        key={electrician.id}
                                        electrician={electrician}
                                        onBook={handleBookElectrician}
                                    />
                                ))
                            )}
                        </div>
                    )
                }

                {/* Map View Placeholder */}
                {
                    !loading && location && viewMode === 'map' && (
                        <Card variant="bordered" padding="none" className="h-[500px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🗺️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Map View</h3>
                                <p className="text-gray-600">
                                    Map integration coming soon!
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Showing {electricians.length} electricians in list view
                                </p>
                            </div>
                        </Card>
                    )
                }

                {/* No Location State */}
                {
                    !location && !loading && (
                        <Card variant="bordered" padding="lg" className="text-center">
                            <div className="text-6xl mb-4">📍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Share Your Location</h3>
                            <p className="text-gray-600 mb-6">
                                We need your location to find electricians near you
                            </p>
                            <Button onClick={handleGetLocation} loading={gettingLocation}>
                                <span className="mr-2">🎯</span>
                                Enable Location
                            </Button>
                        </Card>
                    )
                }
            </div >
        </main >
    );
}

// Electrician Card Component
function ElectricianCard({ electrician, onBook }: { electrician: Electrician; onBook: (id: string) => void }) {
    return (
        <Card variant="elevated" hover padding="none" className="group overflow-hidden border-none shadow-lg shadow-gray-200/50 bg-white">
            <div className="p-5">
                <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                        <span className="text-2xl filter drop-shadow-sm">👷</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate tracking-tight text-base">{electrician.name}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{electrician.area}, {electrician.city}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold border border-emerald-100 uppercase tracking-tighter">
                                Verified
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {electrician.distance.toFixed(1)} km
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                    <span className="text-xs text-gray-400 ml-1 font-medium">5.0</span>
                </div>
            </div>

            <div className="px-5 pb-5">
                <Button
                    fullWidth
                    size="sm"
                    variant="outline"
                    className="h-10 text-blue-600 border-blue-100 hover:bg-blue-50 hover:border-blue-200 rounded-xl font-bold text-xs"
                    onClick={() => window.location.href = `/request/broadcast?electricianId=${electrician.id}&electricianName=${encodeURIComponent(electrician.name)}`}
                >
                    Book Technician
                </Button>
            </div>
        </Card>
    );
}
