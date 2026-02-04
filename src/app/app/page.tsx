'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Input, useToast } from '@/components/ui';
import { PaymentModal } from '@/components/ui/PaymentModal';
import NotificationBell, { Notification } from '@/components/ui/NotificationBell';
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
    const { showToast } = useToast();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
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

    // Derived Notifications
    const notifications: Notification[] = [];
    if (activeRequest) {
        if (activeRequest.status === 'ACCEPTED') {
            notifications.push({
                id: 'allocated',
                title: 'Technician Assigned',
                message: 'An electrician is on the way!',
                time: activeRequest.timestamp ? new Date().toLocaleTimeString() : '',
                type: 'success'
            });
        } else if (activeRequest.status === 'SUCCESS') {
            notifications.push({
                id: 'completed',
                title: 'Service Completed',
                message: 'Please complete payment.',
                time: activeRequest.timestamp ? new Date().toLocaleTimeString() : '',
                type: 'info'
            });
        }
    }

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
            // Poll every 5 seconds
            intervalId = setInterval(fetchRequest, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [userProfile]);

    const fetchActiveRequest = async () => {
        try {
            const response = await fetch(`/api/customer/active-request?customerId=${userProfile?.id}`);
            const data = await response.json();
            if (data.success && data.activeRequest) {
                // Only show if status is relevant (NEW, ACCEPTED, SUCCESS)
                if (['NEW', 'ACCEPTED', 'SUCCESS'].includes(data.activeRequest.status)) {
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

            const onSuccess = (position: GeolocationPosition) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
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
            } else {
                setError(data.error || 'Failed to fetch electricians');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load electricians. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="font-bold text-gray-900">Local Electrician</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <NotificationBell notifications={notifications} />
                        <Link href="/electrician">
                            <Button variant="outline" size="sm">Join as Electrician</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* Active Request Card */}
                {activeRequest && (
                    <Card variant="elevated" padding="md" className="mb-6 border-l-4 border-l-blue-500 bg-blue-50/50">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="text-2xl">⚡</span>
                                    Current Service
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    {activeRequest.serviceType} • {activeRequest.timestamp ? new Date(activeRequest.timestamp).toLocaleDateString() : ''}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                        activeRequest.status === 'NEW' ? "bg-amber-100 text-amber-700" :
                                            activeRequest.status === 'ACCEPTED' ? "bg-blue-100 text-blue-700" :
                                                activeRequest.status === 'SUCCESS' ? "bg-green-100 text-green-700" :
                                                    "bg-gray-100 text-gray-700"
                                    )}>
                                        {activeRequest.status === 'SUCCESS' ? 'Service Completed' : activeRequest.status}
                                    </span>
                                </div>
                            </div>

                            {activeRequest.status === 'SUCCESS' && (
                                <div className="w-full md:w-auto">
                                    <Button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 animate-pulse"
                                    >
                                        Confirm & Pay ₹250
                                    </Button>
                                    <p className="text-xs text-center md:text-right text-gray-500 mt-2">
                                        Please confirm service completion
                                    </p>
                                </div>
                            )}

                            {activeRequest.status === 'ACCEPTED' && (
                                <div className="text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-lg">
                                    Electrician is on the way!
                                </div>
                            )}

                            {activeRequest.status === 'NEW' && (
                                <div className="text-sm text-amber-600 bg-amber-100 px-4 py-2 rounded-lg">
                                    Searching for nearby electricians...
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Payment Modal */}
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={250} // Hardcoded for now
                    serviceType={activeRequest?.serviceType || 'Service'}
                />

                {/* Location Section */}
                <Card variant="elevated" padding="md" className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Your Location</h2>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            variant={location ? 'outline' : 'primary'}
                            onClick={handleGetLocation}
                            loading={gettingLocation}
                            className="flex-shrink-0"
                        >
                            <span className="mr-2">🎯</span>
                            {location ? 'Update Location' : 'Use My Location'}
                        </Button>

                        <div className="flex-1 flex gap-2">
                            <Input
                                label="Or enter address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                onClick={handleAddressSearch}
                                loading={loading}
                            >
                                Search
                            </Button>
                        </div>
                    </div>

                    {location && (
                        <p className="text-sm text-green-600 mt-3">
                            ✓ Location set: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 mt-3">{error}</p>
                    )}
                </Card>

                {/* View Toggle */}
                {/* Book Electrician Button - Glowing Blue */}
                {location && (
                    <div className="mb-8 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 text-gray-900">Need an Electrician Urgently?</h2>
                            <p className="text-gray-600">Broadcast your request to all nearby electricians instantly.</p>
                        </div>
                        <Link href="/request/broadcast">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-cyan-400/50 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse-glow" />
                                <Button size="lg" className="relative bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-cyan-500 border border-cyan-300/50 shadow-lg shadow-cyan-500/30 whitespace-nowrap px-8 py-4 text-lg animate-pulse">
                                    <span className="mr-2">⚡</span>
                                    Book Electrician
                                </Button>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Active Request Notification */}
                {activeRequest && activeRequest.status === 'NEW' && activeRequest.electricianId === 'BROADCAST' && (
                    <div className="mb-8">
                        <Card variant="elevated" className="bg-blue-50 border-blue-200 animate-pulse">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-2xl animate-spin-slow">📡</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-blue-900">Broadcasting Request...</h3>
                                        <p className="text-blue-700 text-sm">Waiting for a nearby electrician to accept.</p>
                                    </div>
                                </div>
                                <Link href="/profile">
                                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-white">
                                        View in Profile →
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                )}

                {activeRequest && activeRequest.status === 'ACCEPTED' && (
                    <div className="mb-8">
                        <Card variant="elevated" className="bg-green-50 border-green-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-green-900">Technician Allotted!</h3>
                                    <p className="text-green-700 text-sm">
                                        Electrician <strong>{activeRequest.electricianId}</strong> is on the way.
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <Button size="sm" variant="primary" onClick={() => window.location.reload()}>View Details</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {location && (
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
                )}

                {/* Loading State */}
                {loading && location && (
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
                )}

                {/* Electricians List */}
                {!loading && location && viewMode === 'list' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {electricians.length === 0 ? (
                            <Card variant="bordered" padding="lg" className="col-span-full text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Electricians Found</h3>
                                <p className="text-gray-600 mb-4">
                                    We couldn&apos;t find verified electricians in your area yet.
                                </p>
                                <Link href="/electrician">
                                    <Button variant="outline">
                                        Know an electrician? Invite them to register
                                    </Button>
                                </Link>
                            </Card>
                        ) : (
                            electricians.map((electrician) => (
                                <ElectricianCard key={electrician.id} electrician={electrician} />
                            ))
                        )}
                    </div>
                )}

                {/* Map View Placeholder */}
                {!loading && location && viewMode === 'map' && (
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
                )}

                {/* No Location State */}
                {!location && !loading && (
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
                )}
            </div>
        </main>
    );
}

// Electrician Card Component
function ElectricianCard({ electrician }: { electrician: Electrician }) {
    return (
        <Card variant="default" hover padding="md" className="group">
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-white">👷</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{electrician.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{electrician.area}, {electrician.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Verified
                        </span>
                        <span className="text-xs text-gray-400">
                            {electrician.distance} km away
                        </span>
                    </div>
                </div>
            </div>

            {/* Rating placeholder */}
            <div className="flex items-center gap-1 mt-4 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="text-sm text-gray-500 ml-1">5.0 (New)</span>
            </div>

            {/* Book Button - Removed/Changed */}
            <Button fullWidth size="sm" variant="outline" className="text-gray-400 border-gray-200 cursor-not-allowed" disabled>
                Verified Partner
            </Button>
        </Card>
    );
}
