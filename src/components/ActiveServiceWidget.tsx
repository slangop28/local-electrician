import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ActiveServiceWidgetProps {
    activeService: any | null;
}

export function ActiveServiceWidget({ activeService }: ActiveServiceWidgetProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (activeService) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [activeService]);

    if (!isVisible || !activeService) return null;

    const isAccepted = activeService.status === 'ACCEPTED';
    const bgColor = isAccepted ? 'bg-green-500' : 'bg-blue-600';

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
                        {isAccepted ? 'Electrician Assigned!' : 'Finding Electrician...'}
                    </h3>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
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
                    <Link href="/profile" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                        View Details →
                    </Link>
                </div>

                {isAccepted && activeService.electricianName ? (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Your Electrician</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                {activeService.electricianName[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">{activeService.electricianName}</p>
                                <p className="text-xs text-gray-600">{activeService.electricianPhone}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 animate-pulse">
                        <p className="text-xs text-blue-800 font-medium text-center">
                            Broadcasting to nearby electricians...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
