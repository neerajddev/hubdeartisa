import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed project description.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 503 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const systemPrompt = `You are a senior Architectural Art Director and project scoping expert for De'Artisa Hub, a premium platform connecting clients with elite architectural visualizers.

Your job is to:
1. Analyse client project briefs for clarity, completeness, and potential risks.
2. Rewrite vague briefs into structured, professional project descriptions that artists can act on.
3. Assign a risk score based on ambiguity, budget mismatch, unrealistic timelines, or missing context.

Always respond with ONLY a valid JSON object in this exact shape (no markdown fences, no extra text):
{
  "riskScore": <integer 1-10, where 1 = crystal clear, 10 = very risky/ambiguous>,
  "feedback": "<2-3 sentence plain-English assessment of what is strong and what needs clarification>",
  "structuredBrief": "<rewritten project description in clear, professional markdown — include sections: ## Overview, ## Deliverables, ## Style & References, ## Timeline & Budget>"
}`;

    const result = await model.generateContent([
      systemPrompt,
      `\n\nClient brief to analyse and rewrite:\n\n${prompt}`,
    ]);

    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.riskScore !== 'number' ||
      typeof parsed.feedback !== 'string' ||
      typeof parsed.structuredBrief !== 'string'
    ) {
      throw new Error('Unexpected AI response shape');
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('[generate-brief]', err);
    const isQuota = err?.status === 429;
    return NextResponse.json(
      { error: isQuota ? 'AI quota exceeded. Please try again in a moment.' : 'AI refinement failed. Please try again.' },
      { status: isQuota ? 429 : 500 }
    );
  }
}
