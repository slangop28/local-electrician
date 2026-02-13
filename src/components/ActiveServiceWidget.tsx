import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ActiveServiceWidgetProps {
    activeService: any | null;
}

export function ActiveServiceWidget({ activeService }: ActiveServiceWidgetProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (activeService && activeService.status !== 'CANCELLED' && activeService.status !== 'PAID' && activeService.status !== 'COMPLETED') {
            // Check if user dismissed this specific completed request
            if (activeService.status === 'SUCCESS') {
                const dismissed = localStorage.getItem(`dismissed_${activeService.requestId}`);
                if (dismissed) {
                    setIsVisible(false);
                    return;
                }
            }
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [activeService]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (activeService?.status === 'SUCCESS') {
            localStorage.setItem(`dismissed_${activeService.requestId}`, 'true');
        }
    };

    if (!isVisible || !activeService) return null;

    const isAssigned = ['ACCEPTED', 'SUCCESS', 'IN_PROGRESS'].includes(activeService.status);
    const isSuccess = activeService.status === 'SUCCESS';
    const bgColor = isSuccess ? 'bg-green-600' : isAssigned ? 'bg-blue-600' : 'bg-cyan-600';

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-40 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 transform translate-y-0",
            !isVisible && "translate-y-20 opacity-0"
        )}>
            {/* Header */}
            <div className={cn("p-4 text-white flex justify-between items-center", bgColor)}>
                <div className="flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
                    <h3 className="font-bold text-sm">
                        {isSuccess ? 'Job Completed!' : isAssigned ? 'Electrician Assigned!' : 'Finding Electrician...'}
                    </h3>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white"
                >
                    ✕
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="font-bold text-gray-900">{activeService.serviceType}</p>
                        <p className="text-xs text-gray-500">ID: {activeService.requestId}</p>
                    </div>
                </div>

                {(isAssigned && (activeService.electricianName || activeService.electrician_name)) ? (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-3">
                        <p className="text-xs text-gray-500 mb-1">Your Electrician</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                {(activeService.electricianName || activeService.electrician_name || 'E')[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">
                                    {activeService.electricianName || activeService.electrician_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {activeService.electricianPhone || activeService.electrician_phone}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 animate-pulse mb-3">
                        <p className="text-xs text-blue-800 font-medium text-center">
                            Broadcasting to nearby electricians...
                        </p>
                    </div>
                )}

                <Link href={`/booking-status?requestId=${activeService.requestId}`}>
                    <button className="w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                        View Details & Track
                    </button>
                </Link>
            </div>
        </div>
    );
}
