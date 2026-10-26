'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const APPLIANCE_OPTIONS = [
  'Dishwasher',
  'Refrigerator',
  'Washer & Dryer',
  'Oven & Range',
  'HVAC',
  'Water Heater',
  'Other',
];

const TIME_OPTIONS = [
  'As soon as possible',
  'Within a few days',
  'This week',
  'Flexible — whenever',
];

export default function GetAProPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    zip: '',
    appliance: '',
    issue: '',
    timePreference: '',
  });
  const [handoff, setHandoff] = useState('');
  useEffect(() => {
    try {
      const h = JSON.parse(sessionStorage.getItem('hc_handoff') || 'null');
      if (h) {
        setHandoff(h.summary || '');
        setForm(prev => ({
          ...prev,
          appliance: APPLIANCE_OPTIONS.includes(h.appliance) ? h.appliance : prev.appliance,
          issue: prev.issue || (h.summary || '').slice(0, 300),
        }));
      }
    } catch (e) { /* ignore */ }
  }, []);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zipError, setZipError] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
    if (field === 'zip') setZipError(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!/^\d{5}$/.test(form.zip)) errs.zip = 'Enter a 5-digit ZIP code';
    if (!form.appliance) errs.appliance = 'Pick an appliance';
    if (!form.issue.trim()) errs.issue = 'Describe the issue briefly';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, handoff }),
      });

      const data = await res.json();

      if (data.waitlist) {
        setZipError(true);
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        router.push('/confirmation');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link href="/diagnose" className="font-medium text-brand-700 text-sm">← Back to Diagnosis</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Get matched with a pro</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tell us about the job and we&apos;ll look for a local pro and text you, usually within a few hours (Austin pilot).
        </p>

        {zipError && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-orange-800 font-medium text-sm mb-1">
              We&apos;re not in your area yet
            </p>
            <p className="text-orange-700 text-sm mb-3">
              Pro matching is currently available in Austin, TX. The AI diagnosis works everywhere though!
            </p>
            <Link
              href="/waitlist"
              className="text-brand-600 text-sm font-medium hover:underline"
            >
              Join the waitlist for your area →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Appliance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Appliance</label>
            <div className="grid grid-cols-2 gap-2">
              {APPLIANCE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update('appliance', opt)}
                  className={`px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                    form.appliance === opt
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.appliance && <p className="text-red-500 text-xs mt-1">{errors.appliance}</p>}
          </div>

          {/* Issue description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s the issue?</label>
            <textarea
              value={form.issue}
              onChange={(e) => update('issue', e.target.value)}
              rows={3}
              placeholder="E.g., Dishwasher won't drain, there's standing water at the bottom after every cycle..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-none"
            />
            {errors.issue && <p className="text-red-500 text-xs mt-1">{errors.issue}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="First name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="(512) 555-0123"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* ZIP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP code</label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="78701"
              maxLength={5}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
            />
            {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
          </div>

          {/* Time preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">When do you need this done?</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update('timePreference', opt)}
                  className={`px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                    form.timePreference === opt
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Find Me a Pro →'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            We&apos;ll text you, usually within a few hours. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}
