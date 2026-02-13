'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function ProfileDropdown() {
    const { userProfile, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!userProfile) return null;

    const handleLogout = async () => {
        await logout();
        setIsOpen(false);
        window.location.href = '/';
    };

    const initials = userProfile.name
        ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : userProfile.phone
            ? userProfile.phone.slice(-2)
            : '??';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                </div>
                <span className="text-sm text-gray-700 font-medium hidden sm:block">
                    {userProfile.name?.split(' ')[0] || userProfile.username}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {userProfile.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    @{userProfile.username}
                                </p>
                                <p className="text-xs text-cyan-600 font-medium">
                                    {userProfile.userType === 'electrician' ? '👷 Electrician' : '🏠 Customer'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-lg">👤</span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">My Profile</p>
                                <p className="text-xs text-gray-500">View and edit your details</p>
                            </div>
                        </Link>

                        {userProfile.userType === 'customer' && (
                            <>
                                <Link
                                    href="/booking-status"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-lg">📍</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Booking Status</p>
                                        <p className="text-xs text-gray-500">Track your bookings</p>
                                    </div>
                                </Link>
                            </>
                        )}

                        {userProfile.userType === 'electrician' && userProfile.electricianStatus === 'VERIFIED' && (
                            <Link
                                href="/electrician-dashboard"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-lg">📊</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Dashboard</p>
                                    <p className="text-xs text-gray-500">Manage your services</p>
                                </div>
                            </Link>
                        )}

                        {userProfile.userType === 'electrician' && userProfile.electricianStatus === 'PENDING' && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-50">
                                <span className="text-lg">⏳</span>
                                <div>
                                    <p className="text-sm font-medium text-yellow-700">Verification Pending</p>
                                    <p className="text-xs text-yellow-600">Your KYC is under review</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left"
                        >
                            <span className="text-lg">🚪</span>
                            <p className="text-sm font-medium text-red-600">Logout</p>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
