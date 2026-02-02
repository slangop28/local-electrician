'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Card } from '@/components/ui';

export default function ElectricianPendingPage() {
    const router = useRouter();
    const { userProfile, isAuthenticated, isLoading, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    // If electrician is verified, redirect to dashboard
    useEffect(() => {
        if (userProfile?.electricianStatus === 'VERIFIED') {
            router.push('/electrician-dashboard');
        }
    }, [userProfile, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header */}
            <header className="bg-black/50 backdrop-blur-sm border-b border-cyan-500/20 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="font-bold text-white hidden sm:block">Local Electrician</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-cyan-400 hidden md:block">Electrician Profile</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold"
                        >
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Main Card */}
                <Card variant="elevated" className="bg-gray-900/80 border border-cyan-500/30 backdrop-blur-lg">
                    <div className="p-8 text-center">
                        {/* Animated Icon */}
                        <div className="relative inline-block mb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse-glow">
                                <span className="text-5xl">⏳</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-lg">🔍</span>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-glow mb-4">
                            KYC Verification In Progress
                        </h1>

                        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                            Your documents are being reviewed by our team. This usually takes 24-48 hours.
                        </p>

                        {/* Status Steps */}
                        <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-green-400">✓</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-white">Application Submitted</p>
                                        <p className="text-sm text-gray-500">Your details have been received</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
                                        <span className="text-yellow-400">⏳</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-white">Document Verification</p>
                                        <p className="text-sm text-gray-500">Aadhaar & PAN under review</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center">
                                        <span className="text-gray-500">⏸</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-500">Profile Activation</p>
                                        <p className="text-sm text-gray-600">Waiting for verification</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-8">
                            <p className="text-sm text-cyan-300">
                                <span className="font-bold">💡 Tip:</span> Make sure your submitted documents are clear and readable. We'll notify you once verification is complete.
                            </p>
                        </div>

                        {/* Profile Info */}
                        {userProfile && (
                            <div className="bg-gray-800/30 rounded-xl p-4 mb-8">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Your Profile</h3>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">👷</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-white">{userProfile.name || 'Electrician'}</p>
                                        <p className="text-sm text-gray-500">@{userProfile.username}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link href="/">
                            <Button fullWidth className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 mb-3">
                                ← Return to Home
                            </Button>
                        </Link>

                        <Button
                            fullWidth
                            variant="outline"
                            onClick={handleLogout}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                            Log Out
                        </Button>
                    </div>
                </Card>

                {/* Help section */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Need help? Contact us at <a href="mailto:support@localelectrician.in" className="text-cyan-400 hover:underline">support@localelectrician.in</a>
                    </p>
                </div>
            </div>
        </main>
    );
}
