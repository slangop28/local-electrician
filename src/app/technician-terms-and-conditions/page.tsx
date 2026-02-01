'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { generateId, generateReferralCode } from '@/lib/utils';

interface StoredData {
  name: string;
  phonePrimary: string;
  phoneSecondary: string;
  houseNo: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  referralCode: string;
  aadhaarFrontBase64: string | null;
  aadhaarFrontName: string | null;
  aadhaarFrontType: string | null;
  aadhaarBackBase64: string | null;
  aadhaarBackName: string | null;
  aadhaarBackType: string | null;
  panFrontBase64: string | null;
  panFrontName: string | null;
  panFrontType: string | null;
}

function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const arr = base64.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
}

function TechnicianTermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRegistration = searchParams.get('fromRegistration') === 'true';

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [generatedReferralCode, setGeneratedReferralCodeState] = useState('');
  const [storedData, setStoredData] = useState<StoredData | null>(null);

  // Bank details form
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fromRegistration) {
      const data = sessionStorage.getItem('technicianRegistrationData');
      if (data) {
        setStoredData(JSON.parse(data));
      } else {
        // No data found, redirect back to registration
        router.push('/electrician');
      }
    }
  }, [fromRegistration, router]);

  const validateBankDetails = () => {
    const newErrors: Record<string, string> = {};

    if (!bankAccountName.trim()) newErrors.bankAccountName = 'Account holder name is required';
    if (!bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Account number is required';
    else if (!/^\d{9,18}$/.test(bankAccountNumber)) newErrors.bankAccountNumber = 'Enter valid account number (9-18 digits)';
    if (!bankIfscCode.trim()) newErrors.bankIfscCode = 'IFSC code is required';
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfscCode.toUpperCase())) newErrors.bankIfscCode = 'Enter valid IFSC code';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitRegistration = async () => {
    if (!validateBankDetails() || !storedData) return;

    setIsSubmitting(true);

    try {
      // Generate IDs
      const electricianId = generateId('ELEC');
      const referralCode = generateReferralCode();

      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('name', storedData.name);
      submitData.append('phonePrimary', storedData.phonePrimary);
      submitData.append('phoneSecondary', storedData.phoneSecondary);
      submitData.append('houseNo', storedData.houseNo);
      submitData.append('area', storedData.area);
      submitData.append('city', storedData.city);
      submitData.append('district', storedData.district);
      submitData.append('state', storedData.state);
      submitData.append('pincode', storedData.pincode);
      submitData.append('lat', storedData.lat?.toString() || '');
      submitData.append('lng', storedData.lng?.toString() || '');
      submitData.append('referredBy', storedData.referralCode);
      submitData.append('electricianId', electricianId);
      submitData.append('referralCode', referralCode);
      submitData.append('bankAccountName', bankAccountName);
      submitData.append('bankAccountNumber', bankAccountNumber);
      submitData.append('bankIfscCode', bankIfscCode.toUpperCase());
      submitData.append('agreedToTerms', 'true');

      // Convert base64 back to files
      if (storedData.aadhaarFrontBase64 && storedData.aadhaarFrontName && storedData.aadhaarFrontType) {
        const file = base64ToFile(storedData.aadhaarFrontBase64, storedData.aadhaarFrontName, storedData.aadhaarFrontType);
        submitData.append('aadhaarFront', file);
      }
      if (storedData.aadhaarBackBase64 && storedData.aadhaarBackName && storedData.aadhaarBackType) {
        const file = base64ToFile(storedData.aadhaarBackBase64, storedData.aadhaarBackName, storedData.aadhaarBackType);
        submitData.append('aadhaarBack', file);
      }
      if (storedData.panFrontBase64 && storedData.panFrontName && storedData.panFrontType) {
        const file = base64ToFile(storedData.panFrontBase64, storedData.panFrontName, storedData.panFrontType);
        submitData.append('panFront', file);
      }

      const response = await fetch('/api/electrician/register', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        // Clear stored data
        sessionStorage.removeItem('technicianRegistrationData');
        setGeneratedId(electricianId);
        setGeneratedReferralCodeState(referralCode);
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

  // Success screen
  if (isSuccess) {
    setTimeout(() => {
      window.location.href = '/electrician-pending';
    }, 3000);

    return (
      <main className="min-h-screen gradient-mesh py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center bg-gray-900/80 border border-cyan-500/30 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Registration Successful!</h1>
            <p className="text-gray-400 mb-6">
              Your application is under review. We&apos;ll verify your KYC documents and notify you soon.
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
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Local Electrician</span>
            </Link>
            {fromRegistration && (
              <span className="text-sm text-blue-600 font-medium">Step 4 of 4: Terms & Conditions</span>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Technician Terms and Conditions
            </h1>
            <p className="text-gray-600">
              Terms governing service providers on Local Electrician | Last updated: January 30, 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction for Service Providers</h2>
              <p>
                Welcome to Local Electrician! These Terms and Conditions govern your participation as a Service Provider (Electrician/Technician) on the Local Electrician platform. By registering and accepting bookings, you agree to be bound by these Terms.
              </p>
              <p>
                Local Electrician is a marketplace platform that connects you with customers seeking electrical services. You retain the right to accept or decline any booking, set your own pricing (within approved ranges), and operate as an independent contractor.
              </p>
            </section>

            {/* Registration Requirements */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Registration and Verification Requirements</h2>
              <p>
                <strong>Mandatory Verification Process:</strong> All technicians must complete rigorous KYC verification including:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Valid Aadhaar card for identity verification</li>
                <li>PAN card for tax compliance and GST registration</li>
                <li>Bank account details for payments</li>
                <li>Electrical license or certificate of competence (if applicable in your region)</li>
                <li>Proof of experience and references</li>
                <li>Background verification and police clearance</li>
                <li>Mobile number verification via OTP</li>
              </ul>
              <p>
                You must provide accurate and truthful information. Any false or misleading information may result in immediate account termination and potential legal action.
              </p>
            </section>

            {/* Our Commitment to Trust */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Our Commitment to Trust and Safety</h2>
              <p>
                <strong>Trust is our foundation.</strong> We maintain the highest standards of verification and safety for both customers and technicians:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>All technicians are thoroughly verified before activation</li>
                <li>Customer data and ratings are protected and verified</li>
                <li>We maintain zero tolerance for harassment or discrimination</li>
                <li>Disputes are resolved fairly and transparently</li>
                <li>Your professional reputation is safeguarded against false claims</li>
              </ul>
            </section>

            {/* Independent Contractor Status */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Independent Contractor Status</h2>
              <p>
                You are an independent contractor, not an employee of Local Electrician. This means:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>You set your own schedule and availability</li>
                <li>You can accept or decline any service request</li>
                <li>You determine your service pricing (within platform guidelines)</li>
                <li>You are responsible for your own tools, equipment, and insurance</li>
                <li>You are responsible for tax compliance and GST registration</li>
                <li>You maintain your own professional licenses and certifications</li>
                <li>You are responsible for any costs incurred in providing services</li>
              </ul>
            </section>

            {/* Service Standards */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Standards and Professional Conduct</h2>
              <p>
                <strong>Excellence is Expected:</strong> You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Arrive on time for confirmed bookings</li>
                <li>Provide professional and courteous service</li>
                <li>Communicate clearly with customers about the work and costs</li>
                <li>Use safe and appropriate techniques for electrical work</li>
                <li>Follow all applicable electrical codes and safety regulations</li>
                <li>Provide clear invoices and receipts for all work</li>
                <li>Clean up after completing work</li>
                <li>Address customer concerns professionally and responsively</li>
              </ul>
            </section>

            {/* Booking and Payment */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Booking Management and Payments</h2>
              <p>
                <strong>How Bookings Work:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>You receive booking notifications for service requests in your area</li>
                <li>You have the right to accept or decline any booking</li>
                <li>Once you accept, you commit to providing the agreed service</li>
                <li>Cancelling accepted bookings without valid reason will affect your rating</li>
              </ul>
              <p>
                <strong>Payment Terms:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Payments are processed through the platform</li>
                <li>Platform commission (typically 15-20%) is deducted from each booking</li>
                <li>Payment is transferred to your registered bank account within 2-3 business days</li>
                <li>You are responsible for all taxes and GST on your earnings</li>
                <li>No cash payments should be processed through the platform</li>
              </ul>
            </section>

            {/* Pricing Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Pricing and Transparency</h2>
              <p>
                <strong>Transparent Pricing is Mandatory:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>You must provide upfront quotes before starting work</li>
                <li>Pricing must be displayed clearly on your profile</li>
                <li>Additional charges must be communicated to customers before approval</li>
                <li>No hidden or surprise charges are permitted</li>
                <li>Emergency service premiums are allowed but must be pre-disclosed</li>
                <li>Overtime charges must be clearly stated and agreed upon</li>
              </ul>
              <p>
                Failure to maintain transparent pricing may result in account suspension.
              </p>
            </section>

            {/* Quality and Warranty */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Quality of Work and Warranty</h2>
              <p>
                You are responsible for the quality of services you provide:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Work must meet industry standards and local electrical codes</li>
                <li>You should provide a warranty on materials and labor where applicable</li>
                <li>You are liable for any damage caused by your negligence</li>
                <li>Customers have the right to request rework if standards are not met</li>
                <li>Refunds may be issued for substandard work upon verification</li>
              </ul>
            </section>

            {/* Insurance and Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Insurance and Liability</h2>
              <p>
                <strong>You are responsible for:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Obtaining professional liability insurance</li>
                <li>Obtaining tools and equipment insurance</li>
                <li>Maintaining health and accident insurance</li>
                <li>Any damage to customer property caused by your work</li>
                <li>Any personal injury you may cause while on customer premises</li>
              </ul>
              <p>
                Local Electrician does not provide insurance coverage. We strongly recommend maintaining comprehensive professional insurance.
              </p>
            </section>

            {/* Rating and Reviews */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Ratings, Reviews, and Account Standing</h2>
              <p>
                <strong>Your Professional Reputation Matters:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Customers can rate your service on a 1-5 star scale</li>
                <li>Rating is based on professionalism, quality, punctuality, and communication</li>
                <li>Your rating is visible on your profile and influences customer bookings</li>
                <li>Ratings below 4.0 stars may result in profile demotion or suspension</li>
                <li>You have the right to respond to reviews professionally</li>
                <li>Abusive or false reviews can be reported and investigated</li>
              </ul>
            </section>

            {/* Professional Conduct */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Professional Conduct and Prohibited Behavior</h2>
              <p>
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Discriminate against customers based on religion, caste, gender, or other protected characteristics</li>
                <li>Harass, abuse, or threaten customers or other technicians</li>
                <li>Engage in any illegal activities</li>
                <li>Misrepresent your qualifications or experience</li>
                <li>Conduct work that violates electrical codes or safety standards</li>
                <li>Request cash payments outside the platform system</li>
                <li>Share customer personal information with third parties</li>
                <li>Attempt to conduct business directly with customers to bypass platform fees</li>
                <li>Post false or defamatory content about customers or competitors</li>
                <li>Engage in any form of fraud or deception</li>
              </ul>
            </section>

            {/* Cancellation Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Cancellation Policy for Technicians</h2>
              <p>
                <strong>Cancellation Guidelines:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>You may cancel bookings only in genuine emergencies</li>
                <li>Cancellation must be done with at least 2 hours notice (when possible)</li>
                <li>Customer is entitled to full refund if you cancel</li>
                <li>Repeated cancellations (more than 2 per month) may result in penalties</li>
                <li>Habitual cancellation may lead to account suspension</li>
                <li>If you accept a booking, you commit to completing it</li>
              </ul>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Dispute Resolution and Grievances</h2>
              <p>
                In case of disputes with customers:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Try to resolve issues directly with the customer first</li>
                <li>If unresolved, file a complaint through the platform</li>
                <li>Our team will investigate complaints fairly and transparently</li>
                <li>Both sides will be given opportunity to present evidence</li>
                <li>Refunds may be issued if your service is found to be substandard</li>
                <li>You have the right to appeal any decision through our arbitration process</li>
              </ul>
            </section>

            {/* Data Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Data Privacy and Confidentiality</h2>
              <p>
                Your personal information is protected under the Information Technology Act, 2000:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>We collect only essential information for account verification</li>
                <li>Your data is encrypted and securely stored</li>
                <li>We do not share your personal data with third parties without consent</li>
                <li>Customers can see your name, phone, and service details</li>
                <li>You must protect customer personal information</li>
                <li>Customer details are confidential and should not be shared</li>
              </ul>
              <p>
                Refer to our Privacy Policy for detailed data handling practices.
              </p>
            </section>

            {/* Account Suspension and Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Account Suspension and Termination</h2>
              <p>
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violate these Terms and Conditions</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Consistently provide substandard service (rating below 3.5 stars)</li>
                <li>Harass or abuse customers or other technicians</li>
                <li>Fail to complete accepted bookings without valid reason</li>
                <li>Receive multiple complaints of unprofessional conduct</li>
                <li>Misrepresent your qualifications or experience</li>
              </ul>
              <p>
                Suspension is typically temporary (14-30 days), while termination is permanent. You will be notified with reasons and given opportunity to appeal.
              </p>
            </section>

            {/* Tax Compliance */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Tax Compliance and GST</h2>
              <p>
                <strong>You are responsible for:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Registering for GST (if your annual earnings exceed the threshold)</li>
                <li>Maintaining proper business records and invoices</li>
                <li>Filing income tax returns based on platform earnings</li>
                <li>Paying applicable taxes and GST on your services</li>
                <li>Complying with local business regulations</li>
              </ul>
              <p>
                Local Electrician will provide monthly earning statements for your tax filing. Non-compliance with tax obligations is your legal responsibility.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Intellectual Property</h2>
              <p>
                All content on the Local Electrician platform (logos, design, code) is owned by or licensed to Local Electrician. You may not reproduce or use any platform content without permission.
              </p>
              <p>
                However, you retain ownership of any content, photos, or descriptions you provide for your profile.
              </p>
            </section>

            {/* Communication Standards */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Communication Standards</h2>
              <p>
                For professional service delivery:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Respond to booking inquiries within 30 minutes</li>
                <li>Notify customers of estimated arrival time</li>
                <li>Keep communication professional and respectful</li>
                <li>Do not share personal contact details for bookings</li>
                <li>Respond to customer complaints within 24 hours</li>
                <li>Do not engage in promotional activities through customer chats</li>
              </ul>
            </section>

            {/* Safety and Compliance */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Safety and Legal Compliance</h2>
              <p>
                <strong>You must:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Follow all electrical codes and safety standards</li>
                <li>Use properly certified and safe tools and equipment</li>
                <li>Wear appropriate safety gear while working</li>
                <li>Not conduct work under the influence of alcohol or drugs</li>
                <li>Maintain valid electrical licenses and certifications</li>
                <li>Have appropriate permits for major electrical work</li>
                <li>Not recommend or use substandard materials</li>
                <li>Respect customer property and privacy</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">20. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms and Conditions are governed by the laws of India. Any disputes shall be resolved through:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>First: Direct negotiation and platform mediation</li>
                <li>Second: Arbitration under the Arbitration and Conciliation Act, 1996</li>
                <li>Final: Courts in India have exclusive jurisdiction</li>
              </ul>
            </section>

            {/* Contact Support */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">21. Support and Grievance Redressal</h2>
              <p>
                For support or grievances:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> technician-support@localelectrician.in</li>
                <li><strong>Phone:</strong> +91-XXXX-XXXX-XXX</li>
                <li><strong>WhatsApp:</strong> +91-XXXX-XXXX-XXX</li>
                <li><strong>Support Hours:</strong> Monday - Saturday, 9 AM - 6 PM</li>
              </ul>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">22. Entire Agreement</h2>
              <p>
                These Terms and Conditions, along with our Privacy Policy, constitute the entire agreement between you and Local Electrician. They supersede all prior agreements, understandings, and communications, whether written or oral.
              </p>
            </section>
          </div>

          {/* Bank Details Form - Only shown when coming from registration */}
          {fromRegistration && storedData && (
            <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bank Details for Payments</h3>
              <p className="text-gray-600 mb-6">
                Please provide your bank details for receiving payments after successful services.
              </p>

              <div className="space-y-4">
                <Input
                  label="Account Holder Name"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  error={errors.bankAccountName}
                  helpText="Name as per bank records"
                />

                <Input
                  label="Bank Account Number"
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                  error={errors.bankAccountNumber}
                  helpText="9-18 digit account number"
                />

                <Input
                  label="IFSC Code"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase().slice(0, 11))}
                  error={errors.bankIfscCode}
                  helpText="11-character IFSC code (e.g., SBIN0001234)"
                />
              </div>
            </div>
          )}

          {/* Agreement Checkbox */}
          <div className="mt-12 p-6 bg-green-50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-1 rounded border-gray-300"
              />
              <span>
                <p className="font-medium text-gray-900">
                  I agree to the Technician Terms and Conditions
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  By checking this box, you confirm that you have read and agree to be bound by these Terms and Conditions for Service Providers
                </p>
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-center">
            {fromRegistration ? (
              <>
                <Link href="/electrician">
                  <Button variant="outline" size="lg">
                    ← Back to Registration
                  </Button>
                </Link>
                <Button
                  size="lg"
                  onClick={handleSubmitRegistration}
                  loading={isSubmitting}
                  disabled={!agreed || !bankAccountName || !bankAccountNumber || !bankIfscCode}
                >
                  Complete Registration
                </Button>
              </>
            ) : (
              <>
                <Link href="/">
                  <Button variant="outline" size="lg">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/electrician">
                  <Button size="lg">
                    Register as Technician
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <span className="font-bold text-xl">Local Electrician</span>
            </div>

            <div className="flex items-center gap-6 text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Customer T&C</Link>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-gray-500 text-sm">
              © 2026 localelectrician.in. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function TechnicianTermsAndConditions() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <TechnicianTermsContent />
    </Suspense>
  );
}
