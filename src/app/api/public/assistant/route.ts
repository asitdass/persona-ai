import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assistants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get('key');

  if (!publicKey) {
    return NextResponse.json({ error: 'Public key required' }, { status: 400 });
  }

  const [assistant] = await db
    .select({
      name: assistants.name,
      welcomeMessage: assistants.welcomeMessage,
      themeColor: assistants.themeColor,
      suggestedQuestions: assistants.suggestedQuestions,
      isPublished: assistants.isPublished,
    })
    .from(assistants)
    .where(eq(assistants.publicKey, publicKey));

  if (!assistant || !assistant.isPublished) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(assistant);
}
