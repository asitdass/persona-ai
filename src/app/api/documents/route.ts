import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { documents, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSourceType } from '@/lib/ingestion/parse';
import {
  sanitizeFilename,
  validateFileSize,
  validateMagicBytes,
  generateInternalToken,
} from '@/lib/security';

const MAX_DOCUMENTS_PER_PROFILE = 50;

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
    return NextResponse.json([]);
  }

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.profileId, profile.id));

  return NextResponse.json(docs);
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'Please create a profile first' }, { status: 400 });
  }

  // Enforce document count limit
  const existingDocs = await db
    .select()
    .from(documents)
    .where(eq(documents.profileId, profile.id));

  if (existingDocs.length >= MAX_DOCUMENTS_PER_PROFILE) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_DOCUMENTS_PER_PROFILE} documents allowed` },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    return NextResponse.json(
      { error: 'File must be between 1 byte and 10MB' },
      { status: 400 }
    );
  }

  const allowedTypes = ['pdf', 'docx', 'md', 'txt'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedTypes.includes(ext)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: PDF, DOCX, MD, TXT' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate magic bytes for binary files
  if (!validateMagicBytes(buffer, ext)) {
    return NextResponse.json(
      { error: 'File content does not match its extension' },
      { status: 400 }
    );
  }

  // Sanitize filename to prevent path traversal
  const safeFilename = sanitizeFilename(file.name);
  const storagePath = `${profile.id}/${Date.now()}_${safeFilename}`;

  const serviceClient = createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from('documents')
    .upload(storagePath, buffer, {
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  const [doc] = await db
    .insert(documents)
    .values({
      profileId: profile.id,
      filename: safeFilename,
      sourceType: getSourceType(file.name),
      storagePath,
      status: 'pending',
    })
    .returning();

  // Trigger processing with signed internal token
  const token = generateInternalToken(doc.id);
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${doc.id}/process`, {
    method: 'POST',
    headers: { 'x-internal-token': token },
  }).catch(() => {});

  return NextResponse.json(doc);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('id');

  if (!docId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
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
    .where(eq(documents.id, docId));

  if (!doc || doc.profileId !== profile.id) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const storageClient = createServiceClient();
  await storageClient.storage.from('documents').remove([doc.storagePath]);

  await db.delete(documents).where(eq(documents.id, docId));

  return NextResponse.json({ success: true });
}
