import { getSystemPrompt, APPLIANCE_CATEGORIES } from '@/lib/prompts';
import { getLLM } from '@/lib/llm';
import { checkRate, validateMessages, looksLikeInjection, REFUSAL_INJECTION } from '@/lib/guard';

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

    const systemPrompt = getSystemPrompt(category);

    // Normalize messages — text-only messages get content as string,
    // messages with images get content as an array (OpenAI vision format)
    const normalizedMessages = messages.map(m => {
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

    const { client, model, provider } = getLLM();
    const response = await client.chat.completions.create({
      model,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: systemPrompt },
        ...normalizedMessages,
      ],
      // gpt-6-luna (via Portkey) rejects max_tokens and a custom temperature
      ...(provider === 'portkey'
        ? { max_completion_tokens: 1500 }
        : { temperature: 0.7, max_tokens: 700 }),
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let usage = null;
          for await (const chunk of response) {
            if (chunk.usage) usage = chunk.usage;
            const text = chunk.choices?.[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          if (usage) {
            const rec = {
              model,
              input: usage.prompt_tokens,
              cached: usage.prompt_tokens_details?.cached_tokens || 0,
              output: usage.completion_tokens,
            };
            console.log('[usage]', JSON.stringify({ provider, category, ...rec }));
            controller.enqueue(encoder.encode(`\n%%%USAGE%%%${JSON.stringify(rec)}`));
          }
          controller.close();
        } catch (err) {
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
