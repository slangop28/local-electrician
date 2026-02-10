'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    read?: boolean;
}

interface NotificationBellProps {
    notifications: Notification[];
    blink?: boolean;
}

export default function NotificationBell({ notifications, blink = false }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.length;
    const shouldAnimate = blink || unreadCount > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-full hover:bg-gray-100 relative transition-colors",
                    blink && "animate-bounce"
                )}
                aria-label="Notifications"
            >
                <span className={cn("text-xl", blink && "animate-pulse")}>🔔</span>
                {shouldAnimate && (
                    <span className={cn(
                        "absolute top-0 right-0 flex items-center justify-center",
                        blink
                            ? "w-5 h-5 -top-0.5 -right-0.5"
                            : "w-3 h-3 top-1 right-1"
                    )}>
                        <span className={cn(
                            "absolute inline-flex rounded-full bg-red-500 opacity-75",
                            blink ? "h-full w-full animate-ping" : "h-3 w-3"
                        )}></span>
                        <span className={cn(
                            "relative inline-flex rounded-full bg-red-500 border-2 border-white",
                            blink ? "h-4 w-4" : "h-3 w-3"
                        )}>
                            {blink && unreadCount > 0 && (
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                                <span className="text-2xl">🔕</span>
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((notif, idx) => (
                                <div key={idx} className={cn(
                                    "p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer transition-colors group",
                                    notif.type === 'success' && "bg-green-50/50"
                                )}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{notif.title}</p>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
