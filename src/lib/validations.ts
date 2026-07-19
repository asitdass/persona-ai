import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1).max(100),
  headline: z.string().max(200).optional(),
  about: z.string().max(5000).optional(),
  skills: z.array(z.string().max(50)).max(50).optional(),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  contactLinks: z
    .object({
      email: z.string().email().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      github: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional().or(z.literal('')),
      website: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
});

export const assistantSchema = z.object({
  name: z.string().min(1).max(100),
  welcomeMessage: z.string().max(500).optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  personality: z.string().max(200).optional(),
  responseStyle: z.enum(['concise', 'detailed', 'conversational']).optional(),
  suggestedQuestions: z.array(z.string().max(200)).max(10).optional(),
  allowedDomains: z.array(z.string().max(253)).max(20).optional(),
  isPublished: z.boolean().optional(),
});

export const chatMessageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(50),
  publicKey: z.string().min(1).max(50),
  conversationId: z.string().uuid().optional(),
});
