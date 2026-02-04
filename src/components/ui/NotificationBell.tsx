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
}

export default function NotificationBell({ notifications }: NotificationBellProps) {
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
                aria-label="Notifications"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
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
                                <div key={idx} className="p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer transition-colors group">
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
