'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Card, ReviewModal } from '@/components/ui';

interface ServiceRequest {
    requestId: string;
    electricianId: string;
    serviceType: string;
    status: string;
    preferredDate: string;
    preferredSlot: string;
    timestamp: string;
    rating?: number;
    electricianName?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { userProfile, isAuthenticated, isLoading, login, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'address'>('profile');

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };
    const [serviceHistory, setServiceHistory] = useState<ServiceRequest[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Address Editing State
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({
        address: '',
        city: '',
        pincode: ''
    });

    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Review State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRequest, setReviewRequest] = useState<ServiceRequest | null>(null);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

                // Check if there's a recent completed request without a rating
                const unreviewed = (data.requests || []).find(
                    (r: ServiceRequest) => r.status === 'SUCCESS' && !r.rating
                );

                if (unreviewed) {
                    setReviewRequest(unreviewed);
                    setShowReviewModal(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch service history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Submit Review
    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!reviewRequest) return;

        setIsSubmittingReview(true);
        try {
            const response = await fetch('/api/request/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: reviewRequest.requestId,
                    rating,
                    comment
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowReviewModal(false);
                // Refresh history
                fetchServiceHistory();
                alert('Thank you for your review!');
            } else {
                alert(data.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Review submit error:', error);
            alert('Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Broadcast State
    const [activeBroadcast, setActiveBroadcast] = useState<ServiceRequest | null>(null);
    const [isCancellingBroadcast, setIsCancellingBroadcast] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    // Fetch Active Broadcast
    useEffect(() => {
        if (userProfile?.phone) {
            fetchActiveBroadcast();

            // Poll for updates (e.g., if status changes to ACCEPTED or if new request appears)
            const interval = setInterval(fetchActiveBroadcast, 5000);
            return () => clearInterval(interval);
        }
    }, [userProfile]);

    const fetchActiveBroadcast = async () => {
        if (!userProfile?.phone) return;
        try {
            const response = await fetch(`/api/customer/active-request?phone=${userProfile.phone}`);
            const data = await response.json();
            if (data.success && data.request && data.request.status === 'NEW' && data.request.electricianId === 'BROADCAST') {
                setActiveBroadcast(data.request);
            } else {
                setActiveBroadcast(null);
            }
        } catch (error) {
            console.error('Failed to fetch active broadcast:', error);
        }
    };

    const handleStopBroadcast = async () => {
        if (!activeBroadcast) return;

        if (!confirm('Are you sure you want to stop looking for an electrician?')) return;

        setIsCancellingBroadcast(true);
        try {
            const response = await fetch('/api/request/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: activeBroadcast.requestId })
            });
            const data = await response.json();
            if (data.success) {
                alert('Broadcast stopped successfully.');
                setActiveBroadcast(null);
                // Refresh history if open
                if (activeTab === 'history') fetchServiceHistory();
            } else {
                alert(data.error || 'Failed to stop broadcast');
            }
        } catch (error) {
            console.error('Cancel error:', error);
            alert('Failed to stop broadcast');
        } finally {
            setIsCancellingBroadcast(false);
        }
    };

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
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 hidden sm:block">My Profile</span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-500 font-medium hover:text-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
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

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'profile'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Profile Details
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('address');
                            if (userProfile) {
                                setAddressForm({
                                    address: userProfile.address || '',
                                    city: userProfile.city || '',
                                    pincode: userProfile.pincode || ''
                                });
                            }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'address'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        My Address
                    </button>
                    {userProfile.userType === 'customer' && (
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'history'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Service History
                        </button>
                    )}
                    {userProfile.userType === 'customer' && (
                        <Link href="/app">
                            <button
                                className="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg animate-pulse"
                            >
                                Ongoing Service Requests
                            </button>
                        </Link>
                    )}
                </div>

                {/* Active Broadcast Alert */}
                {activeBroadcast && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg shadow-blue-500/10 animate-pulse">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl animate-bounce">
                                    📡
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 text-lg">Finding Electrician...</h3>
                                    <p className="text-blue-700">Detailed Request: {activeBroadcast.serviceType}</p>
                                    <p className="text-sm text-blue-500">We are broadcasting your request to nearby electricians.</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleStopBroadcast}
                                disabled={isCancellingBroadcast}
                                className="bg-red-500 hover:bg-red-600 text-white shadow-md w-full md:w-auto"
                            >
                                {isCancellingBroadcast ? 'Stopping...' : '🛑 Stop Finding Electrician'}
                            </Button>
                        </div>
                    </div>
                )}

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

                        <div className="mt-8 space-y-3">
                            <Link href="/">
                                <Button fullWidth>← Back to Home</Button>
                            </Link>
                            <Button
                                fullWidth
                                variant="outline"
                                onClick={handleLogout}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                                Log Out
                            </Button>
                        </div>
                    </Card>
                )}

                {/* History Tab - Only for Customers */}
                {activeTab === 'history' && userProfile.userType === 'customer' && (
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
                                            <p className="text-sm text-gray-500">Electrician ID: {request.electricianId}</p>
                                            <p className="text-xs text-gray-400">ID: {request.requestId}</p>
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
                {/* Address Tab */}
                {activeTab === 'address' && (
                    <Card variant="elevated" padding="lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Address Details</h2>
                            {!isEditingAddress ? (
                                <Button size="sm" onClick={() => setIsEditingAddress(true)}>
                                    ✎ Edit Address
                                </Button>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setIsEditingAddress(false)}>
                                    Cancel
                                </Button>
                            )}
                        </div>

                        {isEditingAddress ? (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setIsSavingAddress(true);
                                    try {
                                        const response = await fetch('/api/customer/profile', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                phone: userProfile.phone,
                                                name: userProfile.name,
                                                email: userProfile.email,
                                                city: addressForm.city,
                                                pincode: addressForm.pincode,
                                                address: addressForm.address
                                            })
                                        });

                                        const data = await response.json();
                                        if (data.success) {
                                            // Update local profile context
                                            const updatedProfile = {
                                                ...userProfile,
                                                address: addressForm.address,
                                                city: addressForm.city,
                                                pincode: addressForm.pincode
                                            };
                                            login(updatedProfile); // Helper to update context
                                            setIsEditingAddress(false);
                                            alert('Address updated successfully!');
                                        } else {
                                            alert(data.error || 'Failed to update address');
                                        }
                                    } catch (error) {
                                        console.error('Update error:', error);
                                        alert('Failed to update address');
                                    } finally {
                                        setIsSavingAddress(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                    <textarea
                                        value={addressForm.address}
                                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                                        rows={3}
                                        placeholder="Enter your house no, street, area..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={addressForm.city}
                                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                                            placeholder="Enter city"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                        <input
                                            type="text"
                                            value={addressForm.pincode}
                                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                                            placeholder="Enter pincode"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button type="submit" fullWidth disabled={isSavingAddress}>
                                        {isSavingAddress ? 'Saving...' : 'Save Address'}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 text-gray-600">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-500 mb-1">Address</p>
                                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{userProfile.address || 'Not provided'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">City</p>
                                        <p className="text-gray-900 font-medium">{userProfile.city || 'Not provided'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Pincode</p>
                                        <p className="text-gray-900 font-medium">{userProfile.pincode || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Review Modal */}
            {reviewRequest && (
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSubmit={handleReviewSubmit}
                    isSubmitting={isSubmittingReview}
                    serviceType={reviewRequest.serviceType}
                    electricianName={reviewRequest.electricianName || 'the electrician'}
                />
            )}
        </main>
    );
}
