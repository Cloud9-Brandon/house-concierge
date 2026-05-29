'use client';

import { useState } from 'react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Describe the Problem',
    desc: 'Tell our AI what\'s going on — weird noises, leaks, error codes, anything.',
  },
  {
    icon: '🛠️',
    title: 'Get a Diagnosis',
    desc: 'Our AI walks you through targeted questions and pinpoints the most likely issue.',
  },
  {
    icon: '✅',
    title: 'Fix It or Find a Pro',
    desc: 'Get step-by-step DIY instructions, or we\'ll match you with a vetted local pro.',
  },
];

const APPLIANCES = [
  'Dishwasher', 'Refrigerator', 'Washer & Dryer',
  'Oven & Range', 'HVAC', 'Water Heater',
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = async (e) => {
    e.preventDefault();
    // For MVP: just store in localStorage as a simple waitlist
    // In production, this would go to a database
    const existing = JSON.parse(localStorage?.getItem?.('waitlist') || '[]');
    existing.push({ email, date: new Date().toISOString() });
    localStorage?.setItem?.('waitlist', JSON.stringify(existing));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg text-brand-700">House Concierge</span>
          <Link
            href="/diagnose"
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Start Diagnosing
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Broken appliance?
            <br />
            <span className="text-brand-600">Fixed in minutes.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            Our AI diagnoses the problem and walks you through the fix.
            If it needs a pro, we&apos;ll match you with a vetted local expert.
          </p>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
          >
            What&apos;s Broken?
            <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-4 text-sm text-gray-400">Free to use — no account needed</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-gray-900">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported appliances */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">What we can help with</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {APPLIANCES.map((a) => (
              <Link
                key={a}
                href="/diagnose"
                className="px-5 py-3 bg-brand-50 text-brand-700 rounded-full font-medium text-sm hover:bg-brand-100 transition-colors"
              >
                {a}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist / CTA */}
      <section className="py-16 px-4 bg-brand-700">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Not in Austin yet?</h2>
          <p className="text-brand-200 mb-6">
            AI diagnosis works everywhere. Pro matching is launching in Austin first — join the waitlist and we&apos;ll let you know when we&apos;re in your area.
          </p>
          {submitted ? (
            <p className="text-white font-medium bg-brand-600 inline-block px-6 py-3 rounded-lg">
              You&apos;re on the list!
            </p>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <button
                type="submit"
                className="bg-accent-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-accent-600 transition-colors whitespace-nowrap"
              >
                Join Waitlist
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} House Concierge. Austin, TX.</p>
      </footer>
    </div>
  );
}
