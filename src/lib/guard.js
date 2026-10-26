// Abuse and safety guards for /api/chat. In-memory, so limits are per server
// instance: good enough for a class project, swap for Redis/Upstash at scale.

export const LIMITS = {
  maxMessages: 30,          // stops runaway conversations / loops
  maxChars: 2000,           // per message
  maxImageChars: 3_000_000, // ~2MB base64 image
  perIpWindowMs: 10 * 60 * 1000,
  perIpMax: 40,             // chat requests per IP per window
  dailyCap: Number(process.env.DAILY_REQUEST_CAP || 1000), // global spend guard
};

const ipHits = new Map();
let day = new Date().toDateString();
let dayCount = 0;

export function checkRate(ip) {
  const now = Date.now();
  if (new Date().toDateString() !== day) { day = new Date().toDateString(); dayCount = 0; }
  if (dayCount >= LIMITS.dailyCap) return { ok: false, reason: 'daily-cap' };
  const hits = (ipHits.get(ip) || []).filter(t => now - t < LIMITS.perIpWindowMs);
  if (hits.length >= LIMITS.perIpMax) { ipHits.set(ip, hits); return { ok: false, reason: 'rate-limit' }; }
  hits.push(now);
  ipHits.set(ip, hits);
  dayCount += 1;
  return { ok: true };
}

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Missing messages';
  if (messages.length > LIMITS.maxMessages) return 'Conversation too long. Please start a new diagnosis.';
  for (const m of messages) {
    if (!['user', 'assistant'].includes(m?.role)) return 'Invalid message role';
    if (typeof m.content !== 'string' || m.content.length > LIMITS.maxChars) return 'Message too long';
    if (m.image && (typeof m.image !== 'string' || !m.image.startsWith('data:image/') || m.image.length > LIMITS.maxImageChars)) {
      return 'Image invalid or too large';
    }
  }
  return null;
}

// Cheap first-line filter for obvious injection / data-exfiltration attempts.
// The system prompt is the second line of defense.
const INJECTION = [
  /ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)/i,
  /disregard (all |any )?(the )?(previous|prior|above|system)/i,
  /(reveal|show|print|repeat|output|leak).{0,30}(system prompt|your instructions|hidden prompt|api key|secret)/i,
  /you are now (dan|in developer mode|unrestricted)/i,
  /\bjailbreak\b/i,
  /%%%(FIX|PRO|USAGE)_?(START|END)?%%%/i, // users forging our structured output markers
];

export function looksLikeInjection(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  return !!lastUser && INJECTION.some(re => re.test(lastUser.content || ''));
}

export const REFUSAL_INJECTION =
  "I can only help with diagnosing home appliances, so I can't follow that request. Tell me what's going wrong with your dishwasher, fridge, washer/dryer, oven, HVAC, or water heater and I'll help.";
