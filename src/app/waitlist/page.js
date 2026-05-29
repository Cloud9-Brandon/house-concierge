'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // MVP: log it. In production, save to database.
    console.log('Waitlist signup:', { email, zip, date: new Date().toISOString() });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">📍</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            We&apos;re coming to your area
          </h1>

          <p className="text-gray-600 mb-6">
            Pro matching is live in Austin, TX. Join the waitlist and we&apos;ll let you know when
            we launch in your area. In the meantime, our AI diagnosis works everywhere!
          </p>

          {submitted ? (
            <div>
              <p className="text-green-700 font-medium bg-green-50 px-6 py-3 rounded-lg mb-4">
                You&apos;re on the list!
              </p>
              <Link
                href="/diagnose"
                className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
              >
                Try AI Diagnosis →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <input
                type="text"
                placeholder="Your ZIP code"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <button
                type="submit"
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
              >
                Join the Waitlist
              </button>
            </form>
          )}

          <div className="mt-6">
            <Link href="/" className="text-brand-600 text-sm font-medium hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
