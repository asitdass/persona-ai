import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles, assistants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generatePublicKey } from '@/lib/utils';
import { profileSchema } from '@/lib/validations';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id));

  return NextResponse.json(profile || null);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const validData = parsed.data;

  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id));

  if (existing) {
    const [updated] = await db
      .update(profiles)
      .set({
        name: validData.name,
        headline: validData.headline,
        about: validData.about,
        skills: validData.skills,
        portfolioUrl: validData.portfolioUrl,
        contactLinks: validData.contactLinks,
        socialLinks: validData.socialLinks,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id))
      .returning();

    return NextResponse.json(updated);
  }

  const [profile] = await db
    .insert(profiles)
    .values({
      userId: user.id,
      name: validData.name,
      headline: validData.headline,
      about: validData.about,
      skills: validData.skills,
      portfolioUrl: validData.portfolioUrl,
      contactLinks: validData.contactLinks,
      socialLinks: validData.socialLinks,
    })
    .returning();

  await db.insert(assistants).values({
    profileId: profile.id,
    name: `${validData.name}'s Assistant`,
    welcomeMessage: `Hi! I'm ${validData.name}'s AI assistant. Ask me anything about their work and experience.`,
    publicKey: generatePublicKey(),
    suggestedQuestions: [
      'Tell me about this person',
      'What projects have they built?',
      'What technologies do they use?',
      'Why should I hire them?',
    ],
  });

  return NextResponse.json(profile);
}
