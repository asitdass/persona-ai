import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';

// --- Internal API Authentication ---

const INTERNAL_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';

export function generateInternalToken(documentId: string): string {
  const hmac = crypto.createHmac('sha256', INTERNAL_SECRET);
  hmac.update(documentId);
  return hmac.digest('hex');
}

export function verifyInternalToken(documentId: string, token: string): boolean {
  const expected = generateInternalToken(documentId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

// --- Security Headers ---

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

// --- Input Sanitization ---

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 100);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

// --- File Validation ---

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MAGIC_BYTES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  docx: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP)
};

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export function validateMagicBytes(buffer: Buffer, extension: string): boolean {
  const expected = MAGIC_BYTES[extension];
  if (!expected) return true; // md/txt don't have magic bytes

  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

// --- Auth Callback Validation ---

export function validateRedirectPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('\\')) return false;
  return true;
}

// --- Cryptographically Secure Public Key ---

export function generateSecurePublicKey(): string {
  const bytes = crypto.randomBytes(18);
  return 'pk_' + bytes.toString('base64url');
}

// --- UUID Validation ---

export const uuidSchema = z.string().uuid();
