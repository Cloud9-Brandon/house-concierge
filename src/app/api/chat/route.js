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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // supports vision and is cheap
      messages: [
        { role: 'system', content: systemPrompt },
        ...normalizedMessages,
      ],
      temperature: 0.7,
      max_tokens: 700,
      stream: true,
    });

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
