'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APPLIANCE_CATEGORIES } from '@/lib/prompts';

// Parse fix/pro blocks from AI response
function parseResponse(text) {
  const fixMatch = text.match(/%%%FIX_START%%%([\s\S]*?)%%%FIX_END%%%/);
  const proMatch = text.match(/%%%PRO_START%%%([\s\S]*?)%%%PRO_END%%%/);

  let fix = null;
  let pro = null;
  let cleanText = text;

  if (fixMatch) {
    try {
      fix = JSON.parse(fixMatch[1].trim());
      cleanText = text.replace(fixMatch[0], '').trim();
    } catch (e) { /* ignore parse errors */ }
  }

  if (proMatch) {
    try {
      pro = JSON.parse(proMatch[1].trim());
      cleanText = text.replace(proMatch[0], '').trim();
    } catch (e) { /* ignore parse errors */ }
  }

  return { cleanText, fix, pro };
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md w-fit">
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
    </div>
  );
}

function FixCard({ fix }) {
  const [completed, setCompleted] = useState(null); // null, true, false

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-600 text-lg">✅</span>
        <h3 className="font-semibold text-green-900">{fix.title}</h3>
      </div>

      <div className="flex gap-3 text-xs text-green-700 mb-4">
        {fix.time && <span className="bg-green-100 px-2 py-1 rounded-full">⏱ {fix.time}</span>}
        {fix.difficulty && <span className="bg-green-100 px-2 py-1 rounded-full">📊 {fix.difficulty}</span>}
      </div>

      {fix.tools && fix.tools.length > 0 && (
        <p className="text-sm text-green-800 mb-3">
          <span className="font-medium">Tools needed:</span> {fix.tools.join(', ')}
        </p>
      )}

      <ol className="space-y-2 mb-5">
        {fix.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-green-900">
            <span className="flex-shrink-0 w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-800">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      {completed === null ? (
        <div className="border-t border-green-200 pt-4">
          <p className="text-sm font-medium text-green-900 mb-3">Did this solve the problem?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCompleted(true)}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Yes, fixed!
            </button>
            <button
              onClick={() => setCompleted(false)}
              className="flex-1 py-2 bg-white text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
            >
              No, still broken
            </button>
          </div>
        </div>
      ) : completed ? (
        <div className="border-t border-green-200 pt-4 text-center">
          <p className="text-green-700 font-medium">Great — glad that worked! 🎉</p>
        </div>
      ) : (
        <div className="border-t border-green-200 pt-4 text-center">
          <p className="text-green-900 text-sm mb-3">No worries — let&apos;s get you a pro.</p>
          <Link
            href="/get-a-pro"
            className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Find a Pro →
          </Link>
        </div>
      )}
    </div>
  );
}

function ProCard({ pro }) {
  const router = useRouter();
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mt-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-orange-600 text-lg">🔧</span>
        <h3 className="font-semibold text-orange-900">This one needs a professional</h3>
      </div>

      <p className="text-sm text-orange-800 mb-3">{pro.reason}</p>

      <div className="flex gap-3 text-xs text-orange-700 mb-4">
        {pro.urgency && (
          <span className={`px-2 py-1 rounded-full ${
            pro.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
            pro.urgency === 'soon' ? 'bg-orange-100' : 'bg-orange-100'
          }`}>
            {pro.urgency === 'urgent' ? '🚨 Urgent' : pro.urgency === 'soon' ? '⚡ Soon' : '📅 Routine'}
          </span>
        )}
        {pro.estimated_cost && (
          <span className="bg-orange-100 px-2 py-1 rounded-full">💰 {pro.estimated_cost}</span>
        )}
      </div>

      <button
        onClick={() => router.push('/get-a-pro')}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
      >
        Get Matched with a Pro →
      </button>
    </div>
  );
}

export default function DiagnosePage() {
  const [category, setCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fix, setFix] = useState(null);
  const [pro, setPro] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when category selected
  useEffect(() => {
    if (category) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [category]);

  const selectCategory = async (cat) => {
    setCategory(cat);
    // Send initial greeting
    const greeting = { role: 'assistant', content: `Hey! I can help with your ${cat.name.toLowerCase()} issue. What's going on? Describe what you're seeing — noises, leaks, error codes, anything that seems off.` };
    setMessages([greeting]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send only user/assistant messages (not system)
      const chatHistory = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, category: category.id }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      // Stream the response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      // Add placeholder assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullText += decoder.decode(value, { stream: true });

        // Update the last message with streamed text (hide the JSON blocks while streaming)
        const displayText = fullText
          .replace(/%%%FIX_START%%%[\s\S]*?(%%%FIX_END%%%)?/, '')
          .replace(/%%%PRO_START%%%[\s\S]*?(%%%PRO_END%%%)?/, '')
          .trim();

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: displayText };
          return updated;
        });
      }

      // Parse the full response for fix/pro cards
      const parsed = parseResponse(fullText);
      if (parsed.fix) setFix(parsed.fix);
      if (parsed.pro) setPro(parsed.pro);

      // Update final message with clean text
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: parsed.cleanText };
        return updated;
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Appliance picker view
  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <Link href="/" className="font-bold text-brand-700">← House Concierge</Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">What&apos;s broken?</h1>
          <p className="text-gray-500 mb-6">Pick the appliance and we&apos;ll start diagnosing.</p>

          <div className="grid grid-cols-2 gap-3">
            {APPLIANCE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat)}
                className="flex flex-col items-center gap-2 p-5 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-center group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="font-medium text-gray-900">{cat.name}</span>
                <span className="text-xs text-gray-400">{cat.desc}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-500 text-center">
              Don&apos;t see your appliance? <Link href="/get-a-pro" className="text-brand-600 font-medium hover:underline">Skip to getting a pro →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <nav className="flex-shrink-0 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => { setCategory(null); setMessages([]); setFix(null); setPro(null); }}
            className="font-medium text-brand-700 text-sm"
          >
            ← Back
          </button>
          <span className="font-medium text-gray-900 flex items-center gap-2">
            <span>{category.icon}</span> {category.name}
          </span>
          <div className="w-12" /> {/* spacer */}
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}

          {/* Fix card */}
          {fix && <FixCard fix={fix} />}

          {/* Pro recommendation card */}
          {pro && <ProCard pro={pro} />}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      {!fix && !pro && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what's happening..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent disabled:bg-gray-50"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
