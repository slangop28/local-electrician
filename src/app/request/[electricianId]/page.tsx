'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { SERVICE_TYPES, URGENCY_LEVELS, TIME_SLOTS, cn } from '@/lib/utils';

interface ElectricianInfo {
    id: string;
    name: string;
    city: string;
    area: string;
}

export default function ServiceRequestPage({
    params
}: {
    params: Promise<{ electricianId: string }>
}) {
    const { electricianId } = use(params);
    const router = useRouter();

    const [electrician, setElectrician] = useState<ElectricianInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [requestId, setRequestId] = useState('');

    // Form state
    const [serviceType, setServiceType] = useState('');
    const [urgency, setUrgency] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredSlot, setPreferredSlot] = useState('');
    const [issueDetail, setIssueDetail] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch electrician info
    useEffect(() => {
        const fetchElectrician = async () => {
            try {
                const response = await fetch(`/api/electrician/${electricianId}`);
                const data = await response.json();

                if (data.success) {
                    setElectrician(data.electrician);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchElectrician();
    }, [electricianId]);

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Validate form
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!serviceType) newErrors.serviceType = 'Select a service type';
        if (!urgency) newErrors.urgency = 'Select urgency level';
        if (!customerName.trim()) newErrors.customerName = 'Enter your name';
        if (!customerPhone || customerPhone.length !== 10) {
            newErrors.customerPhone = 'Enter valid 10-digit phone';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit request
    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);

        try {
            const response = await fetch('/api/request/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    electricianId,
                    serviceType,
                    urgency,
                    preferredDate,
                    preferredSlot,
                    issueDetail,
                    customerName,
                    customerPhone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setRequestId(data.requestId);
                setSuccess(true);
            } else {
                alert(data.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Success screen
    if (success) {
        return (
            <main className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-md mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h1>
                        <p className="text-gray-600 mb-6">
                            Your service request has been sent. The electrician will contact you soon.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Request ID</p>
                            <p className="font-mono font-bold text-lg text-gray-900">{requestId}</p>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm font-medium text-blue-800 mb-2">What&apos;s next?</p>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Electrician will call you within 30 mins</li>
                                <li>• Discuss your requirements</li>
                                <li>• Confirm visit time & estimated cost</li>
                            </ul>
                        </div>

                        <Link href="/app">
                            <Button fullWidth variant="outline">
                                ← Back to Dashboard
                            </Button>
                        </Link>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/app" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <span className="text-sm text-gray-500">Book Service</span>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Electrician Info */}
                {loading ? (
                    <Card variant="default" padding="md" className="mb-6 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-1/2" />
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                            </div>
                        </div>
                    </Card>
                ) : electrician ? (
                    <Card variant="default" padding="md" className="mb-6">
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                                <span className="text-2xl text-white">👷</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-gray-900">{electrician.name}</h2>
                                <p className="text-gray-500">{electrician.area}, {electrician.city}</p>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    ✓ Verified
                                </span>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card variant="bordered" padding="md" className="mb-6 text-center">
                        <p className="text-gray-600">Electrician not found</p>
                        <Link href="/app" className="text-blue-600 text-sm">Go back</Link>
                    </Card>
                )}

                {/* Booking Form */}
                <Card variant="elevated" padding="lg">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Service Details</h2>

                    {/* Service Type */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            What do you need help with?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {SERVICE_TYPES.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => setServiceType(service.id)}
                                    className={cn(
                                        'p-3 rounded-xl border-2 text-center transition-all',
                                        serviceType === service.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-200 text-gray-700'
                                    )}
                                >
                                    <span className="text-2xl block mb-1">{service.icon}</span>
                                    <span className="text-xs font-medium">{service.label}</span>
                                </button>
                            ))}
                        </div>
                        {errors.serviceType && (
                            <p className="text-sm text-red-500 mt-2">{errors.serviceType}</p>
                        )}
                    </div>

                    {/* Urgency */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            How urgent is this?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {URGENCY_LEVELS.map((level) => (
                                <button
                                    key={level.id}
                                    type="button"
                                    onClick={() => setUrgency(level.id)}
                                    className={cn(
                                        'p-3 rounded-xl border-2 text-center transition-all font-medium',
                                        urgency === level.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-200 text-gray-700'
                                    )}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                        {errors.urgency && (
                            <p className="text-sm text-red-500 mt-2">{errors.urgency}</p>
                        )}
                    </div>

                    {/* Date & Time (Optional) */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                                min={getMinDate()}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Time Slot
                            </label>
                            <select
                                value={preferredSlot}
                                onChange={(e) => setPreferredSlot(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                            >
                                <option value="">Select slot</option>
                                {TIME_SLOTS.map((slot) => (
                                    <option key={slot.id} value={slot.id}>{slot.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Issue Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe your issue (Optional)
                        </label>
                        <textarea
                            value={issueDetail}
                            onChange={(e) => setIssueDetail(e.target.value)}
                            placeholder="E.g., Fan making noise, switch not working..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Customer Details */}
                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <h3 className="font-bold text-gray-900 mb-4">Your Contact Details</h3>

                        <div className="space-y-4">
                            <Input
                                label="Your Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                error={errors.customerName}
                            />

                            <Input
                                label="Phone Number"
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                error={errors.customerPhone}
                                helpText="Electrician will call on this number"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleSubmit}
                        loading={submitting}
                        className="mt-8"
                    >
                        Confirm Booking
                    </Button>
                </Card>
            </div>
        </main>
    );
}
