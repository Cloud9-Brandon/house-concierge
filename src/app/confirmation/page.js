'use client';

import Link from 'next/link';

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request received!</h1>

          <p className="text-gray-600 mb-6">
            We&apos;re finding you a vetted pro right now.
            We&apos;ll text you within an hour with their details, pricing, and availability.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-gray-700 mb-2">What happens next:</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2">
                <span className="text-brand-600 font-medium">1.</span>
                We match you with a trusted local expert
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600 font-medium">2.</span>
                You&apos;ll get a text with their info and estimated pricing
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600 font-medium">3.</span>
                Schedule directly with them at a time that works
              </li>
            </ol>
          </div>

          <Link
            href="/"
            className="inline-block text-brand-600 font-medium text-sm hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
