'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/lib/AuthContext';
import { Button, Card } from '@/components/ui';
import UpdatePhoneForm from '@/components/UpdatePhoneForm';

export default function ProfilePage() {
    const router = useRouter();
    const { userProfile, isAuthenticated, isLoading, logout, login } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'phone' | 'history'>('profile');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Address Editing State
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({
        address: '',
        city: '',
        pincode: ''
    });

    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (activeTab === 'history' && userProfile?.phone) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const res = await fetch(`/api/customer/history?phone=${userProfile.phone}`);
                    const data = await res.json();
                    if (data.success) {
                        setHistory(data.serviceRequests || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch history:', error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [activeTab, userProfile]);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const response = await fetch('/api/auth/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userProfile?.phone,
                    userType: 'customer'
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Account deleted successfully.');
                await logout();
                router.push('/');
            } else {
                alert(data.error || 'Failed to delete account');
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Delete account error:', error);
            alert('Failed to delete account');
            setIsDeleting(false);
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
                    <button
                        onClick={() => {
                            setActiveTab('history');
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Services
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
                                <div className="flex justify-between py-3 border-b border-gray-100 items-center">
                                    <span className="text-gray-500">Phone Number</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">+91 {userProfile.phone}</span>
                                        <button
                                            onClick={() => setActiveTab('phone')}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                                        >
                                            Update
                                        </button>
                                    </div>
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

                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <h3 className="text-sm font-bold text-red-800 mb-2">Danger Zone</h3>
                                <Button
                                    fullWidth
                                    variant="outline"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="border-red-500 text-red-600 hover:bg-red-600 hover:text-white"
                                >
                                    {isDeleting ? 'Deleting...' : '🗑️ Delete Account'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Update Phone Tab */}
                {activeTab === 'phone' && (
                    <Card variant="elevated" padding="lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Update Phone Number</h2>
                            <Button size="sm" variant="outline" onClick={() => setActiveTab('profile')}>
                                Cancel
                            </Button>
                        </div>

                        <UpdatePhoneForm
                            userProfile={userProfile}
                            onSuccess={(newPhone) => {
                                login({ ...userProfile, phone: newPhone });
                                setActiveTab('profile');
                                alert('Phone number updated successfully!');
                            }}
                        />
                    </Card>
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

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Service History</h2>

                        {isLoadingHistory ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading your history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <Card variant="elevated" padding="lg" className="text-center py-12">
                                <span className="text-5xl mb-4 block">🔌</span>
                                <h3 className="text-lg font-bold text-gray-900">No Service Requests Yet</h3>
                                <p className="text-gray-500 mb-6">You haven't booked any electrical services yet.</p>
                                <Link href="/app">
                                    <Button>Book an Electrician Now</Button>
                                </Link>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {history.map((req) => (
                                    <Link key={req.requestId} href={`/service-request/${req.requestId}`}>
                                        <Card variant="elevated" className="hover:border-cyan-300 transition-all cursor-pointer overflow-hidden">
                                            <div className="flex flex-col sm:flex-row justify-between p-5 gap-4">
                                                <div className="flex gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${req.status === 'SUCCESS' ? 'bg-emerald-100' :
                                                        req.status === 'CANCELLED' ? 'bg-red-100' : 'bg-blue-100'
                                                        }`}>
                                                        {req.status === 'SUCCESS' ? '✅' : req.status === 'CANCELLED' ? '❌' : '⏳'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{req.serviceType}</h3>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{req.description || 'No description provided'}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-xs font-medium text-gray-400">#{req.requestId}</span>
                                                            <span className="text-xs text-gray-400">•</span>
                                                            <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row sm:flex-col justify-between items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                                        req.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {req.status === 'SUCCESS' ? 'COMPLETED' : req.status}
                                                    </span>
                                                    {req.electricianName && (
                                                        <p className="text-xs text-gray-500">
                                                            👷 <span className="font-medium text-gray-700">{req.electricianName}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
