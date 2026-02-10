'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';

interface ServiceRequestDetails {
    request: {
        requestId: string;
        customerId: string;
        electricianId: string;
        serviceType: string;
        status: string;
        preferredDate: string;
        preferredSlot: string;
        timestamp: string;
        address: string;
        description: string;
    };
    customer: {
        name: string;
        phone: string;
        address: string;
        city: string;
    } | null;
    electrician: {
        id: string;
        name: string;
        phone: string;
    } | null;
    logs: {
        log_id: string;
        status: string;
        description: string;
        created_at: string;
    }[];
}

export default function ServiceRequestPage() {
    const params = useParams();
    const router = useRouter();
    const requestId = params?.requestId as string;

    const [data, setData] = useState<ServiceRequestDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequestDetails = async () => {
        if (!requestId) return;

        try {
            const res = await fetch(`/api/service-request/${requestId}`);
            const json = await res.json();

            if (json.success) {
                setData(json);
                setError(null);
            } else {
                setError(json.error || 'Failed to load request');
            }
        } catch (err) {
            console.error('Error fetching request:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequestDetails();
        // Poll every 3 seconds for real-time updates
        const interval = setInterval(fetchRequestDetails, 3000);
        return () => clearInterval(interval);
    }, [requestId]);

    const getStatusConfig = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'NEW':
                return {
                    color: 'bg-blue-100 text-blue-800 border-blue-300',
                    label: 'Finding Electrician',
                    icon: '🔍',
                    description: 'We are broadcasting your request to nearby electricians...'
                };
            case 'ACCEPTED':
                return {
                    color: 'bg-green-100 text-green-800 border-green-300',
                    label: 'Electrician Assigned',
                    icon: '✅',
                    description: 'An electrician has accepted your request!'
                };
            case 'SUCCESS':
            case 'COMPLETED':
                return {
                    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    label: 'Service Completed',
                    icon: '🎉',
                    description: 'Your service has been completed successfully.'
                };
            case 'CANCELLED':
                return {
                    color: 'bg-red-100 text-red-800 border-red-300',
                    label: 'Cancelled',
                    icon: '❌',
                    description: 'This service request was cancelled.'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800 border-gray-300',
                    label: status || 'Unknown',
                    icon: '❓',
                    description: ''
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading service request details...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 flex items-center justify-center p-4">
                <Card variant="elevated" padding="lg" className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                        ⚠️
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Request Not Found</h2>
                    <p className="text-gray-500 mb-6">{error || 'Unable to load service request details.'}</p>
                    <Link href="/profile">
                        <Button>← Back to Profile</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const statusConfig = getStatusConfig(data.request.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/profile" className="text-cyan-600 hover:text-cyan-800 flex items-center gap-2">
                        ← Back to Profile
                    </Link>
                    <h1 className="font-bold text-gray-900">Service Request</h1>
                    <div className="w-24"></div> {/* Spacer for alignment */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Status Banner */}
                <div className={`rounded-2xl p-6 mb-6 border-2 ${statusConfig.color}`}>
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{statusConfig.icon}</span>
                        <div>
                            <h2 className="text-xl font-bold">{statusConfig.label}</h2>
                            <p className="text-sm opacity-80">{statusConfig.description}</p>
                        </div>
                    </div>
                    {data.request.status === 'NEW' && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className="h-2 flex-1 bg-white/50 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                            <span className="text-sm">Searching...</span>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Service Details Card */}
                    <Card variant="elevated" padding="lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            🔧 Service Details
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">Service Type</span>
                                <span className="font-semibold text-gray-900">{data.request.serviceType}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">Request ID</span>
                                <span className="font-mono text-sm text-gray-600">{data.request.requestId}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">📅 Preferred Date</span>
                                <span className="font-semibold">{data.request.preferredDate || 'Not specified'}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">⏰ Time Slot</span>
                                <span className="font-semibold">{data.request.preferredSlot || 'Flexible'}</span>
                            </div>

                            {(data.request.address || data.customer?.address) && (
                                <div className="flex justify-between items-start py-3 border-b border-gray-100">
                                    <span className="text-gray-500">📍 Address</span>
                                    <span className="font-semibold text-right max-w-[60%]">
                                        {data.request.address || data.customer?.address}
                                        {data.customer?.city && `, ${data.customer.city}`}
                                    </span>
                                </div>
                            )}

                            {data.request.description && (
                                <div className="py-3">
                                    <span className="text-gray-500 block mb-2">📝 Description</span>
                                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{data.request.description}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-500">Booked On</span>
                                <span className="text-sm text-gray-600">
                                    {new Date(data.request.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Electrician Card */}
                    <Card variant="elevated" padding="lg" className={`${data.electrician ? 'border-l-4 border-l-green-500' : ''} h-fit`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            👨‍🔧 Electrician Details
                        </h3>

                        {data.electrician ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                                        ⚡
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-lg">{data.electrician.name}</p>
                                        <p className="text-green-700">Assigned to your request</p>
                                    </div>
                                </div>

                                <a
                                    href={`tel:${data.electrician.phone}`}
                                    className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📞</span>
                                        <div>
                                            <p className="text-sm text-gray-500">Phone Number</p>
                                            <p className="font-bold text-blue-700">{data.electrician.phone}</p>
                                        </div>
                                    </div>
                                    <span className="text-blue-500">Call →</span>
                                </a>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <span className="text-3xl">🔍</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Finding an Electrician</h4>
                                <p className="text-gray-500 text-sm">
                                    We're broadcasting your request to nearby electricians.<br />
                                    You'll be notified once someone accepts.
                                </p>
                                <div className="mt-4 flex justify-center">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Timeline Section (New) */}
                {data.logs && data.logs.length > 0 && (
                    <Card variant="elevated" padding="lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            ⏱️ Request Timeline
                        </h3>
                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                            {data.logs.map((log, index) => (
                                <div key={log.log_id} className="relative">
                                    {/* Dot */}
                                    <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-white ${index === data.logs!.length - 1 ? 'bg-cyan-500 ring-4 ring-cyan-100' : 'bg-gray-300'}`}></div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900">{log.status}</h4>
                                            <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        {log.description && (
                                            <p className="text-sm text-gray-600">{log.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
}
