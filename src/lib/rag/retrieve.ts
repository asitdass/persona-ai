import { db } from '@/lib/db';
import { documentChunks } from '@/lib/db/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { generateSingleEmbedding } from '@/lib/ingestion/embed';

export interface RetrievedChunk {
  content: string;
  similarity: number;
}

export async function retrieveRelevantChunks(
  query: string,
  profileId: string,
  topK: number = 5,
  threshold: number = 0.3
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateSingleEmbedding(query);

  const results = await db
    .select({
      content: documentChunks.content,
      similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`.as('similarity'),
    })
    .from(documentChunks)
    .where(eq(documentChunks.profileId, profileId))
    .orderBy(desc(sql`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`))
    .limit(topK);

  return results
    .filter((r) => r.similarity >= threshold)
    .map((r) => ({
      content: r.content,
      similarity: r.similarity,
    }));
}
