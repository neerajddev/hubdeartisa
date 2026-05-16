import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content || content.trim().length < 20) {
      return NextResponse.json({ error: 'No content provided.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured.' }, { status: 503 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const result = await model.generateContent(
      `Summarize this architectural visualization article in 2 concise, highly professional sentences for an executive.\n\n${content}`
    );

    const summary = result.response.text().trim();

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('[blog-summary]', err);
    return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 });
  }
}
