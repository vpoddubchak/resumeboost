const MAX_TEXT_LENGTH = 50_000; // ~12,500 tokens — keeps total prompt under 16k tokens

export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`Unsupported file type: ${mimeType}`);
    this.name = 'UnsupportedFileTypeError';
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  let text: string;

  switch (mimeType) {
    case 'text/plain': {
      text = buffer.toString('utf-8');
      break;
    }
    case 'application/pdf': {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
      break;
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    default:
      throw new UnsupportedFileTypeError(mimeType);
  }

  // Truncate to prevent token overflow
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.substring(0, MAX_TEXT_LENGTH) + '\n[TRUNCATED]';
  }

  return text;
}

export { MAX_TEXT_LENGTH };
