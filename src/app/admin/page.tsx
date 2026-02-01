'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, useToast } from '@/components/ui';
import { cn, ELECTRICIAN_STATUS, REQUEST_STATUS } from '@/lib/utils';

type Tab = 'kyc' | 'verified' | 'bank' | 'requests' | 'analytics' | 'referrals';

interface Electrician {
    id: string;
    name: string;
    phone: string;
    city: string;
    area: string;
    status: string;
    timestamp: string;
    servicesCompleted?: number;
    aadhaarFrontURL?: string;
    aadhaarBackURL?: string;
    panFrontURL?: string;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        status: string;
    };
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

interface ConfirmModal {
    isOpen: boolean;
    action: 'SUSPEND' | 'REVOKE' | 'DELETE' | null;
    electrician: Electrician | null;
    step: 1 | 2;
}

export default function AdminPanel() {
    const { showToast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('kyc');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [electricians, setElectricians] = useState<Electrician[]>([]);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
        isOpen: false,
        action: null,
        electrician: null,
        step: 1
    });

    // Simple password check (in production, use proper auth)
    const handleLogin = () => {
        if (password === 'admin123') {
            setIsAuthenticated(true);
            showToast('Welcome to Admin Panel', 'success');
        } else {
            showToast('Invalid password', 'error');
        }
    };

    // Fetch data on tab change
    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === 'kyc' || activeTab === 'verified' || activeTab === 'bank') {
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
                closeConfirmModal();
                showToast(`Electrician status updated to ${status}`, 'success');
            } else {
                showToast(data.error || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Update failed', 'error');
        }
    };

    const verifyBankDetails = async (id: string, status: string) => {
        try {
            const response = await fetch('/api/admin/verify-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ electricianId: id, status }),
            });
            const data = await response.json();
            if (data.success) {
                fetchElectricians();
                showToast(`Bank details ${status.toLowerCase()}`, 'success');
            } else {
                showToast(data.error || 'Verification failed', 'error');
            }
        } catch (error) {
            showToast('Verification failed', 'error');
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
                showToast(`Request updated to ${status}`, 'success');
            } else {
                showToast(data.error || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Update failed', 'error');
        }
    };

    // Open confirmation modal
    const openConfirmModal = (action: 'SUSPEND' | 'REVOKE' | 'DELETE', electrician: Electrician) => {
        setConfirmModal({
            isOpen: true,
            action,
            electrician,
            step: 1
        });
    };

    // Close confirmation modal
    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            action: null,
            electrician: null,
            step: 1
        });
    };

    // Handle first confirmation
    const handleFirstConfirm = () => {
        setConfirmModal(prev => ({ ...prev, step: 2 }));
    };

    // Handle final confirmation
    const handleFinalConfirm = async () => {
        if (!confirmModal.electrician || !confirmModal.action) return;

        if (confirmModal.action === 'DELETE') {
            try {
                const response = await fetch('/api/admin/delete-electrician', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ electricianId: confirmModal.electrician.id }),
                });
                const data = await response.json();
                if (data.success) {
                    fetchElectricians();
                    closeConfirmModal();
                    showToast('Electrician permanently deleted', 'success');
                } else {
                    showToast(data.error || 'Delete failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Delete failed', 'error');
            }
        } else {
            const newStatus = confirmModal.action === 'SUSPEND' ? 'SUSPENDED' : 'PENDING';
            updateElectricianStatus(confirmModal.electrician.id, newStatus);
        }
    };

    // Get action details for modal
    const getActionDetails = () => {
        switch (confirmModal.action) {
            case 'SUSPEND':
                return {
                    title: 'Suspend Electrician',
                    description: 'This will temporarily suspend the electrician\'s account. They won\'t be able to receive new service requests.',
                    color: 'orange',
                    icon: '⚠️'
                };
            case 'REVOKE':
                return {
                    title: 'Revoke Verification',
                    description: 'This will revoke the electrician\'s verified status and move them back to pending. They will need to be re-verified.',
                    color: 'yellow',
                    icon: '🔄'
                };
            case 'DELETE':
                return {
                    title: 'Reject & Delete Electrician',
                    description: 'This will permanently delete the electrician\'s profile from dashboard and database. This action cannot be undone.',
                    color: 'red',
                    icon: '🗑️'
                };
            default:
                return { title: '', description: '', color: 'gray', icon: '' };
        }
    };

    // Filter electricians based on tab and search
    const getFilteredElectricians = () => {
        let filtered = electricians;

        if (activeTab === 'kyc') {
            filtered = filtered.filter(e => e.status === ELECTRICIAN_STATUS.PENDING);
        } else if (activeTab === 'verified') {
            filtered = filtered.filter(e => e.status === ELECTRICIAN_STATUS.VERIFIED || e.status === 'SUSPENDED');
        }

        if (searchQuery) {
            filtered = filtered.filter(e =>
                e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.phone.includes(searchQuery) ||
                e.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    // Analytics data
    const pendingCount = electricians.filter(e => e.status === ELECTRICIAN_STATUS.PENDING).length;
    const verifiedCount = electricians.filter(e => e.status === ELECTRICIAN_STATUS.VERIFIED).length;
    const suspendedCount = electricians.filter(e => e.status === 'SUSPENDED').length;
    const totalRequests = requests.length;

    // Login screen
    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
                                <span className="text-4xl">🔐</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
                            <p className="text-blue-200/70">Local Electrician Management</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">Admin Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Enter password..."
                                />
                            </div>
                            <Button fullWidth onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 py-3">
                                🔓 Login to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100">
            {/* Premium Header */}
            <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-500/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-white text-2xl">⚡</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-lg">Admin Dashboard</h1>
                            <p className="text-xs text-blue-200/70">Local Electrician Management</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAuthenticated(false)}
                        className="text-white hover:bg-white/10"
                    >
                        🚪 Logout
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Analytics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Pending KYC</p>
                                <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                            </div>
                            <span className="text-3xl">⏳</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Verified</p>
                                <p className="text-3xl font-bold text-green-600">{verifiedCount}</p>
                            </div>
                            <span className="text-3xl">✅</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Suspended</p>
                                <p className="text-3xl font-bold text-red-600">{suspendedCount}</p>
                            </div>
                            <span className="text-3xl">🚫</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Requests</p>
                                <p className="text-3xl font-bold text-blue-600">{totalRequests}</p>
                            </div>
                            <span className="text-3xl">🔧</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'kyc' as Tab, label: 'Pending KYC', icon: '📋', count: pendingCount },
                        { id: 'bank' as Tab, label: 'Bank Verification', icon: '🏦', count: electricians.filter(e => e.bankDetails?.status === 'PENDING').length },
                        { id: 'verified' as Tab, label: 'Verified Electricians', icon: '✅', count: verifiedCount },
                        { id: 'requests' as Tab, label: 'Service Requests', icon: '🔧', count: totalRequests },
                        { id: 'referrals' as Tab, label: 'Referrals', icon: '🎁' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            )}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-bold',
                                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar (for electricians tabs) */}
                {(activeTab === 'kyc' || activeTab === 'verified') && (
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="🔍 Search by name, phone, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-96 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                )}

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
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading...</p>
                            </div>
                        ) : getFilteredElectricians().length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <span className="text-6xl mb-4 block">✨</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                <p className="text-gray-500">No pending verifications at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {getFilteredElectricians().map((electrician) => (
                                    <div key={electrician.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <span className="text-2xl">👷</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{electrician.name}</h3>
                                                    <p className="text-sm text-gray-500">📱 +91 {electrician.phone} • 📍 {electrician.area}, {electrician.city}</p>
                                                    <p className="text-xs text-gray-400 font-mono mb-2">{electrician.id}</p>

                                                    {/* KYC Document Links */}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {electrician.aadhaarFrontURL && !electrician.aadhaarFrontURL.startsWith('UPLOAD_ERROR') && (
                                                            <a
                                                                href={electrician.aadhaarFrontURL}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                                            >
                                                                📄 Aadhaar Front
                                                            </a>
                                                        )}
                                                        {electrician.aadhaarBackURL && !electrician.aadhaarBackURL.startsWith('UPLOAD_ERROR') && (
                                                            <a
                                                                href={electrician.aadhaarBackURL}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                                            >
                                                                📄 Aadhaar Back
                                                            </a>
                                                        )}
                                                        {electrician.panFrontURL && !electrician.panFrontURL.startsWith('UPLOAD_ERROR') && (
                                                            <a
                                                                href={electrician.panFrontURL}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
                                                            >
                                                                📄 PAN Card
                                                            </a>
                                                        )}
                                                        {(!electrician.aadhaarFrontURL && !electrician.aadhaarBackURL && !electrician.panFrontURL) && (
                                                            <span className="text-xs text-red-500">⚠️ No KYC documents uploaded</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                                    ⏳ Pending
                                                </span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateElectricianStatus(electrician.id, ELECTRICIAN_STATUS.VERIFIED)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    ✓ Verify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openConfirmModal('DELETE', electrician)}
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    ✗ Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Bank Verification Tab */}
                {activeTab === 'bank' && (
                    <div className="space-y-4">
                        {electricians.filter(e => e.bankDetails?.status === 'PENDING').length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                <span className="text-4xl mb-4 block">🏦</span>
                                <h3 className="text-lg font-bold text-gray-900">No Pending Bank Verifications</h3>
                                <p className="text-gray-500">All bank details have been verified.</p>
                            </div>
                        ) : (
                            electricians.filter(e => e.bankDetails?.status === 'PENDING').map((electrician) => (
                                <Card key={electrician.id} className="overflow-hidden hover:shadow-md transition-all">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{electrician.name}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">📱 {electrician.phone}</span>
                                                    <span className="flex items-center gap-1">📍 {electrician.city}</span>
                                                </div>
                                            </div>
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                                                PENDING VERIFICATION
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-6">
                                            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                                <span>🏦</span> Bank Details
                                            </h4>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Account Holder</p>
                                                    <p className="font-medium text-gray-900">{electrician.bankDetails?.accountName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Account Number</p>
                                                    <p className="font-mono font-medium text-gray-900">{electrician.bankDetails?.accountNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">IFSC Code</p>
                                                    <p className="font-mono font-medium text-gray-900">{electrician.bankDetails?.ifscCode}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end">
                                            <Button
                                                size="sm"
                                                onClick={() => verifyBankDetails(electrician.id, 'VERIFIED')}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                ✓ Verify Bank Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => verifyBankDetails(electrician.id, 'REJECTED')}
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                ✗ Reject
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Verified Electricians Tab */}
                {activeTab === 'verified' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Verified Electricians</h2>
                            <Button variant="outline" size="sm" onClick={fetchElectricians}>
                                🔄 Refresh
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading...</p>
                            </div>
                        ) : getFilteredElectricians().length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <span className="text-6xl mb-4 block">👷</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Verified Electricians</h3>
                                <p className="text-gray-500">Verified electricians will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {getFilteredElectricians().map((electrician) => (
                                    <div key={electrician.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-xl flex items-center justify-center",
                                                    electrician.status === 'SUSPENDED'
                                                        ? "bg-gradient-to-br from-red-100 to-red-200"
                                                        : "bg-gradient-to-br from-green-100 to-green-200"
                                                )}>
                                                    <span className="text-2xl">👷</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{electrician.name}</h3>
                                                    <p className="text-sm text-gray-500">📱 +91 {electrician.phone} • 📍 {electrician.area}, {electrician.city}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{electrician.id}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-sm font-medium",
                                                    electrician.status === 'SUSPENDED'
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-green-100 text-green-700"
                                                )}>
                                                    {electrician.status === 'SUSPENDED' ? '🚫 Suspended' : '✓ Verified'}
                                                </span>

                                                {electrician.status === ELECTRICIAN_STATUS.VERIFIED && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openConfirmModal('SUSPEND', electrician)}
                                                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                                        >
                                                            ⏸️ Suspend
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openConfirmModal('REVOKE', electrician)}
                                                            className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                                                        >
                                                            🔄 Revoke
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openConfirmModal('DELETE', electrician)}
                                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                                        >
                                                            🗑️ Delete
                                                        </Button>
                                                    </>
                                                )}

                                                {electrician.status === 'SUSPENDED' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateElectricianStatus(electrician.id, ELECTRICIAN_STATUS.VERIFIED)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            ✓ Reactivate
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openConfirmModal('DELETE', electrician)}
                                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                                        >
                                                            🗑️ Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading...</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <span className="text-6xl mb-4 block">🔧</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Service Requests</h3>
                                <p className="text-gray-500">Service requests will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {requests.map((req) => (
                                    <div key={req.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-900">{req.id}</h3>
                                                    <span className={cn(
                                                        'px-2 py-1 rounded-full text-xs font-medium',
                                                        req.urgency === 'EMERGENCY' && 'bg-red-100 text-red-700',
                                                        req.urgency === 'URGENT' && 'bg-orange-100 text-orange-700',
                                                        req.urgency === 'NORMAL' && 'bg-blue-100 text-blue-700'
                                                    )}>
                                                        {req.urgency}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    🔧 {req.serviceType}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Customer: {req.customerId} → Electrician: {req.electricianId}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={req.status}
                                                    onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                                                    className={cn(
                                                        'px-4 py-2 rounded-xl border-2 font-medium text-sm cursor-pointer',
                                                        req.status === REQUEST_STATUS.NEW && 'border-blue-200 bg-blue-50 text-blue-700',
                                                        req.status === REQUEST_STATUS.ACCEPTED && 'border-yellow-200 bg-yellow-50 text-yellow-700',
                                                        req.status === REQUEST_STATUS.SUCCESS && 'border-green-200 bg-green-50 text-green-700',
                                                        req.status === REQUEST_STATUS.CANCELLED && 'border-red-200 bg-red-50 text-red-700'
                                                    )}
                                                >
                                                    <option value={REQUEST_STATUS.NEW}>NEW</option>
                                                    <option value={REQUEST_STATUS.ACCEPTED}>ACCEPTED</option>
                                                    <option value={REQUEST_STATUS.SUCCESS}>SUCCESS</option>
                                                    <option value={REQUEST_STATUS.CANCELLED}>CANCELLED</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Referrals Tab */}
                {activeTab === 'referrals' && (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                        <span className="text-6xl mb-4 block">🎁</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Referral Tracking</h3>
                        <p className="text-gray-500 mb-4">
                            Referral reward processing coming soon!
                        </p>
                        <p className="text-sm text-gray-400">
                            Electricians earn ₹100 when their referrals complete 2 services.
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && confirmModal.electrician && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={closeConfirmModal} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
                            {confirmModal.step === 1 ? (
                                <>
                                    <div className="text-center mb-6">
                                        <span className="text-5xl mb-4 block">{getActionDetails().icon}</span>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {getActionDetails().title}
                                        </h3>
                                        <p className="text-gray-500">
                                            {getActionDetails().description}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        <p className="text-sm text-gray-500">Electrician:</p>
                                        <p className="font-bold text-gray-900">{confirmModal.electrician.name}</p>
                                        <p className="text-sm text-gray-500">{confirmModal.electrician.id}</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            fullWidth
                                            variant="outline"
                                            onClick={closeConfirmModal}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            fullWidth
                                            onClick={handleFirstConfirm}
                                            className={cn(
                                                confirmModal.action === 'DELETE' && 'bg-red-600 hover:bg-red-700',
                                                confirmModal.action === 'SUSPEND' && 'bg-orange-600 hover:bg-orange-700',
                                                confirmModal.action === 'REVOKE' && 'bg-yellow-600 hover:bg-yellow-700'
                                            )}
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <span className="text-5xl mb-4 block">⚠️</span>
                                        <h3 className="text-xl font-bold text-red-600 mb-2">
                                            Are you absolutely sure?
                                        </h3>
                                        <p className="text-gray-500">
                                            This is your final confirmation. Click &quot;Confirm&quot; to proceed with {confirmModal.action?.toLowerCase()}ing <strong>{confirmModal.electrician.name}</strong>.
                                        </p>
                                    </div>

                                    <div className={cn(
                                        "rounded-xl p-4 mb-6 border-2",
                                        confirmModal.action === 'DELETE' && 'bg-red-50 border-red-200',
                                        confirmModal.action === 'SUSPEND' && 'bg-orange-50 border-orange-200',
                                        confirmModal.action === 'REVOKE' && 'bg-yellow-50 border-yellow-200'
                                    )}>
                                        <p className="text-sm font-medium text-center">
                                            {confirmModal.action === 'DELETE' && '🗑️ This action CANNOT be undone!'}
                                            {confirmModal.action === 'SUSPEND' && '⏸️ The electrician will be temporarily suspended.'}
                                            {confirmModal.action === 'REVOKE' && '🔄 The electrician will need re-verification.'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            fullWidth
                                            variant="outline"
                                            onClick={closeConfirmModal}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            fullWidth
                                            onClick={handleFinalConfirm}
                                            className={cn(
                                                confirmModal.action === 'DELETE' && 'bg-red-600 hover:bg-red-700',
                                                confirmModal.action === 'SUSPEND' && 'bg-orange-600 hover:bg-orange-700',
                                                confirmModal.action === 'REVOKE' && 'bg-yellow-600 hover:bg-yellow-700'
                                            )}
                                        >
                                            ✓ Confirm {confirmModal.action}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
