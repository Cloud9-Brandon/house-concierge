# House Concierge

**Runs locally** (see below). Repo: https://github.com/Cloud9-Brandon/house-concierge

AI diagnosis for broken home appliances (dishwasher, fridge, washer/dryer, oven, HVAC, water heater). An agent walks you through targeted questions and photo-based checks, proposes DIY fixes (with YouTube links), and escalates to a vetted local pro (Austin, TX pilot) when DIY is unsafe or has failed.

## Run locally (about 3 minutes)

Requires Node 18+.

```bash
git clone https://github.com/Cloud9-Brandon/house-concierge
cd house-concierge
npm install
cp .env.example .env     # then fill in a key (see below)
npm run dev              # http://localhost:3000
```

### Keys
The app looks for `.env` in the repo folder first, then **one folder above the repo**. It needs one of:
- `PORTKEY_API_KEY` — course key, uses `gpt-6-luna` (preferred if set)
- `OPENAI_API_KEY` — own key, uses `gpt-4o-mini` (override with `OPENAI_MODEL`)

`RESEND_API_KEY` / `NOTIFY_EMAIL` are optional: without them, pro requests are printed to the server console instead of emailed.

## Safety and cost controls
- Input caps: ≤30 messages, ≤2000 chars each, ≤~2MB image; unknown categories rejected
- Per-IP rate limit (40 requests / 10 min) and a global daily request cap (`DAILY_REQUEST_CAP`)
- Prompt-injection / prompt-leak filter plus system-prompt scope and safety rules (gas, electrical, refrigerant → stop and call a pro)
- `max_tokens` 700 per reply; HTML-escaped email fields
- Token usage per reply is shown under each AI message and logged to the server console as `[usage]`

## Agent design
- **Safety triage** (deterministic, runs first): flags gas, electrical fire, water near power, and carbon monoxide before the model sees the message and forces an evacuate/call-a-pro response.
- **Diagnostic agent** (`gpt-6-luna`, tool-calling loop, max 3 tool rounds per reply) with two tools: `lookup_error_code` (reference table, never guesses a code) and `estimate_repair_cost` (DIY vs pro vs replacement ranges).
- **Pro handoff**: when a pro is needed the agent writes a short diagnosis summary that is prefilled into the pro request form and included in the notification. Pro matching is manual during the Austin pilot.

## Stack
Next.js 14, Tailwind, OpenAI SDK (via Portkey or OpenAI), Resend.
