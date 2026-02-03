'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export default function PrivacyPolicy() {
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
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-600">
                            Last updated: February 3, 2026
                        </p>
                    </div>

                    <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                            <p>
                                Local Electrician ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our mobile application, or engage with our services (collectively, the "Platform").
                            </p>
                            <p>
                                By using our Platform, you consent to the data practices described in this policy. If you do not agree with the terms of this Privacy Policy, please do not access the Platform.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                            <p>We collect information that identifies, relates to, describes, references, is capable of being associated with, or could reasonably be linked, directly or indirectly, with you ("Personal Information").</p>

                            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">A. Information You Provide to Us</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Account Registration:</strong> Name, email address, phone number, and password.</li>
                                <li><strong>Service Requests:</strong> Address, location details, description of electrical issues, and preferred service times.</li>
                                <li><strong>Technician/Electrician Data:</strong>
                                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-600">
                                        <li>KYC Documents (Aadhaar Card, PAN Card) for identity verification.</li>
                                        <li>Bank Account details (Account Number, IFSC Code) for processing payments.</li>
                                        <li>Professional details (Experience, Skills, License info).</li>
                                    </ul>
                                </li>
                                <li><strong>Communications:</strong> Records of your correspondence with us or other users via the Platform.</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">B. Information We Collect Automatically</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Location Data:</strong> We collect precise geolocation data to connect customers with nearby electricians. This is critical for the functioning of our Service.</li>
                                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
                                <li><strong>Usage Data:</strong> Access times, pages viewed, and the routes by which you access our Service.</li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                            <p>We use the information we collect to:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Facilitate Services:</strong> Connect customers with electricians, process bookings, and enable payments.</li>
                                <li><strong>Verify Identities:</strong> Conduct KYC checks on electricians to ensure platform safety and trust.</li>
                                <li><strong>Improve Our Platform:</strong> Analyze usage patterns to enhance user experience and optimize our algorithms.</li>
                                <li><strong>Communication:</strong> Send order updates, security alerts, and administrative messages.</li>
                                <li><strong>Safety and Security:</strong> Detect and prevent fraud, abuse, and security incidents.</li>
                                <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes (e.g., GST adherence).</li>
                            </ul>
                        </section>

                        {/* Sharing of Information */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
                            <p>We may share your information in the following situations:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>With Service Providers/Customers:</strong>
                                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-600">
                                        <li>Customers see Electrician's name, rating, and approximate distance.</li>
                                        <li>Electricians see Customer's name, address, and service details upon booking acceptance.</li>
                                    </ul>
                                </li>
                                <li><strong>Third-Party Service Providers:</strong> We share data with vendors who help us operate (e.g., cloud hosting, payment processors, map services, SMS providers).</li>
                                <li><strong>Legal Obligations:</strong> We may disclose information if required by law or in response to valid requests by public authorities (e.g., a court or government agency).</li>
                                <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition of all or a portion of our business.</li>
                            </ul>
                        </section>

                        {/* Data Security */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your personal information.
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Encryption:</strong> Data is encrypted in transit (SSL/TLS) and sensitive data (like KYC documents) is stored securely.</li>
                                <li><strong>Access Controls:</strong> Access to personal data is restricted to authorized personnel only.</li>
                                <li><strong>Regular Audits:</strong> We regularly review our information collection, storage, and processing practices.</li>
                            </ul>
                            <p className="mt-2 text-sm text-gray-500">
                                While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                            </p>
                        </section>

                        {/* User Rights */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Data Rights</h2>
                            <p>Depending on your location, you may have the right to:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                                <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal retention requirements).</li>
                                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time.</li>
                            </ul>
                        </section>

                        {/* Cookies */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
                            <p>
                                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some parts of our Platform may use.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Usage by Minors</h2>
                            <p>
                                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a minor without verification of parental consent, we take steps to remove that information from our servers.
                            </p>
                        </section>

                        {/* Changes to Policy */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
                            <p>
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                            </p>
                        </section>

                        {/* Contact Us */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us:
                            </p>
                            <ul className="list-none space-y-2">
                                <li><strong>Email:</strong> privacy@localelectrician.in</li>
                                <li><strong>Address:</strong> Local Electrician HQ, India</li>
                            </ul>
                        </section>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4 justify-center">
                        <Link href="/">
                            <Button variant="outline" size="lg">
                                Back to Home
                            </Button>
                        </Link>
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
                            <Link href="/technician-terms-and-conditions" className="hover:text-white transition-colors">Technician T&C</Link>
                            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
