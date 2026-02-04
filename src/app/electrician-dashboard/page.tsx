'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Card, useToast, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ElectricianData {
    electricianId: string;
    name: string;
    phonePrimary: string;
    phoneSecondary: string;
    city: string;
    area: string;
    state: string;
    pincode: string;
    status: string;
    referralCode: string;
    aadhaarFrontURL?: string;
    aadhaarBackURL?: string;
    panFrontURL?: string;
    totalReferrals: number;
    servicesCompleted: number;
    rating?: number | string;
    totalReviews?: number;
    joinedDate?: string;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        status: string;
    };
}

interface ServiceRequest {
    requestId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerCity?: string;
    serviceType: string;
    status: string;
    preferredDate: string;
    preferredSlot: string;
    timestamp: string;
    description?: string;
}

export default function ElectricianDashboard() {
    const router = useRouter();
    const { userProfile, isAuthenticated, isLoading, logout } = useAuth();
    const { showToast } = useToast();
    const [electricianData, setElectricianData] = useState<ElectricianData | null>(null);
    const [services, setServices] = useState<ServiceRequest[]>([]);
    const [availableRequests, setAvailableRequests] = useState<any[]>([]); // Broadcast requests
    const [loadingData, setLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'bank' | 'profile' | 'documents' | 'service-details'>('overview');
    const [bankForm, setBankForm] = useState({ accountName: '', accountNumber: '', ifscCode: '' });
    const [isBankSubmitting, setIsBankSubmitting] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [isOnline, setIsOnline] = useState(true); // Availability toggle
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    // activeService derived state
    const activeService = services.find(s => s.status === 'ACCEPTED');

    // Fetch electrician data - now supports both phone and electricianId
    useEffect(() => {
        // Try to fetch data if we have either phone OR electricianId
        if (userProfile?.phone || userProfile?.electricianId) {
            fetchElectricianData();
        } else if (userProfile && !userProfile.phone && !userProfile.electricianId) {
            // User is authenticated but has neither phone nor electricianId
            // This means they're not a registered electrician
            setLoadingData(false);
            setFetchError('no_electrician_data');
        }
    }, [userProfile]);

    const fetchElectricianData = async () => {
        // Build query params - prefer phone but fallback to electricianId
        const queryParams = new URLSearchParams();
        if (userProfile?.phone) {
            queryParams.set('phone', userProfile.phone);
        }
        if (userProfile?.electricianId) {
            queryParams.set('electricianId', userProfile.electricianId);
        }

        if (!queryParams.toString()) {
            setFetchError('no_identifier');
            setLoadingData(false);
            return;
        }

        setLoadingData(true);
        setFetchError(null);

        try {
            const response = await fetch(`/api/electrician/profile?${queryParams.toString()}`);
            const data = await response.json();

            if (data.success) {
                setElectricianData(data.electrician);
                setServices(data.services || []);

                // Fetch Available (Broadcast) Requests
                const fetchAvailable = async () => {
                    if (data.electrician.city) {
                        try {
                            const availableRes = await fetch(`/api/electrician/available-requests?city=${encodeURIComponent(data.electrician.city)}`);
                            const availableData = await availableRes.json();
                            if (availableData.success) {
                                setAvailableRequests(availableData.requests || []);
                            }
                        } catch (err) {
                            console.error('Failed to fetch available requests', err);
                        }
                    }
                }

                // Initial fetch
                fetchAvailable();

                // Set up polling (every 10 seconds)
                // We store the interval in a way to clear it? 
                // Since this is inside fetchElectricianData which is called once or on reload...
                // Actually, let's move the polling to a useEffect so we can clear it properly.
                // But for now, let's just use the activeTab dependency in a separate effect.

                // Pre-fill bank form if details exist
                if (data.electrician.bankDetails) {
                    setBankForm({
                        accountName: data.electrician.bankDetails.accountName,
                        accountNumber: data.electrician.bankDetails.accountNumber,
                        ifscCode: data.electrician.bankDetails.ifscCode
                    });
                }
            } else {
                console.error('Failed to fetch electrician profile:', data.error);
                setFetchError('not_found');
            }
        } catch (error) {
            console.error('Failed to fetch electrician data:', error);
            setFetchError('network_error');
        } finally {
            setLoadingData(false);
        }
    };

    // Redirect if not authenticated (but don't redirect for missing phone if they have electricianId)
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/');
            } else if (userProfile && !userProfile.phone && !userProfile.isElectrician && !userProfile.electricianId) {
                // Authenticated but not an electrician at all
                console.log('User authenticated but not an electrician, redirecting to registration');
                showToast('Please complete your electrician registration', 'info');
                router.push('/electrician');
            }
        }
    }, [isLoading, isAuthenticated, userProfile, router, showToast]);

    // Cleanup polling on unmount is handled by the useEffect return
    // Add Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (electricianData?.city && activeTab === 'overview' && isOnline) {
            const pollAvailable = async () => {
                try {
                    const availableRes = await fetch(`/api/electrician/available-requests?city=${encodeURIComponent(electricianData.city)}`);
                    const availableData = await availableRes.json();
                    if (availableData.success) {
                        setAvailableRequests(availableData.requests || []);
                    }
                } catch (err) {
                    console.error('Failed to poll requests', err);
                }
            };

            interval = setInterval(pollAvailable, 10000); // Poll every 10s
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [electricianData?.city, activeTab, isOnline]);

    if (isLoading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-emerald-200 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error state if we couldn't fetch electrician data
    if (fetchError || !electricianData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
                <div className="text-center max-w-md mx-auto px-4">
                    <span className="text-6xl mb-6 block">⚠️</span>
                    <h1 className="text-2xl font-bold text-white mb-4">
                        {fetchError === 'not_found' ? 'Electrician Profile Not Found' :
                            fetchError === 'no_electrician_data' ? 'Registration Required' :
                                fetchError === 'network_error' ? 'Connection Error' :
                                    'Unable to Load Dashboard'}
                    </h1>
                    <p className="text-gray-400 mb-8">
                        {fetchError === 'not_found'
                            ? "We couldn't find your electrician registration. Please complete the registration process."
                            : fetchError === 'no_electrician_data'
                                ? "Please complete your electrician registration to access the dashboard."
                                : fetchError === 'network_error'
                                    ? "There was a problem connecting to our servers. Please try again."
                                    : "There was an issue loading your dashboard. Please try again or contact support."}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push('/electrician')}
                            className="bg-emerald-500 hover:bg-emerald-600"
                        >
                            {fetchError === 'not_found' || fetchError === 'no_electrician_data'
                                ? '📝 Register as Electrician'
                                : '🔄 Try Again'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                            ← Go Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const copyReferralLink = () => {
        const link = `${window.location.origin}/electrician?ref=${electricianData.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-500/30">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Verified Partner
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-sm font-semibold border border-amber-500/30">
                        <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                        Pending Verification
                    </span>
                );
            case 'SUSPENDED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold border border-red-500/30">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Suspended
                    </span>
                );
            default:
                return null;
        }
    };

    const getServiceStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'ACCEPTED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'NEW': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const newRequests = services.filter(s => s.status === 'NEW').length;
    const acceptedRequests = services.filter(s => s.status === 'ACCEPTED').length;
    const completedRequests = services.filter(s => s.status === 'SUCCESS').length;

    // Handle request actions (accept, decline, complete, cancel)

    const handleBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!electricianData) return;

        setIsBankSubmitting(true);
        try {
            const response = await fetch('/api/electrician/update-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    electricianId: electricianData.electricianId,
                    bankAccountName: bankForm.accountName,
                    bankAccountNumber: bankForm.accountNumber,
                    bankIfscCode: bankForm.ifscCode
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast('Bank details updated successfully', 'success');
                // Refresh data to show pending status
                fetchElectricianData();
            } else {
                showToast(data.error || 'Update failed', 'error');
            }
        } catch (error) {
            showToast('Failed to update bank details', 'error');
        } finally {
            setIsBankSubmitting(false);
        }
    };

    const handleRequestAction = async (requestId: string, action: 'accept' | 'decline' | 'complete' | 'cancel') => {
        if (!electricianData) return;

        setActionLoading(requestId);
        try {
            const response = await fetch('/api/electrician/update-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    electricianId: electricianData.electricianId,
                    action
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setServices(prev => prev.map(s =>
                    s.requestId === requestId ? { ...s, status: data.newStatus } : s
                ));

                // Also remove from availableRequests if it was there
                setAvailableRequests(prev => prev.filter(req => req.requestId !== requestId));

                // If accepted, add to services list if returned? 
                // Currently fetchElectricianData refreshes everything but let's be optimistic
                if (action === 'accept' && !services.find(s => s.requestId === requestId)) {
                    // Ideally we should reload to get full details, but let's trigger a reload
                    fetchElectricianData();
                }

                // Show success toast
                const actionMessages: Record<string, string> = {
                    accept: 'Request accepted! Redirecting to job details...',
                    decline: 'Request declined.',
                    complete: 'Great job! Service marked as completed.',
                    cancel: 'Job cancelled.'
                };
                showToast(actionMessages[action], 'success');

                // Auto-switch to Service Details on accept
                if (action === 'accept') {
                    setActiveTab('service-details');
                }
                // Switch back to overview or requests on complete/cancel
                if (action === 'complete' || action === 'cancel') {
                    setActiveTab('requests');
                }
            } else {
                showToast(data.error || 'Action failed', 'error');
            }
        } catch (error) {
            console.error('Request action error:', error);
            showToast('Failed to update request', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Document Upload Logic
    // Document Upload Logic

    const handleDocumentUpload = async (field: 'aadhaarFront' | 'aadhaarBack' | 'panFront', file: File | null) => {
        if (!file || !electricianData) return;

        setUploadingDoc(field);
        try {
            const formData = new FormData();
            formData.append('electricianId', electricianData.electricianId);
            formData.append(field, file);

            const response = await fetch('/api/electrician/update-documents', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                showToast('Document uploaded successfully', 'success');
                fetchElectricianData(); // Refresh data
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload failed', 'error');
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
            {/* Premium Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-emerald-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                <span className="text-white text-xl">⚡</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-lg tracking-tight">Local Electrician</h1>
                                <p className="text-xs text-emerald-300/70">Partner Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Availability Toggle */}
                            <button
                                onClick={() => setIsOnline(!isOnline)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isOnline
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                                    }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                                {isOnline ? 'Online' : 'Offline'}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Offline Warning Banner */}
            {!isOnline && (
                <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-200 text-sm">
                        <span>⚠️</span>
                        <span>You&apos;re currently <strong>offline</strong>. You won&apos;t receive new service requests until you go online.</span>
                        <button
                            onClick={() => setIsOnline(true)}
                            className="ml-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
                        >
                            Go Online
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-8 mb-8 shadow-2xl shadow-emerald-500/20">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl border border-white/20 shadow-lg">
                                👷
                            </div>
                            <div>
                                <p className="text-emerald-100/80 text-sm font-medium mb-1">Welcome back,</p>
                                <h1 className="text-3xl font-bold text-white tracking-tight">{electricianData.name}</h1>
                                <p className="text-emerald-100/70 font-mono text-sm mt-1">{electricianData.electricianId}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start lg:items-end gap-2">
                            {getStatusBadge(electricianData.status)}
                            <p className="text-emerald-100/60 text-sm">
                                📍 {electricianData.area}, {electricianData.city}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'requests', label: 'Service Requests', icon: '🔧' },
                        { id: 'bank', label: 'Bank Details', icon: '🏦' },
                        { id: 'documents', label: 'KYC Documents', icon: '📄' },
                        { id: 'profile', label: 'My Profile', icon: '👤' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                    {activeService && (
                        <button
                            onClick={() => setActiveTab('service-details')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${activeTab === 'service-details'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse'
                                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
                                }`}
                        >
                            <span>🚀</span>
                            Active Job
                        </button>
                    )}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Nearby Opportunities (Broadcast Requests) */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 border border-blue-400/30 shadow-xl shadow-blue-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="text-2xl animate-pulse">📡</span>
                                    Nearby Opportunities
                                </h3>
                                <p className="text-blue-100 mb-6">There are customers nearby looking for electricians right now.</p>

                                {availableRequests.length === 0 ? (
                                    <div className="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm border border-white/10">
                                        <p className="text-white font-medium">No active requests nearby</p>
                                        <p className="text-blue-200 text-sm mt-1">We'll notify you when someone needs help in {electricianData.city}.</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {availableRequests.map((req) => (
                                            <div key={req.requestId} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block">
                                                            NEW REQUEST
                                                        </span>
                                                        <h4 className="font-bold text-white text-lg">{req.serviceType}</h4>
                                                    </div>
                                                    <span className="text-xs text-blue-200 font-mono">
                                                        {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-blue-100 text-sm mb-4">
                                                    <span>📍</span>
                                                    <span>{req.customerCity}</span>
                                                    {req.urgency === 'IMMEDIATE' && (
                                                        <span className="bg-red-500/80 text-white text-xs px-2 py-0.5 rounded ml-2">URGENT</span>
                                                    )}
                                                </div>

                                                <Button
                                                    fullWidth
                                                    className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse border border-emerald-400"
                                                    onClick={() => handleRequestAction(req.requestId, 'accept')}
                                                    disabled={actionLoading === req.requestId}
                                                >
                                                    {actionLoading === req.requestId ? 'Accepting...' : '⚡ Accept Job'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-3xl">🔧</span>
                                    <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">All Time</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{electricianData.servicesCompleted}</p>
                                <p className="text-sm text-blue-200/70">Services Completed</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-2xl p-6 border border-yellow-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-3xl">⭐</span>
                                    <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full">Rating</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{electricianData.rating || 'New'}</p>
                                <p className="text-sm text-yellow-200/70">{electricianData.totalReviews || 0} Reviews</p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl p-6 border border-emerald-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-3xl">🏦</span>
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full",
                                        electricianData.bankDetails?.status === 'VERIFIED' ? "text-emerald-300 bg-emerald-500/20" :
                                            electricianData.bankDetails?.status === 'REJECTED' ? "text-red-300 bg-red-500/20" :
                                                "text-amber-300 bg-amber-500/20"
                                    )}>
                                        {electricianData.bankDetails?.status || 'MISSING'}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1 truncate">
                                    {electricianData.bankDetails?.accountNumber
                                        ? `•••• ${electricianData.bankDetails.accountNumber.slice(-4)}`
                                        : 'No Account'}
                                </p>
                                <p className="text-sm text-emerald-200/70">Bank Account</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-6 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-3xl">🎁</span>
                                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">Referrals</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{electricianData.totalReferrals}</p>
                                <p className="text-sm text-purple-200/70">People Referred</p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl p-6 border border-amber-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-3xl">🔔</span>
                                    <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-1 rounded-full">Pending</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{newRequests}</p>
                                <p className="text-sm text-amber-200/70">New Requests</p>
                            </div>
                        </div>

                        {/* Quick Actions & Referral */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Quick Actions */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setActiveTab('requests')}
                                        className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-500/20"
                                    >
                                        <span className="text-2xl">📋</span>
                                        <span className="text-sm text-emerald-200 font-medium">View Requests</span>
                                        {newRequests > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newRequests} new</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('bank')}
                                        className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-500/20"
                                    >
                                        <span className="text-2xl">🏦</span>
                                        <span className="text-sm font-medium text-emerald-100">Bank Details</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className="flex flex-col items-center gap-2 p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-all border border-purple-500/20"
                                    >
                                        <span className="text-2xl">⚙️</span>
                                        <span className="text-sm text-purple-200 font-medium">Edit Profile</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all border border-blue-500/20"
                                    >
                                        <span className="text-2xl">📄</span>
                                        <span className="text-sm text-blue-200 font-medium">KYC Docs</span>
                                    </button>
                                </div>
                            </div>

                            {/* Referral Card */}
                            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl">🎁</span>
                                    <h3 className="text-lg font-bold text-white">Earn ₹100 Per Referral</h3>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">
                                    Refer other electricians and earn ₹100 when they complete 2 services!
                                </p>
                                <div className="bg-black/20 rounded-xl p-4 mb-4">
                                    <p className="text-xs text-gray-400 mb-1">Your Referral Code</p>
                                    <p className="text-2xl font-mono font-bold text-white tracking-wider">{electricianData.referralCode}</p>
                                </div>
                                <Button
                                    fullWidth
                                    onClick={copyReferralLink}
                                    className={copiedReferral ? 'bg-green-500' : 'bg-purple-500 hover:bg-purple-600'}
                                >
                                    {copiedReferral ? '✓ Link Copied!' : '📋 Copy Referral Link'}
                                </Button>
                            </div>
                        </div>

                        {/* Recent Requests */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Recent Requests</h3>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className="text-sm text-emerald-400 hover:text-emerald-300"
                                >
                                    View All →
                                </button>
                            </div>
                            {services.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-4xl mb-4 block">📋</span>
                                    <p className="text-gray-400">No service requests yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {services.filter(s => s.status !== 'CANCELLED' && s.status !== 'DECLINED').slice(0, 3).map((service) => (
                                        <div key={service.requestId} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-white">{service.serviceType}</h4>
                                                    <p className="text-sm text-gray-400">📅 {service.preferredDate} • {service.preferredSlot}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getServiceStatusColor(service.status)}`}>
                                                    {service.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        {/* Request Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-center">
                                <p className="text-2xl font-bold text-amber-300">{newRequests}</p>
                                <p className="text-xs text-amber-200/70">New</p>
                            </div>
                            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
                                <p className="text-2xl font-bold text-blue-300">{acceptedRequests}</p>
                                <p className="text-xs text-blue-200/70">In Progress</p>
                            </div>
                            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
                                <p className="text-2xl font-bold text-emerald-300">{completedRequests}</p>
                                <p className="text-xs text-emerald-200/70">Completed</p>
                            </div>
                        </div>

                        {/* Request List */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">All Service Requests</h3>
                            {services.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-6xl mb-4 block">📋</span>
                                    <h4 className="text-xl font-semibold text-white mb-2">No Service Requests Yet</h4>
                                    <p className="text-gray-400">When customers request your services, they&apos;ll appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {services.filter(s => s.status !== 'CANCELLED' && s.status !== 'DECLINED').map((service) => (
                                        <div key={service.requestId} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-white text-lg">{service.serviceType}</h4>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getServiceStatusColor(service.status)}`}>
                                                            {service.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-2">
                                                        📅 {service.preferredDate} • 🕐 {service.preferredSlot}
                                                    </p>
                                                    {service.description && (
                                                        <p className="text-gray-300 text-sm mb-2 bg-white/5 p-2 rounded-lg">
                                                            💬 {service.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        Request ID: {service.requestId} • {new Date(service.timestamp).toLocaleString()}
                                                    </p>

                                                    {/* Customer Contact - Moved to Service Details Tab */}
                                                    {(service.status === 'ACCEPTED' || service.status === 'SUCCESS') && activeTab !== 'requests' && (
                                                        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                            {/* This block is intentionally kept empty or minimal in Requests tab if we want to hide it, 
                                                                but for now we are removing it from 'Requests' tab view as per plan. 
                                                                However, keeping it for 'SUCCESS' (History) might be useful? 
                                                                The plan says "Remove inline customer details from the 'Requests' tab".
                                                                Let's only show it if status is SUCCESS (History) in the requests tab.
                                                            */}
                                                        </div>
                                                    )}
                                                    {service.status === 'SUCCESS' && (
                                                        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                            <p className="text-xs text-emerald-300/70 mb-1">Customer</p>
                                                            <p className="text-white font-medium">👤 {service.customerName}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {service.status === 'NEW' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-500 hover:bg-emerald-600"
                                                            onClick={() => handleRequestAction(service.requestId, 'accept')}
                                                            disabled={actionLoading === service.requestId}
                                                        >
                                                            {actionLoading === service.requestId ? '...' : '✓ Accept'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                            onClick={() => handleRequestAction(service.requestId, 'decline')}
                                                            disabled={actionLoading === service.requestId}
                                                        >
                                                            ✗ Decline
                                                        </Button>
                                                    </div>
                                                )}
                                                {service.status === 'ACCEPTED' && (
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-500 hover:bg-blue-600"
                                                            onClick={() => setActiveTab('service-details')}
                                                        >
                                                            🚀 View Job Details
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Service Details Tab (Active Job) */}
                {activeTab === 'service-details' && activeService ? (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-blue-600/10 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/30 shadow-2xl shadow-blue-500/10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Active Job</h2>
                                    <p className="text-blue-200/70">Request ID: {activeService.requestId}</p>
                                </div>
                                <span className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold animate-pulse shadow-lg shadow-blue-500/50">
                                    IN PROGRESS
                                </span>
                            </div>

                            {/* Customer Card */}
                            <div className="bg-black/20 rounded-2xl p-6 mb-6 border border-white/5">
                                <h3 className="text-emerald-400 font-bold text-sm tracking-widest uppercase mb-4">Customer Details</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl">
                                            👤
                                        </div>
                                        <div>
                                            <p className="text-white text-lg font-bold">{activeService.customerName}</p>
                                            <p className="text-gray-400 text-sm">Customer Name</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl">
                                            📞
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-lg font-mono font-bold">{activeService.customerPhone}</p>
                                            <p className="text-gray-400 text-sm">Phone Number</p>
                                        </div>
                                        <a
                                            href={`tel:${activeService.customerPhone}`}
                                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                                        >
                                            <span>📞</span> Call Now
                                        </a>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl mt-1">
                                            📍
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-lg leading-relaxed">
                                                {activeService.customerAddress}
                                                {activeService.customerCity && `, ${activeService.customerCity}`}
                                            </p>
                                            <p className="text-gray-400 text-sm mt-1">Service Location</p>
                                        </div>
                                        {activeService.customerAddress && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeService.customerAddress + ' ' + (activeService.customerCity || ''))}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                                            >
                                                <span>🗺️</span> Map
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Service Info */}
                            <div className="grid md:grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                    <p className="text-gray-400 text-sm mb-1">Service Type</p>
                                    <p className="text-white text-xl font-bold">{activeService.serviceType}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                    <p className="text-gray-400 text-sm mb-1">Scheduled For</p>
                                    <p className="text-white text-xl font-bold">{activeService.preferredDate}</p>
                                    <p className="text-emerald-300 text-sm">{activeService.preferredSlot}</p>
                                </div>
                                {activeService.description && (
                                    <div className="md:col-span-2 bg-white/5 rounded-2xl p-5 border border-white/10">
                                        <p className="text-gray-400 text-sm mb-1">Issue Description</p>
                                        <p className="text-gray-200 italic">"{activeService.description}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    size="lg"
                                    className="bg-emerald-500 hover:bg-emerald-600 h-16 text-lg shadow-xl shadow-emerald-500/20"
                                    onClick={() => handleRequestAction(activeService.requestId, 'complete')}
                                    disabled={actionLoading === activeService.requestId}
                                >
                                    {actionLoading === activeService.requestId ? 'Updating...' : '✓ Mark Job as Completed'}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-14"
                                    onClick={() => handleRequestAction(activeService.requestId, 'cancel')}
                                    disabled={actionLoading === activeService.requestId}
                                >
                                    ✗ Cancel Job
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'service-details' && !activeService ? (
                    <div className="text-center py-20">
                        <span className="text-6xl mb-6 block">🤷‍♂️</span>
                        <h2 className="text-2xl font-bold text-white mb-2">No Active Jobs</h2>
                        <p className="text-gray-400 mb-8">You don't have any ongoing service requests right now.</p>
                        <Button
                            onClick={() => setActiveTab('requests')}
                            className="bg-emerald-500 hover:bg-emerald-600"
                        >
                            View Available Requests
                        </Button>
                    </div>
                ) : null}

                {/* Bank Details Tab */}
                {activeTab === 'bank' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Bank Details</h2>
                                    <p className="text-emerald-100/60">Manage your payout account</p>
                                </div>
                                {electricianData.bankDetails?.status && (
                                    <span className={cn(
                                        "px-4 py-2 rounded-full text-sm font-bold border",
                                        electricianData.bankDetails.status === 'VERIFIED' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                            electricianData.bankDetails.status === 'REJECTED' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                                                "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    )}>
                                        {electricianData.bankDetails.status === 'VERIFIED' ? '✓ VERIFIED' :
                                            electricianData.bankDetails.status === 'REJECTED' ? '✗ REJECTED' :
                                                '⏳ PENDING VERIFICATION'}
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleBankSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-emerald-100/80 mb-2">Account Holder Name</label>
                                    <Input
                                        label=""
                                        value={bankForm.accountName}
                                        onChange={(e) => setBankForm(prev => ({ ...prev, accountName: e.target.value }))}
                                        placeholder="Enter name as per bank records"
                                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-emerald-100/80 mb-2">Account Number</label>
                                    <Input
                                        label=""
                                        value={bankForm.accountNumber}
                                        onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                        placeholder="Enter account number"
                                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-emerald-100/80 mb-2">IFSC Code</label>
                                    <Input
                                        label=""
                                        value={bankForm.ifscCode}
                                        onChange={(e) => setBankForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                                        placeholder="Enter IFSC code"
                                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        fullWidth
                                        className="bg-emerald-500 hover:bg-emerald-600 font-bold py-6 text-lg"
                                        disabled={isBankSubmitting}
                                    >
                                        {isBankSubmitting ? 'Saving...' : 'Save Bank Details'}
                                    </Button>
                                    <p className="text-xs text-center text-emerald-100/40 mt-4">
                                        Note: Updating bank details will require re-verification by admin.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-2">KYC Documents</h2>
                            <p className="text-emerald-100/60 mb-8">Upload documents to complete your verification.</p>

                            <div className="space-y-8">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <h3 className="text-emerald-300 font-semibold mb-2">Instructions</h3>
                                    <ul className="list-disc list-inside text-sm text-emerald-100/70 space-y-1">
                                        <li>Photos must be clear and readable</li>
                                        <li>Files must be JPG or PNG format</li>
                                        <li>Maximum file size is 5MB</li>
                                    </ul>
                                </div>

                                <div className="space-y-6">
                                    {/* Aadhaar Front */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-emerald-100/80">Aadhaar Card (Front)</label>
                                            {electricianData.aadhaarFrontURL && !electricianData.aadhaarFrontURL.startsWith('UPLOAD_ERROR') && (
                                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20">✓ Uploaded</span>
                                            )}
                                        </div>
                                        {electricianData.aadhaarFrontURL && !electricianData.aadhaarFrontURL.startsWith('UPLOAD_ERROR') ? (
                                            <div className="relative group rounded-xl overflow-hidden border border-white/10">
                                                <img src={electricianData.aadhaarFrontURL} alt="Aadhaar Front" className="w-full h-48 object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={electricianData.aadhaarFrontURL} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">View Full Image</a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleDocumentUpload('aadhaarFront', e.target.files?.[0] || null)}
                                                    disabled={uploadingDoc === 'aadhaarFront'}
                                                    className="block w-full text-sm text-gray-400
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-emerald-500 file:text-white
                                                        hover:file:bg-emerald-600
                                                        cursor-pointer bg-white/5 border border-white/10 rounded-xl p-2
                                                    "
                                                />
                                                {uploadingDoc === 'aadhaarFront' && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Aadhaar Back */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-emerald-100/80">Aadhaar Card (Back)</label>
                                            {electricianData.aadhaarBackURL && !electricianData.aadhaarBackURL.startsWith('UPLOAD_ERROR') && (
                                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20">✓ Uploaded</span>
                                            )}
                                        </div>
                                        {electricianData.aadhaarBackURL && !electricianData.aadhaarBackURL.startsWith('UPLOAD_ERROR') ? (
                                            <div className="relative group rounded-xl overflow-hidden border border-white/10">
                                                <img src={electricianData.aadhaarBackURL} alt="Aadhaar Back" className="w-full h-48 object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={electricianData.aadhaarBackURL} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">View Full Image</a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleDocumentUpload('aadhaarBack', e.target.files?.[0] || null)}
                                                    disabled={uploadingDoc === 'aadhaarBack'}
                                                    className="block w-full text-sm text-gray-400
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-emerald-500 file:text-white
                                                        hover:file:bg-emerald-600
                                                        cursor-pointer bg-white/5 border border-white/10 rounded-xl p-2
                                                    "
                                                />
                                                {uploadingDoc === 'aadhaarBack' && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* PAN Card */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-emerald-100/80">PAN Card</label>
                                            {electricianData.panFrontURL && !electricianData.panFrontURL.startsWith('UPLOAD_ERROR') && (
                                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20">✓ Uploaded</span>
                                            )}
                                        </div>
                                        {electricianData.panFrontURL && !electricianData.panFrontURL.startsWith('UPLOAD_ERROR') ? (
                                            <div className="relative group rounded-xl overflow-hidden border border-white/10">
                                                <img src={electricianData.panFrontURL} alt="PAN Card" className="w-full h-48 object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={electricianData.panFrontURL} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">View Full Image</a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleDocumentUpload('panFront', e.target.files?.[0] || null)}
                                                    disabled={uploadingDoc === 'panFront'}
                                                    className="block w-full text-sm text-gray-400
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-emerald-500 file:text-white
                                                        hover:file:bg-emerald-600
                                                        cursor-pointer bg-white/5 border border-white/10 rounded-xl p-2
                                                    "
                                                />
                                                {uploadingDoc === 'panFront' && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Personal Details */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-6">Personal Information</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Full Name', value: electricianData.name, icon: '👤' },
                                    { label: 'Primary Phone', value: `+91 ${electricianData.phonePrimary}`, icon: '📱' },
                                    { label: 'Secondary Phone', value: electricianData.phoneSecondary ? `+91 ${electricianData.phoneSecondary}` : 'Not provided', icon: '📞' },
                                    { label: 'Electrician ID', value: electricianData.electricianId, icon: '🆔' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="text-gray-400">{item.label}</span>
                                        </div>
                                        <span className="font-medium text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Service Area */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-6">Service Area</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Area/Locality', value: electricianData.area, icon: '📍' },
                                    { label: 'City', value: electricianData.city, icon: '🏙️' },
                                    { label: 'State', value: electricianData.state, icon: '🗺️' },
                                    { label: 'Pincode', value: electricianData.pincode, icon: '📮' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="text-gray-400">{item.label}</span>
                                        </div>
                                        <span className="font-medium text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Account Status */}
                        <div className="md:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
                            <div className="flex flex-wrap gap-4">
                                {getStatusBadge(electricianData.status)}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/30">
                                    🔧 {electricianData.servicesCompleted} Services
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold border border-purple-500/30">
                                    🎁 {electricianData.totalReferrals} Referrals
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <div className="md:col-span-2">
                            <Button
                                fullWidth
                                variant="outline"
                                onClick={handleLogout}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 py-4 flex items-center justify-center gap-2"
                            >
                                <span>🚪</span>
                                Log Out
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
