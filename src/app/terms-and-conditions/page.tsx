import Link from 'next/link';
import { Button } from '@/components/ui';

export default function TermsAndConditions() {
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
              Terms and Conditions
            </h1>
            <p className="text-gray-600">
              Last updated: January 30, 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                Welcome to Local Electrician ("Company", "we", "our", or "us"). These Terms and Conditions ("Terms") govern your access to and use of our website, mobile application, and all services provided through these platforms (collectively, the "Service").
              </p>
              <p>
                By accessing and using Local Electrician, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use our Service. We reserve the right to modify these Terms at any time, and your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p>
                Local Electrician is a digital platform that connects customers seeking electrical services with verified and qualified electricians (referred to as "Service Providers"). We operate as a marketplace facilitating these connections and do not directly provide electrical services.
              </p>
              <p>
                The platform allows customers ("Users", "Customers") to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Search for electricians in their area</li>
                <li>View electrician profiles, qualifications, and customer reviews</li>
                <li>Request and book electrical services</li>
                <li>Make payments for services</li>
                <li>Rate and review completed services</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p>
                To use Local Electrician, you must create an account by providing accurate, complete, and current information. You must:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide a valid mobile number</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate your account if you provide false information or violate these Terms.
              </p>
            </section>

            {/* Verification and Trust */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Verification Process</h2>
              <p>
                <strong>Our Commitment to Trust:</strong> All Service Providers on our platform undergo a rigorous KYC (Know Your Customer) verification process, including:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Aadhaar verification for identity confirmation</li>
                <li>PAN verification for tax compliance</li>
                <li>Background and criminal record checks</li>
                <li>Experience and qualification verification</li>
                <li>Customer reference verification</li>
              </ul>
              <p>
                However, verification does not guarantee the quality of services. Customers are responsible for reviewing electrician profiles, ratings, and customer feedback before booking.
              </p>
            </section>

            {/* Service Booking */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Booking and Acceptance</h2>
              <p>
                When you request a service through the platform:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your request is sent to available Service Providers</li>
                <li>Service Providers may accept or decline your request</li>
                <li>Once accepted, a confirmed booking is established</li>
                <li>You will receive details about the Service Provider and estimated arrival time</li>
                <li>Failure to confirm or cancel a booking may result in cancellation charges</li>
              </ul>
              <p>
                Service Providers are independent contractors, not employees of Local Electrician. We do not control the manner in which services are performed, and Service Providers retain the right to decline any job.
              </p>
            </section>

            {/* Payments */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payments and Pricing</h2>
              <p>
                <strong>Transparency is Our Priority:</strong> 
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>All pricing is provided upfront before service commencement</li>
                <li>Prices are determined by Service Providers with platform approval</li>
                <li>Additional charges may apply for overtime, emergency services, or additional work discovered on-site</li>
                <li>We accept digital payments only (credit cards, debit cards, digital wallets, bank transfers)</li>
                <li>No cash payments are required through the platform (though Service Providers may offer this option independently)</li>
                <li>Refunds for cancelled services will be processed within 5-7 business days</li>
              </ul>
              <p>
                By making a payment, you authorize us and our payment partners to charge your selected payment method.
              </p>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Responsibilities</h2>
              <p>
                As a customer using Local Electrician, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate information about your electrical issues</li>
                <li>Be available at the scheduled time for service</li>
                <li>Provide safe access to your premises</li>
                <li>Not engage in any illegal activities</li>
                <li>Treat Service Providers with respect and dignity</li>
                <li>Not discriminate against Service Providers</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not use the platform for fraudulent or deceptive purposes</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p>
                <strong>Important Notice:</strong> Local Electrician acts as a marketplace facilitator only. We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Quality, safety, or legality of services provided by Service Providers</li>
                <li>Any damage to property or personal injury resulting from services</li>
                <li>Non-performance or delay in service completion</li>
                <li>Disputes between customers and Service Providers</li>
                <li>Loss of data or unauthorized access to your account</li>
                <li>Technical disruptions or service interruptions</li>
              </ul>
              <p>
                In no event shall Local Electrician be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Dispute Resolution</h2>
              <p>
                In case of disputes between customers and Service Providers:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Both parties should attempt to resolve issues directly first</li>
                <li>If unresolved, you may file a complaint through the platform</li>
                <li>Our customer support team will investigate and mediate</li>
                <li>We reserve the right to refund customers or compensate them for proven service failures</li>
                <li>All disputes are subject to arbitration under Indian arbitration law</li>
              </ul>
            </section>

            {/* Cancellation Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cancellation Policy</h2>
              <p>
                <strong>For Customers:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Free cancellation up to 30 minutes before scheduled arrival</li>
                <li>50% charge if cancelled between 30 minutes and 2 hours before arrival</li>
                <li>Full charge if cancelled less than 30 minutes before arrival or after the Service Provider has started travel</li>
              </ul>
              <p>
                <strong>For Service Providers:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Service Providers may cancel only in emergencies with proper notification</li>
                <li>Repeated cancellations may result in account suspension</li>
              </ul>
            </section>

            {/* Insurance and Warranty */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Insurance and Warranty</h2>
              <p>
                Local Electrician does not provide insurance coverage for services. Customers are encouraged to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Verify that Service Providers have appropriate insurance</li>
                <li>Obtain written guarantees on work performed</li>
                <li>Document the condition of their property before and after service</li>
              </ul>
              <p>
                Service Providers are responsible for providing warranties on their work as per the terms they agree upon with customers.
              </p>
            </section>

            {/* Reviews and Ratings */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Reviews and Ratings</h2>
              <p>
                Customers and Service Providers can rate and review each other. By posting reviews, you agree that:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your review is honest and based on actual experience</li>
                <li>You will not post false, defamatory, or abusive content</li>
                <li>You will not post reviews to manipulate ratings unfairly</li>
                <li>We reserve the right to remove reviews that violate these terms</li>
                <li>Repeated false reviews may result in account suspension</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Intellectual Property Rights</h2>
              <p>
                All content on the Local Electrician platform, including logos, text, graphics, and code, is owned by or licensed to Local Electrician. You may not reproduce, distribute, or transmit this content without our explicit permission.
              </p>
            </section>

            {/* Data Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Data Privacy and Protection</h2>
              <p>
                We take your data privacy seriously. Please refer to our Privacy Policy for detailed information about how we collect, use, and protect your personal information. By using our Service, you consent to our data practices as outlined in the Privacy Policy.
              </p>
              <p>
                Your personal data is protected under the Information Technology Act, 2000, and we comply with all applicable data protection laws.
              </p>
            </section>

            {/* Prohibited Activities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Prohibited Activities</h2>
              <p>
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Harass, threaten, or abuse Service Providers or other users</li>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Attempt to bypass payment or manipulate pricing</li>
                <li>Share your account credentials with others</li>
                <li>Post obscene, defamatory, or hateful content</li>
                <li>Attempt to hack or interfere with platform security</li>
                <li>Use the platform for illegal activities</li>
                <li>Discriminate based on religion, caste, gender, or other protected characteristics</li>
              </ul>
              <p>
                Violation of these terms may result in immediate account suspension and legal action.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at any time if you:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violate these Terms and Conditions</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Repeatedly file false complaints or reviews</li>
                <li>Harass or abuse other users or Service Providers</li>
                <li>Fail to pay for services rendered</li>
              </ul>
              <p>
                Upon termination, your access to the platform will be immediately revoked.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Governing Law</h2>
              <p>
                These Terms and Conditions are governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. All disputes shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding these Terms and Conditions, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> support@localelectrician.in</li>
                <li><strong>Phone:</strong> +91-XXXX-XXXX-XXX</li>
                <li><strong>Address:</strong> Local Electrician, India</li>
              </ul>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">20. Entire Agreement</h2>
              <p>
                These Terms and Conditions constitute the entire agreement between you and Local Electrician regarding your use of the Service. They supersede all prior agreements, understandings, and communications, whether written or oral.
              </p>
            </section>
          </div>

          {/* Agreement Checkbox */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 mt-1 rounded border-gray-300"
              />
              <span>
                <p className="font-medium text-gray-900">
                  I agree to the Terms and Conditions
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  By checking this box, you confirm that you have read and agree to be bound by these Terms and Conditions
                </p>
              </span>
            </label>
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
              <Link href="/technician-terms-and-conditions" className="hover:text-white transition-colors">Technician T&C</Link>
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
