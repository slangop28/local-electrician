'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

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
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState('');
    const [electricians, setElectricians] = useState<Electrician[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [gettingLocation, setGettingLocation] = useState(false);

    // Get user's location
    const handleGetLocation = () => {
        if ('geolocation' in navigator) {
            setGettingLocation(true);
            setError('');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setGettingLocation(false);
                },
                (err) => {
                    console.error('Location error:', err);
                    setError('Could not get your location. Please enter address manually.');
                    setGettingLocation(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setError('Geolocation is not supported by your browser');
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
                    <Link href="/electrician">
                        <Button variant="outline" size="sm">Join as Electrician</Button>
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
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

            {/* Book Button */}
            <Link href={`/request/${electrician.id}`}>
                <Button fullWidth size="sm" className="group-hover:shadow-lg transition-shadow">
                    Book Now
                </Button>
            </Link>
        </Card>
    );
}
