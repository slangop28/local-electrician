'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Card } from '@/components/ui';

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
    totalReferrals: number;
    walletBalance: number;
    servicesCompleted: number;
}

interface ServiceRequest {
    requestId: string;
    customerName: string;
    serviceType: string;
    status: string;
    preferredDate: string;
    preferredSlot: string;
    timestamp: string;
}

export default function ElectricianDashboard() {
    const router = useRouter();
    const { userProfile, isAuthenticated, isLoading } = useAuth();
    const [electricianData, setElectricianData] = useState<ElectricianData | null>(null);
    const [services, setServices] = useState<ServiceRequest[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Fetch electrician data
    useEffect(() => {
        if (userProfile?.phone) {
            fetchElectricianData();
        }
    }, [userProfile]);

    const fetchElectricianData = async () => {
        if (!userProfile?.phone) return;

        setLoadingData(true);
        try {
            const response = await fetch(`/api/electrician/profile?phone=${userProfile.phone}`);
            const data = await response.json();

            if (data.success) {
                setElectricianData(data.electrician);
                setServices(data.services || []);
            } else {
                // Not a registered electrician
                router.push('/electrician');
            }
        } catch (error) {
            console.error('Failed to fetch electrician data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!electricianData) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ Verified</span>;
            case 'PENDING':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">⏳ Pending Verification</span>;
            case 'REJECTED':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">✗ Rejected</span>;
            default:
                return null;
        }
    };

    const getServiceStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'bg-green-100 text-green-700';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-700';
            case 'NEW': return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const copyReferralLink = () => {
        const link = `${window.location.origin}/electrician?ref=${electricianData.referralCode}`;
        navigator.clipboard.writeText(link);
        alert('Referral link copied!');
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="font-bold text-gray-900">Local Electrician</span>
                    </Link>
                    <span className="text-sm text-gray-500">Electrician Dashboard</span>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                                👷
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{electricianData.name}</h1>
                                <p className="text-green-100">{electricianData.electricianId}</p>
                            </div>
                        </div>
                        <div>
                            {getStatusBadge(electricianData.status)}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card variant="elevated" padding="md">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{electricianData.servicesCompleted}</p>
                            <p className="text-sm text-gray-500">Services Completed</p>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">₹{electricianData.walletBalance}</p>
                            <p className="text-sm text-gray-500">Wallet Balance</p>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{electricianData.totalReferrals}</p>
                            <p className="text-sm text-gray-500">Referrals</p>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600">{services.filter(s => s.status === 'NEW').length}</p>
                            <p className="text-sm text-gray-500">New Requests</p>
                        </div>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="md:col-span-1 space-y-4">
                        <Card variant="elevated" padding="lg">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Details</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="font-medium">+91 {electricianData.phonePrimary}</span>
                                </div>
                                {electricianData.phoneSecondary && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Secondary</span>
                                        <span className="font-medium">+91 {electricianData.phoneSecondary}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Area</span>
                                    <span className="font-medium">{electricianData.area}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">City</span>
                                    <span className="font-medium">{electricianData.city}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">State</span>
                                    <span className="font-medium">{electricianData.state}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pincode</span>
                                    <span className="font-medium">{electricianData.pincode}</span>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" padding="lg">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Referral Code</h2>
                            <div className="bg-blue-50 rounded-xl p-4 text-center mb-4">
                                <p className="text-2xl font-mono font-bold text-blue-700">{electricianData.referralCode}</p>
                                <p className="text-xs text-blue-500 mt-1">Earn ₹100 per referral</p>
                            </div>
                            <Button fullWidth variant="outline" onClick={copyReferralLink}>
                                📋 Copy Referral Link
                            </Button>
                        </Card>
                    </div>

                    {/* Right Column - Service Requests */}
                    <div className="md:col-span-2">
                        <Card variant="elevated" padding="lg">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Service Requests</h2>

                            {services.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-4xl mb-4 block">📋</span>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service Requests</h3>
                                    <p className="text-gray-500">You haven&apos;t received any service requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {services.map((service) => (
                                        <div
                                            key={service.requestId}
                                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{service.serviceType}</h3>
                                                    <p className="text-sm text-gray-500">{service.requestId}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(service.status)}`}>
                                                    {service.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <p>📅 {service.preferredDate} • {service.preferredSlot}</p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Requested on {new Date(service.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <Link href="/">
                        <Button variant="outline" fullWidth>← Back to Home</Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
