import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Look for keys in the repo's own .env first (Next.js loads that itself),
// then in the folder one level above the repo.
function loadParentEnv() {
  for (const file of ['.env', '.env.local']) {
    const p = path.resolve(process.cwd(), '..', file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

let cached;
export function getLLM() {
  if (cached) return cached;
  if (!process.env.PORTKEY_API_KEY && !process.env.OPENAI_API_KEY) loadParentEnv();

  if (process.env.PORTKEY_API_KEY) {
    cached = {
      provider: 'portkey',
      model: process.env.PORTKEY_MODEL || 'gpt-6-luna',
      client: new OpenAI({
        apiKey: 'portkey', // real auth is the header below
        baseURL: process.env.PORTKEY_BASE_URL || 'https://api.portkey.ai/v1',
        defaultHeaders: {
          'x-portkey-api-key': process.env.PORTKEY_API_KEY,
          'x-portkey-provider': process.env.PORTKEY_PROVIDER || 'openai',
        },
      }),
    };
  } else if (process.env.OPENAI_API_KEY) {
    cached = {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    };
  } else {
    throw new Error('Set PORTKEY_API_KEY or OPENAI_API_KEY (see .env.example)');
  }
  return cached;
}
