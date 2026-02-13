'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button, Input, StepIndicator, FileUpload, Card } from '@/components/ui';
import { validatePhone, validatePincode, generateId, generateReferralCode, cn } from '@/lib/utils';

// Step type definitions
type StepData = {
    // Step 1
    name: string;
    email: string;
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
    // Step 3 - Bank Details (now step 3, but handled as part of final submission)
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
    // Referral
    referralCode: string;
};

const STEPS = ['Personal Details', 'Address', 'Bank Details'];
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

export default function ElectricianRegistrationPage() {
    const router = useRouter();
    const { userProfile, isLoading } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [generatedId, setGeneratedId] = useState('');
    const [generatedReferralCode, setGeneratedReferralCode] = useState('');

    // Redirect if electrician is already registered
    useEffect(() => {
        if (!isLoading && userProfile) {
            if (userProfile.isElectrician && userProfile.electricianStatus === 'VERIFIED') {
                // User is a verified electrician - redirect to dashboard
                router.push('/electrician-dashboard');
            } else if (userProfile.userType === 'electrician' && userProfile.electricianId) {
                // User is an electrician (registered but maybe pending verification)
                router.push('/electrician-dashboard');
            } else if (!userProfile.isElectrician && userProfile.userType === 'customer') {
                // User is logged in as customer - redirect to customer dashboard
                router.push('/app');
            }
        }
    }, [userProfile, isLoading, router]);

    const [formData, setFormData] = useState<StepData>({
        name: '',
        email: '',
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
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        referralCode: '',
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

    // Validate step
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 0) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter valid email';
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

        if (step === 2) { // Bank Details
            // Bank Details are now optional as per user request
            // Validation removed. User can skip freely.
            return true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Next step
    const handleNext = async () => {
        if (validateStep(currentStep)) {
            // After Bank Details step (step 2), redirect to T&C page
            if (currentStep === 2) {
                // Store form data in sessionStorage before redirecting to T&C
                try {
                    const dataToStore = {
                        name: formData.name,
                        email: formData.email,
                        phonePrimary: formData.phonePrimary,
                        phoneSecondary: formData.phoneSecondary,
                        houseNo: formData.houseNo,
                        area: formData.area,
                        city: formData.city,
                        district: formData.district,
                        state: formData.state,
                        pincode: formData.pincode,
                        lat: formData.lat,
                        lng: formData.lng,
                        referralCode: formData.referralCode,
                        bankAccountName: formData.bankAccountName,
                        bankAccountNumber: formData.bankAccountNumber,
                        bankIfscCode: formData.bankIfscCode,
                    };
                    sessionStorage.setItem('technicianRegistrationData', JSON.stringify(dataToStore));
                    router.push('/technician-terms-and-conditions?fromRegistration=true');
                    return;
                } catch (error) {
                    console.error('Error storing form data:', error);
                    alert('Error processing data. Please try again.');
                    return;
                }
            }
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Previous step
    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Get location with improved reliability
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');

    const handleGetLocation = () => {
        if ('geolocation' in navigator) {
            setIsGettingLocation(true);
            setLocationError('');

            // First try with high accuracy
            const highAccuracyOptions = {
                enableHighAccuracy: true,
                timeout: 10000, // 10 second timeout
                maximumAge: 60000 // Accept cached position up to 1 minute old
            };

            // Fallback to lower accuracy if high accuracy fails
            const lowAccuracyOptions = {
                enableHighAccuracy: false,
                timeout: 15000, // 15 second timeout
                maximumAge: 300000 // Accept cached position up to 5 minutes old
            };

            const onSuccess = async (position: GeolocationPosition) => {
                const { latitude, longitude } = position.coords;
                updateField('lat', latitude);
                updateField('lng', longitude);

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `/api/reverse-geocode?lat=${latitude}&lng=${longitude}`
                    );
                    const data = await response.json();

                    if (data.success && data.address) {
                        const addr = data.address;

                        // Auto-fill address fields
                        if (addr.area) updateField('area', addr.area);
                        if (addr.city) updateField('city', addr.city);
                        if (addr.district) updateField('district', addr.district);
                        if (addr.state) updateField('state', addr.state);
                        if (addr.pincode) updateField('pincode', addr.pincode);
                    }
                } catch (error) {
                    console.log('Could not reverse geocode', error);
                } finally {
                    setIsGettingLocation(false);
                }
            };

            const onHighAccuracyError = (error: GeolocationPositionError) => {
                console.warn('High accuracy location failed, trying low accuracy...', error);
                // Try again with lower accuracy as fallback
                navigator.geolocation.getCurrentPosition(
                    onSuccess,
                    onFinalError,
                    lowAccuracyOptions
                );
            };

            const onFinalError = (error: GeolocationPositionError) => {
                console.error('Location error:', error);
                setIsGettingLocation(false);

                // Provide more specific error messages
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('Location permission denied. Please enable location access in your browser settings.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('Location unavailable. Please check your GPS/network connection.');
                        break;
                    case error.TIMEOUT:
                        setLocationError('Location request timed out. Please try again.');
                        break;
                    default:
                        setLocationError('Could not get location. Please enter address manually.');
                }
            };

            navigator.geolocation.getCurrentPosition(
                onSuccess,
                onHighAccuracyError,
                highAccuracyOptions
            );
        } else {
            setLocationError('Geolocation is not supported by your browser.');
        }
    };

    // Auto-fill email and phone if available
    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                email: prev.email || userProfile.email || '',
                phonePrimary: prev.phonePrimary || userProfile.phone || ''
            }));
        }
    }, [userProfile]);

    // Submit form
    const handleSubmit = async () => {
        if (!validateStep(2)) return; // Validate the last step (Bank Details)

        setIsSubmitting(true);

        try {
            // Generate IDs
            const electricianId = generateId('ELEC');
            const referralCode = generateReferralCode();

            // Create form data for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
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
            submitData.append('bankAccountName', formData.bankAccountName);
            submitData.append('bankAccountNumber', formData.bankAccountNumber);
            submitData.append('bankIfscCode', formData.bankIfscCode.toUpperCase());

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
        // Redirect to pending page after showing success briefly
        setTimeout(() => {
            window.location.href = '/electrician-dashboard';
        }, 3000);

        return (
            <main className="min-h-screen gradient-mesh py-12 px-4">
                <div className="max-w-md mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center bg-gray-900/80 border border-cyan-500/30 backdrop-blur-lg">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-glow mb-2">Registration Successful!</h1>
                        <p className="text-gray-400 mb-6">
                            Your application is under review. We&apos;ll verify your details and notify you soon.
                        </p>

                        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Your Electrician ID</p>
                            <p className="font-mono font-bold text-lg text-cyan-400">{generatedId}</p>
                        </div>

                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
                            <p className="text-sm text-cyan-300 mb-1">Your Referral Code</p>
                            <p className="font-mono font-bold text-2xl text-cyan-400">{generatedReferralCode}</p>
                            <p className="text-xs text-cyan-400/70 mt-2">
                                Earn ₹100 for each electrician who completes 2 services!
                            </p>
                        </div>

                        <Button fullWidth onClick={copyReferralLink} className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600">
                            📋 Copy Referral Link
                        </Button>

                        <p className="text-sm text-gray-500 animate-pulse">
                            Redirecting to your profile...
                        </p>
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
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
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
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                error={errors.email}
                                success={!!(touched.email && !errors.email && /\S+@\S+\.\S+/.test(formData.email))}
                                disabled={!!userProfile?.email} // Disable if auto-filled from login
                                helpText={userProfile?.email ? "Linked to your login account" : "Required for login"}
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
                                loading={isGettingLocation}
                                disabled={isGettingLocation}
                                className="mb-2"
                            >
                                <span className="mr-2">📍</span>
                                {isGettingLocation ? 'Detecting Location...' : 'Auto-detect My Location'}
                            </Button>

                            {formData.lat && formData.lng && (
                                <p className="text-sm text-green-600 text-center mb-4">
                                    ✓ Location detected: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                                </p>
                            )}

                            {locationError && (
                                <p className="text-sm text-red-500 text-center mb-4">
                                    {locationError}
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
                                            'w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 text-gray-900',
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

                    {/* Step 3: Bank Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-slide-up">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Details (Optional)</h2>
                                <p className="text-gray-500">Provide your bank details for payments. You can add this later too.</p>
                            </div>

                            <Input
                                label="Bank Account Holder Name"
                                value={formData.bankAccountName}
                                onChange={(e) => updateField('bankAccountName', e.target.value)}
                                error={errors.bankAccountName}
                                success={!!(touched.bankAccountName && !errors.bankAccountName && formData.bankAccountName.length > 0)}
                            />

                            <Input
                                label="Bank Account Number"
                                type="text"
                                value={formData.bankAccountNumber}
                                onChange={(e) => updateField('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
                                error={errors.bankAccountNumber}
                                success={!!(touched.bankAccountNumber && !errors.bankAccountNumber && formData.bankAccountNumber.length > 0)}
                            />

                            <Input
                                label="IFSC Code"
                                type="text"
                                value={formData.bankIfscCode}
                                onChange={(e) => updateField('bankIfscCode', e.target.value.toUpperCase())}
                                error={errors.bankIfscCode}
                                success={!!(touched.bankIfscCode && !errors.bankIfscCode && formData.bankIfscCode.length > 0)}
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

                        <Button onClick={handleNext} className="flex-1">
                            {currentStep === STEPS.length - 1 ? 'Continue to Terms & Conditions →' : 'Continue →'}
                        </Button>
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
