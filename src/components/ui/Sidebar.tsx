'use client';

import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const companyNorms = [
    {
      icon: '🛡️',
      title: 'Trust First',
      description: 'Every electrician is verified with complete KYC documentation'
    },
    {
      icon: '⚡',
      title: 'Quick Service',
      description: 'Get professional help within 60 seconds of booking'
    },
    {
      icon: '💰',
      title: 'Fair Pricing',
      description: 'Transparent quotes with no hidden charges ever'
    },
    {
      icon: '✓',
      title: 'Quality Guaranteed',
      description: 'All work comes with satisfaction guarantee'
    },
    {
      icon: '🕐',
      title: '24/7 Support',
      description: 'Round-the-clock customer support for your peace of mind'
    },
    {
      icon: '🤝',
      title: 'Community First',
      description: 'Building trust within local communities across India'
    }
  ];

  const trustQuotes = [
    '"Trust is earned through consistent, honest service and we take that responsibility seriously."',
    '"Your safety and satisfaction are our only priorities. Every electrician is background-verified."',
    '"We believe in transparency. Know exactly what you\'re paying for before the work begins."',
    '"Our electricians are trusted by over 10,000 families in their neighborhoods."',
    '"Building relationships that last, one satisfied customer at a time."',
    '"When you book with us, you\'re not just hiring an electrician, you\'re joining a verified community."'
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-96 bg-gradient-to-br from-gray-900 via-gray-900 to-black z-50 transform transition-transform duration-400 ease-in-out overflow-y-auto sidebar-scroll border-r border-cyan-500/20 ${isOpen ? 'translate-x-0 animate-slide-in-left' : '-translate-x-full'
          }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-300 glow-blue hover:animate-pulse-glow z-10"
        >
          <svg
            className="w-6 h-6 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* About Us Section at Top */}
        <div className="pt-6 px-6 pb-8 border-b border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center animate-pulse-glow">
              <span className="text-white text-2xl">⚡</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">Local Electrician</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            We are India's most trusted platform connecting verified electricians with customers. Our commitment to trust, transparency, and quality service sets us apart.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-cyan-500/10 rounded-lg p-3 text-center glow-blue">
              <p className="text-cyan-400 font-bold text-lg">10K+</p>
              <p className="text-gray-400 text-xs">Customers</p>
            </div>
            <div className="bg-pink-500/10 rounded-lg p-3 text-center glow-pink">
              <p className="text-pink-400 font-bold text-lg">500+</p>
              <p className="text-gray-400 text-xs">Verified</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center glow-green">
              <p className="text-green-400 font-bold text-lg">4.9★</p>
              <p className="text-gray-400 text-xs">Rating</p>
            </div>
          </div>
        </div>

        {/* Company Norms Section */}
        <div className="px-6 py-8">
          <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Our Core Values</h2>

          <div className="space-y-4">
            {companyNorms.map((norm, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-all duration-300 border border-cyan-500/10 hover:border-cyan-500/30 hover:glow-blue group"
              >
                <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">{norm.icon}</div>
                <div>
                  <h3 className="font-semibold text-cyan-300 group-hover:text-cyan-200 transition-colors">{norm.title}</h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{norm.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Quotes Section */}
        <div className="px-6 py-8 border-t border-cyan-500/20 bg-gradient-to-b from-pink-500/5 to-transparent">
          <h2 className="text-lg font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent mb-6">Why Trust Us?</h2>

          <div className="space-y-3">
            {trustQuotes.map((quote, index) => (
              <div
                key={index}
                className="bg-gray-800/30 rounded-lg p-4 border-l-4 border-pink-500 hover:border-pink-400 hover:bg-gray-800/50 transition-all duration-300 glow-pink hover:glow-pink"
              >
                <p className="text-sm text-gray-300 italic hover:text-pink-200 transition-colors">{quote}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Section */}
        <div className="px-6 py-8 border-t border-cyan-500/20 bg-gradient-to-b from-green-500/5 to-transparent">
          <h2 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">For Technicians</h2>
          <p className="text-sm text-gray-400 mb-4">
            Join our network of verified electricians and grow your business
          </p>
          <a
            href="/electrician"
            className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-center mb-3 glow-green hover:animate-glow-green transform hover:scale-105"
          >
            Register as Technician
          </a>
          <a
            href="/technician-terms-and-conditions"
            className="block w-full border-2 border-green-500 text-green-400 py-3 rounded-lg font-semibold hover:bg-green-500/10 transition-all duration-300 text-center hover:glow-green"
          >
            Technician T&C
          </a>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-6 border-t border-cyan-500/20">
          <button
            onClick={onClose}
            className="w-full border-2 border-cyan-500 text-cyan-400 py-3 rounded-lg font-semibold hover:bg-cyan-500/10 transition-all duration-300 hover:glow-blue transform hover:scale-105"
          >
            Close Sidebar
          </button>
        </div>
      </div>
    </>
  );
}
