import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assistants, profiles, conversations, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { retrieveRelevantChunks } from '@/lib/rag/retrieve';
import { buildSystemPrompt } from '@/lib/rag/prompt';
import {
  moderateInput,
  detectPromptInjection,
  isOffTopic,
  filterOutput,
} from '@/lib/guardrails/moderation';
import { sanitizeInput } from '@/lib/security';

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(2000),
    })
  ).min(1).max(50),
  publicKey: z.string().min(1).max(100),
  conversationId: z.string().uuid().optional(),
});

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!ratelimit && process.env.UPSTASH_REDIS_REST_URL) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
    });
  }
  return ratelimit;
}

const SAFE_REFUSAL =
  "I'm here to help you learn about this person's professional background and experience. I can't assist with that type of request. Feel free to ask me about their skills, projects, or career!";

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const limiter = getRatelimit();
    if (limiter) {
      const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
      const { success } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { messages: chatMessages, publicKey, conversationId } = parsed.data;

    // Validate public key and get assistant + profile
    const [assistant] = await db
      .select()
      .from(assistants)
      .where(eq(assistants.publicKey, publicKey));

    if (!assistant || !assistant.isPublished) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Domain allowlist enforcement
    const origin = request.headers.get('origin');
    if (
      assistant.allowedDomains &&
      (assistant.allowedDomains as string[]).length > 0
    ) {
      if (!origin) {
        return NextResponse.json(
          { error: 'Origin header required' },
          { status: 403 }
        );
      }
      try {
        const originHost = new URL(origin).hostname;
        const allowed = (assistant.allowedDomains as string[]).some(
          (d) => originHost === d || originHost.endsWith(`.${d}`)
        );
        if (!allowed) {
          return NextResponse.json(
            { error: 'Domain not allowed' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        );
      }
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, assistant.profileId));

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // --- GUARDRAIL LAYER 1: Input Validation & Sanitization ---
    const lastUserMessage = chatMessages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    const cleanedInput = sanitizeInput(lastUserMessage.content);

    // --- GUARDRAIL LAYER 2: Prompt Injection Detection (fast, regex-based) ---
    if (detectPromptInjection(cleanedInput)) {
      return new Response(SAFE_REFUSAL, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // --- GUARDRAIL LAYER 3: Off-topic Detection ---
    if (isOffTopic(cleanedInput)) {
      return new Response(SAFE_REFUSAL, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // --- GUARDRAIL LAYER 4: OpenAI Moderation API (free, catches toxicity/hate/violence) ---
    const modResult = await moderateInput(cleanedInput);
    if (modResult.flagged) {
      return new Response(
        "I appreciate you reaching out, but I can't respond to that type of message. Please keep the conversation professional. How can I help you learn about this person's background?",
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    // --- RAG Retrieval ---
    const chunks = await retrieveRelevantChunks(
      cleanedInput,
      profile.id,
      5,
      0.25
    );

    // --- GUARDRAIL LAYER 5: System Prompt Hardening (built into prompt) ---
    const systemPrompt = buildSystemPrompt(profile, assistant, chunks);

    // Stream the response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: chatMessages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      })),
      maxOutputTokens: 1000,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // --- GUARDRAIL LAYER 6: Output Filtering (post-generation) ---
        const outputCheck = filterOutput(text);
        // Log flagged outputs for review
        if (!outputCheck.clean) {
          console.warn('Output filter triggered — possible system prompt leakage');
        }

        try {
          let convId = conversationId;
          if (!convId) {
            const [conv] = await db
              .insert(conversations)
              .values({
                assistantId: assistant.id,
                visitorId: request.headers.get('x-forwarded-for') ?? 'anonymous',
              })
              .returning();
            convId = conv.id;
          }

          await db.insert(messages).values([
            {
              conversationId: convId,
              role: 'user' as const,
              content: cleanedInput,
            },
            {
              conversationId: convId,
              role: 'assistant' as const,
              content: outputCheck.clean ? text : outputCheck.filtered,
            },
          ]);

          await db
            .update(conversations)
            .set({
              messageCount: chatMessages.length + 1,
              endedAt: new Date(),
            })
            .where(eq(conversations.id, convId));
        } catch {
          // Don't fail the response if logging fails
        }
      },
    });

    return result.toTextStreamResponse();
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
