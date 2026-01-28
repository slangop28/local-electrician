'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { cn, ELECTRICIAN_STATUS, REQUEST_STATUS } from '@/lib/utils';

type Tab = 'kyc' | 'requests' | 'referrals';

interface Electrician {
    id: string;
    name: string;
    phone: string;
    city: string;
    status: string;
    timestamp: string;
}

interface ServiceRequest {
    id: string;
    customerId: string;
    electricianId: string;
    serviceType: string;
    urgency: string;
    status: string;
    timestamp: string;
}

export default function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('kyc');
    const [loading, setLoading] = useState(false);

    const [electricians, setElectricians] = useState<Electrician[]>([]);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);

    // Simple password check (in production, use proper auth)
    const handleLogin = () => {
        // Default admin password (should be in env in production)
        if (password === 'admin123') {
            setIsAuthenticated(true);
        } else {
            alert('Invalid password');
        }
    };

    // Fetch data on tab change
    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === 'kyc') {
                fetchElectricians();
            } else if (activeTab === 'requests') {
                fetchRequests();
            }
        }
    }, [isAuthenticated, activeTab]);

    const fetchElectricians = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/electricians');
            const data = await response.json();
            if (data.success) {
                setElectricians(data.electricians || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/requests');
            const data = await response.json();
            if (data.success) {
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateElectricianStatus = async (id: string, status: string) => {
        try {
            const response = await fetch('/api/admin/verify-kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ electricianId: id, status }),
            });
            const data = await response.json();
            if (data.success) {
                fetchElectricians();
            } else {
                alert(data.error || 'Update failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Update failed');
        }
    };

    const updateRequestStatus = async (id: string, status: string) => {
        try {
            const response = await fetch('/api/admin/update-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: id, status }),
            });
            const data = await response.json();
            if (data.success) {
                fetchRequests();
            } else {
                alert(data.error || 'Update failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Update failed');
        }
    };

    // Login screen
    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <Card variant="elevated" padding="lg" className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500">Local Electrician Management</p>
                    </div>

                    <Input
                        label="Admin Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />

                    <Button fullWidth onClick={handleLogin} className="mt-6">
                        Login
                    </Button>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-lg">⚡</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-xs text-gray-500">Local Electrician</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)}>
                        Logout
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'kyc' as Tab, label: 'KYC Verification', icon: '📋' },
                        { id: 'requests' as Tab, label: 'Service Requests', icon: '🔧' },
                        { id: 'referrals' as Tab, label: 'Referrals', icon: '🎁' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-2 rounded-lg font-medium transition-colors',
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* KYC Tab */}
                {activeTab === 'kyc' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Pending KYC Verifications</h2>
                            <Button variant="outline" size="sm" onClick={fetchElectricians}>
                                🔄 Refresh
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading...</div>
                        ) : electricians.length === 0 ? (
                            <Card variant="bordered" padding="lg" className="text-center">
                                <p className="text-gray-500">No pending verifications</p>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {electricians.map((electrician) => (
                                    <Card key={electrician.id} variant="default" padding="md">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                    <span className="text-xl">👷</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{electrician.name}</h3>
                                                    <p className="text-sm text-gray-500">{electrician.phone} • {electrician.city}</p>
                                                    <p className="text-xs text-gray-400">{electrician.id}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    'px-3 py-1 rounded-full text-sm font-medium',
                                                    electrician.status === ELECTRICIAN_STATUS.VERIFIED && 'bg-green-100 text-green-700',
                                                    electrician.status === ELECTRICIAN_STATUS.PENDING && 'bg-yellow-100 text-yellow-700',
                                                    electrician.status === ELECTRICIAN_STATUS.REJECTED && 'bg-red-100 text-red-700'
                                                )}>
                                                    {electrician.status}
                                                </span>

                                                {electrician.status === ELECTRICIAN_STATUS.PENDING && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateElectricianStatus(electrician.id, ELECTRICIAN_STATUS.VERIFIED)}
                                                        >
                                                            ✓ Verify
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateElectricianStatus(electrician.id, ELECTRICIAN_STATUS.REJECTED)}
                                                        >
                                                            ✗ Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Service Requests</h2>
                            <Button variant="outline" size="sm" onClick={fetchRequests}>
                                🔄 Refresh
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading...</div>
                        ) : requests.length === 0 ? (
                            <Card variant="bordered" padding="lg" className="text-center">
                                <p className="text-gray-500">No service requests yet</p>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {requests.map((req) => (
                                    <Card key={req.id} variant="default" padding="md">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{req.id}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Service: {req.serviceType} • Urgency: {req.urgency}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Customer: {req.customerId} → Electrician: {req.electricianId}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={req.status}
                                                    onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                                                    className={cn(
                                                        'px-3 py-2 rounded-lg border-2 font-medium text-sm',
                                                        req.status === REQUEST_STATUS.NEW && 'border-blue-200 bg-blue-50',
                                                        req.status === REQUEST_STATUS.ACCEPTED && 'border-yellow-200 bg-yellow-50',
                                                        req.status === REQUEST_STATUS.SUCCESS && 'border-green-200 bg-green-50',
                                                        req.status === REQUEST_STATUS.CANCELLED && 'border-red-200 bg-red-50'
                                                    )}
                                                >
                                                    <option value={REQUEST_STATUS.NEW}>NEW</option>
                                                    <option value={REQUEST_STATUS.ACCEPTED}>ACCEPTED</option>
                                                    <option value={REQUEST_STATUS.SUCCESS}>SUCCESS</option>
                                                    <option value={REQUEST_STATUS.CANCELLED}>CANCELLED</option>
                                                </select>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Referrals Tab */}
                {activeTab === 'referrals' && (
                    <Card variant="bordered" padding="lg" className="text-center">
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Referral Tracking</h3>
                        <p className="text-gray-500">
                            Referral reward processing coming soon!
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Electricians earn ₹100 when their referrals complete 2 services.
                        </p>
                    </Card>
                )}
            </div>
        </main>
    );
}
