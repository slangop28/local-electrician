'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input, StepIndicator, FileUpload, Card } from '@/components/ui';
import { validatePhone, validatePincode, generateId, generateReferralCode, cn } from '@/lib/utils';

// Step type definitions
type StepData = {
    // Step 1
    name: string;
    phonePrimary: string;
    phoneSecondary: string;
    // Step 2
    houseNo: string;
    area: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    lat: number | null;
    lng: number | null;
    // Step 3
    aadhaarFront: File | null;
    aadhaarBack: File | null;
    panFront: File | null;
    // Referral
    referralCode: string;
};

const STEPS = ['Personal Details', 'Address', 'KYC Upload'];
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

export default function ElectricianRegistrationPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [generatedId, setGeneratedId] = useState('');
    const [generatedReferralCode, setGeneratedReferralCode] = useState('');

    const [formData, setFormData] = useState<StepData>({
        name: '',
        phonePrimary: '',
        phoneSecondary: '',
        houseNo: '',
        area: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
        lat: null,
        lng: null,
        aadhaarFront: null,
        aadhaarBack: null,
        panFront: null,
        referralCode: '',
    });

    const [previews, setPreviews] = useState({
        aadhaarFront: null as string | null,
        aadhaarBack: null as string | null,
        panFront: null as string | null,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Update field
    const updateField = (field: keyof StepData, value: string | File | null | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setTouched(prev => ({ ...prev, [field]: true }));

        // Clear error on change
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Handle file upload
    const handleFileUpload = (field: 'aadhaarFront' | 'aadhaarBack' | 'panFront', file: File | null) => {
        updateField(field, file);

        // Generate preview
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews(prev => ({ ...prev, [field]: e.target?.result as string }));
            };
            reader.readAsDataURL(file);
        } else {
            setPreviews(prev => ({ ...prev, [field]: null }));
        }
    };

    // Validate step
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 0) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.phonePrimary) newErrors.phonePrimary = 'Phone is required';
            else if (!validatePhone(formData.phonePrimary)) newErrors.phonePrimary = 'Enter valid 10-digit phone';
            if (formData.phoneSecondary && !validatePhone(formData.phoneSecondary)) {
                newErrors.phoneSecondary = 'Enter valid 10-digit phone';
            }
        }

        if (step === 1) {
            if (!formData.houseNo.trim()) newErrors.houseNo = 'House No is required';
            if (!formData.area.trim()) newErrors.area = 'Area is required';
            if (!formData.city.trim()) newErrors.city = 'City is required';
            if (!formData.state) newErrors.state = 'State is required';
            if (!formData.pincode) newErrors.pincode = 'Pincode is required';
            else if (!validatePincode(formData.pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';
        }

        if (step === 2) {
            if (!formData.aadhaarFront) newErrors.aadhaarFront = 'Aadhaar front is required';
            if (!formData.aadhaarBack) newErrors.aadhaarBack = 'Aadhaar back is required';
            if (!formData.panFront) newErrors.panFront = 'PAN card is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Next step
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Previous step
    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Get location
    const handleGetLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    updateField('lat', position.coords.latitude);
                    updateField('lng', position.coords.longitude);

                    // Reverse geocode to get address
                    try {
                        const response = await fetch(
                            `/api/geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
                        );
                        const data = await response.json();
                        if (data.address) {
                            // Auto-fill address fields if available
                        }
                    } catch (error) {
                        console.log('Could not reverse geocode', error);
                    }
                },
                (error) => {
                    console.log('Location error:', error);
                    alert('Could not get location. Please enter address manually.');
                }
            );
        }
    };

    // Submit form
    const handleSubmit = async () => {
        if (!validateStep(2)) return;

        setIsSubmitting(true);

        try {
            // Generate IDs
            const electricianId = generateId('ELEC');
            const referralCode = generateReferralCode();

            // Create form data for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('phonePrimary', formData.phonePrimary);
            submitData.append('phoneSecondary', formData.phoneSecondary);
            submitData.append('houseNo', formData.houseNo);
            submitData.append('area', formData.area);
            submitData.append('city', formData.city);
            submitData.append('district', formData.district);
            submitData.append('state', formData.state);
            submitData.append('pincode', formData.pincode);
            submitData.append('lat', formData.lat?.toString() || '');
            submitData.append('lng', formData.lng?.toString() || '');
            submitData.append('referredBy', formData.referralCode);
            submitData.append('electricianId', electricianId);
            submitData.append('referralCode', referralCode);

            if (formData.aadhaarFront) submitData.append('aadhaarFront', formData.aadhaarFront);
            if (formData.aadhaarBack) submitData.append('aadhaarBack', formData.aadhaarBack);
            if (formData.panFront) submitData.append('panFront', formData.panFront);

            const response = await fetch('/api/electrician/register', {
                method: 'POST',
                body: submitData,
            });

            const result = await response.json();

            if (result.success) {
                setGeneratedId(electricianId);
                setGeneratedReferralCode(referralCode);
                setIsSuccess(true);
            } else {
                alert(result.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Copy referral link
    const copyReferralLink = () => {
        const link = `${window.location.origin}/electrician?ref=${generatedReferralCode}`;
        navigator.clipboard.writeText(link);
        alert('Referral link copied!');
    };

    // Check for referral code in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            updateField('referralCode', ref);
        }
    }, []);

    // Success screen
    if (isSuccess) {
        return (
            <main className="min-h-screen gradient-mesh py-12 px-4">
                <div className="max-w-md mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            Your application is under review. We&apos;ll verify your KYC documents and notify you soon.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Your Electrician ID</p>
                            <p className="font-mono font-bold text-lg text-gray-900">{generatedId}</p>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-600 mb-1">Your Referral Code</p>
                            <p className="font-mono font-bold text-2xl text-blue-700">{generatedReferralCode}</p>
                            <p className="text-xs text-blue-500 mt-2">
                                Earn ₹100 for each electrician who completes 2 services!
                            </p>
                        </div>

                        <Button fullWidth onClick={copyReferralLink} className="mb-4">
                            📋 Copy Referral Link
                        </Button>

                        <Link href="/">
                            <Button variant="outline" fullWidth>
                                Return to Home
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
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="font-bold text-gray-900">Local Electrician</span>
                    </Link>
                    <span className="text-sm text-gray-500">Electrician Registration</span>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Step Indicator */}
                <StepIndicator steps={STEPS} currentStep={currentStep} className="mb-8" />

                {/* Form Card */}
                <Card variant="elevated" padding="lg">
                    {/* Step 1: Personal Details */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-slide-up">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Details</h2>
                                <p className="text-gray-500">Enter your details as per Aadhaar card</p>
                            </div>

                            <Input
                                label="Full Name (as per Aadhaar)"
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                error={errors.name}
                                success={!!(touched.name && !errors.name && formData.name.length > 2)}
                            />

                            <Input
                                label="Primary Phone Number"
                                type="tel"
                                value={formData.phonePrimary}
                                onChange={(e) => updateField('phonePrimary', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                error={errors.phonePrimary}
                                success={!!(touched.phonePrimary && validatePhone(formData.phonePrimary))}
                                helpText="10-digit mobile number"
                            />

                            <Input
                                label="Secondary Phone (Optional)"
                                type="tel"
                                value={formData.phoneSecondary}
                                onChange={(e) => updateField('phoneSecondary', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                error={errors.phoneSecondary}
                                success={!!(touched.phoneSecondary && formData.phoneSecondary && validatePhone(formData.phoneSecondary))}
                            />

                            <Input
                                label="Referral Code (Optional)"
                                value={formData.referralCode}
                                onChange={(e) => updateField('referralCode', e.target.value.toUpperCase())}
                                helpText="Enter if referred by another electrician"
                            />
                        </div>
                    )}

                    {/* Step 2: Address */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-slide-up">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Address</h2>
                                <p className="text-gray-500">Where you&apos;ll provide electrical services</p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                fullWidth
                                onClick={handleGetLocation}
                                className="mb-2"
                            >
                                <span className="mr-2">📍</span>
                                Auto-detect My Location
                            </Button>

                            {formData.lat && formData.lng && (
                                <p className="text-sm text-green-600 text-center mb-4">
                                    ✓ Location detected: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="House/Shop No."
                                    value={formData.houseNo}
                                    onChange={(e) => updateField('houseNo', e.target.value)}
                                    error={errors.houseNo}
                                    success={!!(touched.houseNo && !errors.houseNo && formData.houseNo.length > 0)}
                                />

                                <Input
                                    label="Area/Locality"
                                    value={formData.area}
                                    onChange={(e) => updateField('area', e.target.value)}
                                    error={errors.area}
                                    success={!!(touched.area && !errors.area && formData.area.length > 0)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="City"
                                    value={formData.city}
                                    onChange={(e) => updateField('city', e.target.value)}
                                    error={errors.city}
                                    success={!!(touched.city && !errors.city && formData.city.length > 0)}
                                />

                                <Input
                                    label="District"
                                    value={formData.district}
                                    onChange={(e) => updateField('district', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                    <select
                                        value={formData.state}
                                        onChange={(e) => updateField('state', e.target.value)}
                                        className={cn(
                                            'w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200',
                                            'focus:outline-none focus:bg-white focus:border-blue-500',
                                            errors.state ? 'border-red-500' : 'border-gray-200'
                                        )}
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                    {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                                </div>

                                <Input
                                    label="Pincode"
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    error={errors.pincode}
                                    success={!!(touched.pincode && validatePincode(formData.pincode))}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: KYC Upload */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-slide-up">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Documents</h2>
                                <p className="text-gray-500">Upload clear photos of your documents</p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                <p className="text-sm text-yellow-800">
                                    <span className="font-bold">Important:</span> Ensure all text is clearly visible. Blurry images may delay verification.
                                </p>
                            </div>

                            <FileUpload
                                label="Aadhaar Card - Front"
                                onChange={(file) => handleFileUpload('aadhaarFront', file)}
                                preview={previews.aadhaarFront}
                                error={errors.aadhaarFront}
                            />

                            <FileUpload
                                label="Aadhaar Card - Back"
                                onChange={(file) => handleFileUpload('aadhaarBack', file)}
                                preview={previews.aadhaarBack}
                                error={errors.aadhaarBack}
                            />

                            <FileUpload
                                label="PAN Card"
                                onChange={(file) => handleFileUpload('panFront', file)}
                                preview={previews.panFront}
                                error={errors.panFront}
                            />
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                        {currentStep > 0 && (
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                ← Back
                            </Button>
                        )}

                        {currentStep < STEPS.length - 1 ? (
                            <Button onClick={handleNext} className="flex-1">
                                Continue →
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                className="flex-1"
                            >
                                Submit Application
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Trust indicators */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p className="flex items-center justify-center gap-2">
                        <span>🔒</span>
                        Your data is encrypted and secure
                    </p>
                </div>
            </div>
        </main>
    );
}
