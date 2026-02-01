'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amount: number;
    serviceType: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, amount, serviceType }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');

    useEffect(() => {
        if (isOpen) {
            setStep('details');
        }
    }, [isOpen]);

    const handlePayment = async () => {
        setLoading(true);
        setStep('processing');

        // Simulate Razorpay processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setLoading(false);
        setStep('success');

        // Wait a bit properly closing
        setTimeout(() => {
            onSuccess();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#2b2f3e] p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 rounded-lg p-2">
                            <span className="text-xl">💳</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Razorpay Trusted</h3>
                            <p className="text-xs text-gray-400">Secure Payment Gateway</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'details' && (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <p className="text-gray-500 text-sm mb-1">Total Amount to Pay</p>
                                <p className="text-4xl font-bold text-gray-900">₹{amount}</p>
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                    <span>⚡ {serviceType}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-700">Payment Method</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button className="p-3 border-2 border-blue-500 bg-blue-50 rounded-xl flex flex-col items-center gap-1 transition-all">
                                        <span className="text-xl">UPI</span>
                                        <span className="text-xs font-bold text-blue-700">UPI / QR</span>
                                    </button>
                                    <button className="p-3 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl flex flex-col items-center gap-1 transition-all">
                                        <span className="text-xl">💳</span>
                                        <span className="text-xs text-gray-600">Card</span>
                                    </button>
                                    <button className="p-3 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl flex flex-col items-center gap-1 transition-all">
                                        <span className="text-xl">🏦</span>
                                        <span className="text-xs text-gray-600">NetBanking</span>
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handlePayment}
                                fullWidth
                                className="bg-[#2b2f3e] hover:bg-[#1a1d26] py-6 text-lg font-bold shadow-lg shadow-blue-900/10"
                            >
                                Pay ₹{amount}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <span>🔒 100% Secure Payments by Razorpay</span>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Payment...</h3>
                            <p className="text-gray-500 text-sm">Please do not close this window</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                <span className="text-4xl">✓</span>
                            </div>
                            <h3 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h3>
                            <p className="text-gray-500">Redirecting...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
