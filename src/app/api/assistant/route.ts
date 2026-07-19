import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles, assistants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { assistantSchema } from '@/lib/validations';

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

  if (!profile) {
    return NextResponse.json(null);
  }

  const [assistant] = await db
    .select()
    .from(assistants)
    .where(eq(assistants.profileId, profile.id));

  return NextResponse.json(assistant || null);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id));

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = assistantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const validData = parsed.data;

  const [assistant] = await db
    .select()
    .from(assistants)
    .where(eq(assistants.profileId, profile.id));

  if (!assistant) {
    return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
  }

  const [updated] = await db
    .update(assistants)
    .set({
      name: validData.name,
      welcomeMessage: validData.welcomeMessage,
      themeColor: validData.themeColor,
      personality: validData.personality,
      responseStyle: validData.responseStyle,
      suggestedQuestions: validData.suggestedQuestions,
      allowedDomains: validData.allowedDomains,
      isPublished: validData.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(assistants.id, assistant.id))
    .returning();

  return NextResponse.json(updated);
}
