import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { documents, documentChunks, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parseDocument } from '@/lib/ingestion/parse';
import { chunkText } from '@/lib/ingestion/chunk';
import { generateEmbeddings } from '@/lib/ingestion/embed';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyInternalToken } from '@/lib/security';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth: either a valid user session with ownership, or a signed internal token
  const internalToken = request.headers.get('x-internal-token');

  if (internalToken) {
    if (!verifyInternalToken(id, internalToken)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }
  } else {
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

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    if (!doc || doc.profileId !== profile.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
  }

  try {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await db
      .update(documents)
      .set({ status: 'processing' })
      .where(eq(documents.id, id));

    const supabase = createServiceClient();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storagePath);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage');
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await parseDocument(buffer, doc.filename);

    if (!text.trim()) {
      throw new Error('No text content extracted from document');
    }

    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    const embeddings = await generateEmbeddings(chunks);

    await db
      .delete(documentChunks)
      .where(eq(documentChunks.documentId, id));

    const chunkValues = chunks.map((content, index) => ({
      documentId: doc.id,
      profileId: doc.profileId,
      content,
      embedding: embeddings[index],
      chunkIndex: index,
    }));

    for (let i = 0; i < chunkValues.length; i += 50) {
      const batch = chunkValues.slice(i, i + 50);
      await db.insert(documentChunks).values(batch);
    }

    await db
      .update(documents)
      .set({ status: 'completed' })
      .where(eq(documents.id, id));

    return NextResponse.json({ success: true, chunks: chunks.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Processing failed';
    await db
      .update(documents)
      .set({ status: 'failed', errorMessage })
      .where(eq(documents.id, id));

    // Don't expose internal error details to the client
    return NextResponse.json(
      { error: 'Document processing failed. Please try again.' },
      { status: 500 }
    );
  }
}
