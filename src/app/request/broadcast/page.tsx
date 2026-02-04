'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { SERVICE_TYPES, URGENCY_LEVELS, TIME_SLOTS, cn } from '@/lib/utils';
import { reverseGeocode } from '@/lib/geocoding';

export default function BroadcastRequestPage() {
    const router = useRouter();

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
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Store lat/lng for broadcast matching
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});

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
        if (!address.trim()) newErrors.address = 'Address is required';
        if (!city.trim()) newErrors.city = 'City is required';
        if (!pincode.trim()) newErrors.pincode = 'Pincode is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit request
    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);

        try {
            const response = await fetch('/api/request/create-broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceType,
                    urgency,
                    preferredDate,
                    preferredSlot,
                    issueDetail,
                    customerName,
                    customerPhone,
                    address,
                    city,
                    pincode,
                    lat: location?.lat || 0,
                    lng: location?.lng || 0
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

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });

                    const addressStr = await reverseGeocode(latitude, longitude);
                    if (addressStr) {
                        setAddress(addressStr);

                        // Extract pincode (6 digits)
                        const pinMatch = addressStr.match(/\b\d{6}\b/);
                        if (pinMatch) setPincode(pinMatch[0]);

                        // Heuristic for city
                        const parts = addressStr.split(',').map(p => p.trim());
                        if (parts.length > 3) {
                            setCity(parts[parts.length - 3]);
                        }
                    }
                } catch (error) {
                    console.error('Geocoding failed:', error);
                    alert('Could not detect address. Please enter manually.');
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Location access denied or failed.');
                setDetectingLocation(false);
            }
        );
    };

    // Success screen
    if (success) {
        return (
            <main className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-md mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📡</span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Broadcasting Request!</h1>
                        <p className="text-gray-600 mb-6">
                            We have sent your request to all nearby electricians. The first one to accept will contact you.
                        </p>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left animate-pulse">
                            <p className="text-sm font-medium text-blue-800 mb-2">Searching nearby...</p>
                            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Request ID</p>
                            <p className="font-mono font-bold text-lg text-gray-900">{requestId}</p>
                        </div>

                        <Link href="/app">
                            <Button fullWidth variant="primary">
                                ← Go to Dashboard
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
                    <span className="text-sm text-gray-500">Book Any Electrician</span>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">

                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Book Any Electrician</h1>
                    <p className="text-gray-600">We&apos;ll find the best available electrician for you instantly.</p>
                </div>

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
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Time Slot
                            </label>
                            <select
                                value={preferredSlot}
                                onChange={(e) => setPreferredSlot(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
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
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Address Details */}
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Address Details</h3>
                            <button
                                type="button"
                                onClick={handleAutoDetect}
                                disabled={detectingLocation}
                                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
                            >
                                {detectingLocation ? (
                                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <span>📍</span>
                                )}
                                Auto Detect Location
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="House No, Street, Area..."
                                    rows={2}
                                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none resize-none text-gray-900 placeholder:text-gray-400 ${errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                                        }`}
                                />
                                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    error={errors.city}
                                />
                                <Input
                                    label="Pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    error={errors.pincode}
                                    type="tel"
                                />
                            </div>
                        </div>
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
                                helpText="Electricians will call on this number"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleSubmit}
                        loading={submitting}
                        className="mt-8 bg-black text-white hover:bg-gray-800"
                    >
                        Broadcast Request 📡
                    </Button>
                </Card>
            </div>
        </main>
    );
}
