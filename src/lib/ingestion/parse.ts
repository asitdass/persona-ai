import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
      return parseDocx(buffer);
    case 'md':
    case 'txt':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function getSourceType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'md':
      return 'markdown';
    case 'txt':
      return 'text';
    default:
      return 'unknown';
  }
}
