import OpenAI from 'openai';
import { getSystemPrompt } from '@/lib/prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { messages, category } = await req.json();

    if (!messages || !category) {
      return Response.json({ error: 'Missing messages or category' }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(category);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 600,
      stream: true,
    });

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
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
