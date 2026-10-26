import { getSystemPrompt, APPLIANCE_CATEGORIES } from '@/lib/prompts';
import { getLLM } from '@/lib/llm';
import { TOOL_DEFS, runTool, safetyTriage } from '@/lib/tools';

import { checkRate, validateMessages, looksLikeInjection, REFUSAL_INJECTION } from '@/lib/guard';

const MAX_TOOL_ROUNDS = 3; // hard cap on tool-calling rounds per reply

const textResponse = (text, status = 200) =>
  new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export async function POST(req) {
  try {
    const { messages, category } = await req.json();

    if (!messages || !category) {
      return Response.json({ error: 'Missing messages or category' }, { status: 400 });
    }

    const validCats = Array.isArray(APPLIANCE_CATEGORIES) ? APPLIANCE_CATEGORIES.map(c => c.id) : null;
    if (validCats && !validCats.includes(category)) {
      return Response.json({ error: 'Unknown category' }, { status: 400 });
    }
    const invalid = validateMessages(messages);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });

    const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
    const rate = checkRate(ip);
    if (!rate.ok) {
      console.warn('[guard] blocked', rate.reason, ip);
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    if (looksLikeInjection(messages)) {
      console.warn('[guard] prompt-injection attempt blocked');
      return textResponse(REFUSAL_INJECTION);
    }

    let systemPrompt = getSystemPrompt(category);

    // Step 1 (triage): deterministic hazard check on the latest user message.
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const triage = safetyTriage(lastUser?.content);
    const events = [];
    if (triage) {
      systemPrompt += `\n\n${triage.instruction}`;
      events.push({ tool: 'safety_triage', detail: triage.hazard });
      console.warn('[triage] hazard detected:', triage.hazard);
    }

    // Normalize messages: text-only messages get content as string,
    // messages with images get content as an array (OpenAI vision format)
    const convo = messages.map(m => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || 'What do you see in this photo?' },
            { type: 'image_url', image_url: { url: m.image, detail: 'auto' } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });
    const history = [{ role: 'system', content: systemPrompt }, ...convo];

    const { client, model, provider } = getLLM();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = t => controller.enqueue(encoder.encode(t));
        const total = { input: 0, cached: 0, output: 0 };
        try {
          for (const ev of events) send(`%%%TOOL%%%${JSON.stringify(ev)}\n`);

          // Step 2 (diagnostician): tool-calling loop, hard-capped to prevent runaway loops.
          for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            const useTools = round < MAX_TOOL_ROUNDS;
            const response = await client.chat.completions.create({
              model,
              messages: history,
              ...(useTools ? { tools: TOOL_DEFS } : {}),
              stream: true,
              stream_options: { include_usage: true },
              // gpt-6-luna (via Portkey) rejects max_tokens and a custom temperature
              ...(provider === 'portkey'
                ? { max_completion_tokens: 1500, reasoning_effort: 'none' }
                : { temperature: 0.7, max_tokens: 700 }),
            });

            let content = '';
            const calls = {};
            for await (const chunk of response) {
              if (chunk.usage) {
                total.input += chunk.usage.prompt_tokens || 0;
                total.cached += chunk.usage.prompt_tokens_details?.cached_tokens || 0;
                total.output += chunk.usage.completion_tokens || 0;
              }
              const delta = chunk.choices?.[0]?.delta;
              if (!delta) continue;
              if (delta.content) { content += delta.content; send(delta.content); }
              for (const tc of delta.tool_calls || []) {
                const c = (calls[tc.index] ||= { id: '', name: '', args: '' });
                if (tc.id) c.id = tc.id;
                if (tc.function?.name) c.name += tc.function.name;
                if (tc.function?.arguments) c.args += tc.function.arguments;
              }
            }

            const toolCalls = Object.values(calls);
            if (toolCalls.length === 0) break;

            // This round ended in a tool call: tell the client to discard any
            // preamble text already streamed, so the final answer isn't duplicated.
            if (content) send('%%%RESET%%%');

            history.push({
              role: 'assistant',
              content: content || null,
              tool_calls: toolCalls.map(c => ({
                id: c.id, type: 'function', function: { name: c.name, arguments: c.args },
              })),
            });
            for (const c of toolCalls) {
              let args = {};
              try { args = JSON.parse(c.args || '{}'); } catch (e) { /* ignore */ }
              const result = runTool(c.name, args, category);
              console.log('[tool]', c.name, JSON.stringify(args), '->', JSON.stringify(result).slice(0, 200));
              send(`%%%TOOL%%%${JSON.stringify({ tool: c.name, detail: args.code || args.brand || '', found: result.found })}\n`);
              history.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
            }
          }

          const rec = { model, ...total };
          console.log('[usage]', JSON.stringify({ provider, category, ...rec }));
          send(`\n%%%USAGE%%%${JSON.stringify(rec)}`);
          controller.close();
        } catch (err) {
          console.error('Chat stream error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
