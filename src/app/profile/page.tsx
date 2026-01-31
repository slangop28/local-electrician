'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Card } from '@/components/ui';

interface ServiceRequest {
    requestId: string;
    electricianId: string;
    serviceType: string;
    status: string;
    preferredDate: string;
    preferredSlot: string;
    timestamp: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { userProfile, isAuthenticated, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
    const [serviceHistory, setServiceHistory] = useState<ServiceRequest[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Set active tab from URL params (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'history') {
                setActiveTab('history');
            }
        }
    }, []);

    // Fetch service history
    useEffect(() => {
        if (userProfile?.phone && activeTab === 'history') {
            fetchServiceHistory();
        }
    }, [userProfile, activeTab]);

    const fetchServiceHistory = async () => {
        if (!userProfile?.phone) return;

        setLoadingHistory(true);
        try {
            const response = await fetch(`/api/customer/history?phone=${userProfile.phone}`);
            const data = await response.json();
            if (data.success) {
                setServiceHistory(data.requests || []);
            }
        } catch (error) {
            console.error('Failed to fetch service history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!userProfile) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'bg-green-100 text-green-700';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-700';
            case 'NEW': return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="font-bold text-gray-900">Local Electrician</span>
                    </Link>
                    <span className="text-sm text-gray-500">My Profile</span>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl p-6 mb-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                            👤
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{userProfile.name || 'User'}</h1>
                            <p className="text-cyan-100">@{userProfile.username}</p>
                            <p className="text-sm text-cyan-200 mt-1">
                                {userProfile.userType === 'electrician' ? '👷 Electrician' : '🏠 Customer'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'profile'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Profile Details
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'history'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Service History
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <Card variant="elevated" padding="lg">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Username</span>
                                <span className="font-medium text-gray-900">@{userProfile.username}</span>
                            </div>

                            {userProfile.phone && (
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-500">Phone Number</span>
                                    <span className="font-medium text-gray-900">+91 {userProfile.phone}</span>
                                </div>
                            )}

                            {userProfile.email && (
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-medium text-gray-900">{userProfile.email}</span>
                                </div>
                            )}

                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Account Type</span>
                                <span className="font-medium text-gray-900 capitalize">{userProfile.userType}</span>
                            </div>

                            <div className="flex justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-500">Login Method</span>
                                <span className="font-medium text-gray-900 capitalize">{userProfile.authProvider}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Link href="/">
                                <Button fullWidth>← Back to Home</Button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {loadingHistory ? (
                            <Card variant="elevated" padding="lg">
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                                </div>
                            </Card>
                        ) : serviceHistory.length === 0 ? (
                            <Card variant="elevated" padding="lg">
                                <div className="text-center py-8">
                                    <span className="text-4xl mb-4 block">📋</span>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service History</h3>
                                    <p className="text-gray-500 mb-6">You haven&apos;t booked any services yet.</p>
                                    <Link href="/app">
                                        <Button>Find an Electrician</Button>
                                    </Link>
                                </div>
                            </Card>
                        ) : (
                            serviceHistory.map((request) => (
                                <Card key={request.requestId} variant="elevated" padding="md">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{request.serviceType}</h3>
                                            <p className="text-sm text-gray-500">{request.requestId}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p>📅 {request.preferredDate} • {request.preferredSlot}</p>
                                        <p className="mt-1 text-xs text-gray-400">Booked on {new Date(request.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
