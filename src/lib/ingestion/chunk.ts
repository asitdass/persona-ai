const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\n{3,}/g, '\n\n').trim();

  if (!cleaned) return [];

  const sentences = splitIntoSentences(cleaned);
  const chunks: string[] = [];
  let currentChunk = '';
  let wordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;

    if (wordCount + sentenceWords > CHUNK_SIZE && currentChunk) {
      chunks.push(currentChunk.trim());

      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-CHUNK_OVERLAP);
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      wordCount = CHUNK_OVERLAP + sentenceWords;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      wordCount += sentenceWords;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function splitIntoSentences(text: string): string[] {
  const paragraphs = text.split(/\n\n+/);
  const sentences: string[] = [];

  for (const paragraph of paragraphs) {
    const paraSentences = paragraph
      .replace(/\n/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);

    sentences.push(...paraSentences);
  }

  return sentences;
}
