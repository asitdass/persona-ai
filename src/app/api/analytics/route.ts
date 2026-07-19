import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles, assistants, conversations, messages } from '@/lib/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';

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
    return NextResponse.json({ conversations: [], stats: null });
  }

  const [assistant] = await db
    .select()
    .from(assistants)
    .where(eq(assistants.profileId, profile.id));

  if (!assistant) {
    return NextResponse.json({ conversations: [], stats: null });
  }

  // Get conversations with messages
  const recentConversations = await db
    .select({
      id: conversations.id,
      visitorId: conversations.visitorId,
      startedAt: conversations.startedAt,
      endedAt: conversations.endedAt,
      messageCount: conversations.messageCount,
    })
    .from(conversations)
    .where(eq(conversations.assistantId, assistant.id))
    .orderBy(desc(conversations.startedAt))
    .limit(50);

  // Get stats
  const [statsResult] = await db
    .select({
      totalConversations: count(conversations.id),
      uniqueVisitors: sql<number>`COUNT(DISTINCT ${conversations.visitorId})`,
    })
    .from(conversations)
    .where(eq(conversations.assistantId, assistant.id));

  // Get most asked questions (recent user messages)
  const recentQuestions = await db
    .select({
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.assistantId, assistant.id))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  const userQuestions = recentQuestions.filter(
    (m) => !m.content.startsWith('Sorry') && m.content.length < 200
  );

  return NextResponse.json({
    conversations: recentConversations,
    stats: {
      totalConversations: statsResult?.totalConversations || 0,
      uniqueVisitors: statsResult?.uniqueVisitors || 0,
    },
    recentQuestions: userQuestions.slice(0, 10),
  });
}
