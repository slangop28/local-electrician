'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, OTPLoginModal, Sidebar, ProfileDropdown } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, userProfile } = useAuth();

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6 text-gray-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Local Electrician</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
              >
                <span>ℹ️</span>
                About Us
              </button>
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-2"
                >
                  <Button variant="primary" size="sm">Login / Signup</Button>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-3 py-1.5"
                >
                  <Button variant="primary" size="sm">Login</Button>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden gradient-mesh">
        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-700">Trusted by 10,000+ customers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                <span className="text-glow">Electrician near you,</span>{' '}
                <span className="text-gradient">in minutes</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Connect with verified local electricians instantly. Fast, reliable, and affordable electrical services at your doorstep.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center lg:items-start gap-4 w-full">
                {isAuthenticated && userProfile?.userType === 'customer' ? (
                  <Link href="/app" className="w-full lg:w-auto group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 to-cyan-400/40 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse-glow" />
                      <Button size="lg" className="relative w-full px-12 py-6 text-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-cyan-500 border border-cyan-300/50 hover:border-cyan-200/80 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 animate-pulse">
                        <span className="mr-3">📍</span>
                        Find Electrician Near Me
                      </Button>
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="w-full lg:w-auto px-12 py-6 text-xl font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border-2 border-cyan-400/50 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-cyan-500/20"
                  >
                    <span>⚡</span>
                    Login to Find Electrician
                  </button>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-col items-center lg:items-start gap-6 mt-10">
                <div className="flex items-center justify-center lg:justify-start gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">KYC Verified</p>
                      <p className="text-xs text-gray-500">All electricians</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-cyan-600">⚡</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">60 Seconds</p>
                      <p className="text-xs text-gray-500">Quick booking</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Hero illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Main card */}
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl p-8 animate-float">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">👷</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">Rajesh Kumar</h3>
                        <p className="text-cyan-600">Verified Electrician</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-gray-600">4.9 (128 reviews)</span>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-6">
                      <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">Wiring</span>
                      <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">Fans</span>
                      <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">MCB</span>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500">Distance</span>
                        <span className="font-bold text-gray-900">1.2 km away</span>
                      </div>
                      <button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-xl font-bold hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/30">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 animate-pulse-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Booking Confirmed!</p>
                      <p className="text-sm text-gray-500">Arriving in 30 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Local Electrician?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We connect you with the best electricians in your area with guaranteed quality and trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Speed */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Book an electrician in under 60 seconds. Our platform connects you instantly with available professionals nearby.
              </p>
            </div>

            {/* Trust */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Verified</h3>
              <p className="text-gray-600">
                Every electrician undergoes strict KYC verification with Aadhaar and PAN. Your safety is our priority.
              </p>
            </div>

            {/* Savings */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fair Pricing</h3>
              <p className="text-gray-600">
                No hidden charges. Get transparent quotes upfront and pay only for what you need. Save up to 30%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get your electrical issues fixed in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Share Location', desc: 'Enable GPS or enter your address to find electricians near you.', icon: '📍' },
              { step: '02', title: 'Choose & Book', desc: 'Select a verified electrician based on ratings and book instantly.', icon: '📱' },
              { step: '03', title: 'Get Service', desc: 'Electrician arrives at your doorstep. Pay after the job is done.', icon: '✅' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-cyan-100 mb-4">{item.step}</div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-gray-600">{item.desc}</p>

                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/3 h-0.5 bg-cyan-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            {isAuthenticated
              ? `Welcome back, ${userProfile?.name?.split(' ')[0] || userProfile?.username}!`
              : 'Ready to Get Started?'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {isAuthenticated
              ? userProfile?.userType === 'customer'
                ? 'Find and book verified electricians in your area.'
                : 'Manage your bookings and grow your business.'
              : 'Join thousands of satisfied customers and electricians on our platform.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated && userProfile?.userType === 'customer' ? (
              <Link href="/app">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Find Electrician Near Me
                </Button>
              </Link>
            ) : !isAuthenticated ? (
              <>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Login / Signup
                  </Button>
                </button>
              </>
            ) : null}

            {isAuthenticated && userProfile?.userType === 'electrician' && userProfile?.electricianStatus === 'VERIFIED' && (
              <Link href="/electrician-dashboard">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            )}

            {/* Register as Electrician button for logged-in customers */}
            {isAuthenticated && userProfile?.userType === 'customer' && (
              <Link href="/electrician">
                <button className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 border-2 border-green-400/50 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-green-500/20">
                  <span>👷</span>
                  Register as Electrician
                </button>
              </Link>
            )}
          </div>

          <div className="mt-10 flex items-center justify-center gap-8 text-blue-100">
            <div>
              <p className="text-2xl font-bold text-white">10,000+</p>
              <p className="text-sm">Happy Customers</p>
            </div>
            <div className="w-px h-10 bg-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-sm">Verified Electricians</p>
            </div>
            <div className="w-px h-10 bg-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">50+</p>
              <p className="text-sm">Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <span className="font-bold text-xl">Local Electrician</span>
            </div>

            <div className="flex items-center gap-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>

            <p className="text-gray-500 text-sm">
              © 2026 localelectrician.in. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* OTP Login Modal */}
      <OTPLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </main >
  );
}
