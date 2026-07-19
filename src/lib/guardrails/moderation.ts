import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

/**
 * Uses OpenAI's free Moderation API to detect harmful content.
 * Checks for: hate, harassment, self-harm, sexual, violence, etc.
 */
export async function moderateInput(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });

    const result = response.results[0];
    if (!result.flagged) {
      return { flagged: false, categories: [] };
    }

    const flaggedCategories = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([category]) => category);

    return {
      flagged: true,
      categories: flaggedCategories,
      reason: `Content flagged for: ${flaggedCategories.join(', ')}`,
    };
  } catch {
    // If moderation API fails, allow the request but log it
    console.error('Moderation API failed — allowing request');
    return { flagged: false, categories: [] };
  }
}

/**
 * Lightweight regex-based injection detection.
 * Catches common prompt injection patterns before they reach the LLM.
 */
export function detectPromptInjection(text: string): boolean {
  const lowerText = text.toLowerCase();

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
    /disregard\s+(all\s+)?(previous|above|prior)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /new\s+instructions?:/i,
    /system\s*prompt:/i,
    /\[system\]/i,
    /\<\s*system\s*\>/i,
    /pretend\s+(you|to\s+be)/i,
    /act\s+as\s+(if|a|an)/i,
    /forget\s+(everything|all|your)/i,
    /override\s+(your|the|all)/i,
    /do\s+not\s+follow\s+(your|the|any)/i,
    /reveal\s+(your|the)\s+(system|secret|hidden|internal)/i,
    /what\s+(is|are)\s+your\s+(system|secret|hidden|internal)\s*(prompt|instruction)/i,
    /repeat\s+(your|the)\s+(system|initial|original)\s*(prompt|message|instruction)/i,
  ];

  return injectionPatterns.some((pattern) => pattern.test(lowerText));
}

/**
 * Checks if the message is off-topic (not related to professional/career questions).
 * Uses keyword heuristics for speed — runs before the LLM call.
 */
export function isOffTopic(text: string): boolean {
  const lowerText = text.toLowerCase();

  const offTopicPatterns = [
    /write\s+(me\s+)?(a|an)\s+(essay|story|poem|code|script)/i,
    /help\s+me\s+(hack|crack|break\s+into)/i,
    /how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|weapon|drug)/i,
    /generate\s+(a\s+)?(fake|forged)/i,
    /what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+/i, // Calculator abuse
  ];

  if (offTopicPatterns.some((p) => p.test(lowerText))) {
    return true;
  }

  return false;
}

/**
 * Filters the LLM output to ensure it doesn't leak system prompt or produce harmful content.
 */
export function filterOutput(text: string): { clean: boolean; filtered: string } {
  const leakagePatterns = [
    /## Critical Rules/i,
    /## Knowledge Base Context/i,
    /ONLY use information from the provided context/i,
    /NEVER invent, hallucinate/i,
    /system prompt/i,
    /you are "[^"]+", an AI assistant/i,
  ];

  for (const pattern of leakagePatterns) {
    if (pattern.test(text)) {
      return {
        clean: false,
        filtered: "I'm here to help answer questions about the person's professional background. What would you like to know?",
      };
    }
  }

  return { clean: true, filtered: text };
}
