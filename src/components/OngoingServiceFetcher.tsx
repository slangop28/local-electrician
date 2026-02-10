import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { LiveTrackingMap } from './LiveTrackingMap';

interface ServiceRequest {
    requestId: string;
    serviceType: string;
    status: string;
    preferredDate: string;
    preferredSlot: string;
    timestamp: string;
    electricianName?: string;
    electricianPhone?: string;
    electricianId?: string;
    electricianCity?: string;
    electricianArea?: string;
    electricianLat?: number;
    electricianLng?: number;
}

interface OngoingServiceFetcherProps {
    userPhone: string | null;
    getStatusColor: (status: string) => string;
}

export function OngoingServiceFetcher({ userPhone, getStatusColor }: OngoingServiceFetcherProps) {
    const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActiveRequest = async () => {
        if (!userPhone) {
            setLoading(false);
            setError('No phone number found');
            return;
        }
        try {
            const res = await fetch(`/api/customer/active-request?customerId=${userPhone}`);
            const data = await res.json();

            if (data.success && data.activeRequest) {
                setActiveRequest(data.activeRequest);
                setError(null);
            } else {
                setActiveRequest(null);
            }
        } catch (err) {
            console.error('[OngoingServiceFetcher] Error fetching active request:', err);
            setError('Failed to fetch service data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveRequest();
        // Poll every 3 seconds for real-time updates
        const interval = setInterval(fetchActiveRequest, 3000);
        return () => clearInterval(interval);
    }, [userPhone]);

    if (loading) {
        return (
            <Card variant="elevated" padding="lg" className="text-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Loading active services...</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card variant="elevated" padding="lg" className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    ⚠️
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Services</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={fetchActiveRequest}
                    className="text-cyan-600 hover:text-cyan-800 font-medium"
                >
                    Try Again
                </button>
            </Card>
        );
    }

    if (!activeRequest) {
        return (
            <Card variant="elevated" padding="lg" className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    🛠️
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Ongoing Services</h3>
                <p className="text-gray-500 mb-6">You don't have any active service requests at the moment.</p>
            </Card>
        );
    }

    const showLiveTracking = activeRequest.status === 'ACCEPTED' && activeRequest.electricianId;

    return (
        <Card variant="elevated" padding="lg" className="border-l-4 border-l-cyan-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{activeRequest.serviceType}</h3>
                    <p className="text-sm text-gray-500">Request ID: {activeRequest.requestId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(activeRequest.status)}`}>
                    {activeRequest.status}
                </span>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{activeRequest.preferredDate}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Time Slot</p>
                        <p className="font-medium">{activeRequest.preferredSlot}</p>
                    </div>
                </div>

                {activeRequest.electricianName && (
                    <>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                👨‍🔧 Electrician Assigned
                            </h4>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm">
                                    <span className="text-gray-500">Name:</span> <span className="font-medium">{activeRequest.electricianName}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Phone:</span> <a href={`tel:${activeRequest.electricianPhone}`} className="font-medium text-blue-600 hover:underline">{activeRequest.electricianPhone}</a>
                                </p>
                                {activeRequest.electricianArea && (
                                    <p className="text-sm">
                                        <span className="text-gray-500">Area:</span> <span className="font-medium">{activeRequest.electricianArea}, {activeRequest.electricianCity}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Live Tracking Map */}
                        {showLiveTracking && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <h4 className="font-semibold text-slate-800 text-sm">Live Tracking</h4>
                                </div>
                                <LiveTrackingMap
                                    trackElectricianId={activeRequest.electricianId}
                                    destinationLat={activeRequest.electricianLat}
                                    destinationLng={activeRequest.electricianLng}
                                    destinationLabel="Electrician"
                                    address={activeRequest.electricianArea ? `${activeRequest.electricianArea}, ${activeRequest.electricianCity}` : undefined}
                                    height="250px"
                                    showDirections={false}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
