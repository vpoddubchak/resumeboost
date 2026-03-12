/**
 * @jest-environment node
 */

jest.mock('pdf-parse', () => jest.fn());
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

describe('app/lib/file-extractor - extractTextFromFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract text from TXT files', async () => {
    const { extractTextFromFile } = await import('@/app/lib/file-extractor');
    const buffer = Buffer.from('Hello, this is a plain text resume.');

    const result = await extractTextFromFile(buffer, 'text/plain');

    expect(result).toBe('Hello, this is a plain text resume.');
  });

  it('should extract text from PDF files using pdf-parse', async () => {
    (pdfParse as unknown as jest.Mock).mockResolvedValueOnce({
      text: 'PDF resume content here',
      numpages: 1,
      info: {},
    });

    const { extractTextFromFile } = await import('@/app/lib/file-extractor');
    const buffer = Buffer.from('fake-pdf-bytes');

    const result = await extractTextFromFile(buffer, 'application/pdf');

    expect(result).toBe('PDF resume content here');
    expect(pdfParse).toHaveBeenCalledWith(buffer);
  });

  it('should extract text from DOCX files using mammoth', async () => {
    (mammoth.extractRawText as jest.Mock).mockResolvedValueOnce({
      value: 'DOCX resume content here',
      messages: [],
    });

    const { extractTextFromFile } = await import('@/app/lib/file-extractor');
    const buffer = Buffer.from('fake-docx-bytes');

    const result = await extractTextFromFile(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    expect(result).toBe('DOCX resume content here');
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
  });

  it('should truncate text exceeding 50,000 characters', async () => {
    const { extractTextFromFile, MAX_TEXT_LENGTH } = await import('@/app/lib/file-extractor');
    const longText = 'x'.repeat(60_000);
    const buffer = Buffer.from(longText);

    const result = await extractTextFromFile(buffer, 'text/plain');

    expect(result.length).toBe(MAX_TEXT_LENGTH + '\n[TRUNCATED]'.length);
    expect(result).toContain('[TRUNCATED]');
    expect(result.startsWith('x'.repeat(100))).toBe(true);
  });

  it('should not truncate text under 50,000 characters', async () => {
    const { extractTextFromFile } = await import('@/app/lib/file-extractor');
    const text = 'Short resume text';
    const buffer = Buffer.from(text);

    const result = await extractTextFromFile(buffer, 'text/plain');

    expect(result).toBe(text);
    expect(result).not.toContain('[TRUNCATED]');
  });

  it('should throw UnsupportedFileTypeError for unknown MIME types', async () => {
    const { extractTextFromFile, UnsupportedFileTypeError } = await import('@/app/lib/file-extractor');
    const buffer = Buffer.from('some data');

    await expect(
      extractTextFromFile(buffer, 'application/x-msdownload')
    ).rejects.toThrow(UnsupportedFileTypeError);

    await expect(
      extractTextFromFile(buffer, 'image/png')
    ).rejects.toThrow('Unsupported file type: image/png');
  });

  it('should propagate pdf-parse errors', async () => {
    (pdfParse as unknown as jest.Mock).mockRejectedValueOnce(new Error('Corrupted PDF'));

    const { extractTextFromFile } = await import('@/app/lib/file-extractor');
    const buffer = Buffer.from('corrupt-pdf');

    await expect(
      extractTextFromFile(buffer, 'application/pdf')
    ).rejects.toThrow('Corrupted PDF');
  });

  it('should propagate mammoth errors', async () => {
    (mammoth.extractRawText as jest.Mock).mockRejectedValueOnce(new Error('Invalid DOCX'));

    const { extractTextFromFile } = await import('@/app/lib/file-extractor');
    const buffer = Buffer.from('corrupt-docx');

    await expect(
      extractTextFromFile(
        buffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    ).rejects.toThrow('Invalid DOCX');
  });
});
