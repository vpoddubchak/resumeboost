import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, fileUploadSchema, jobDescriptionSchema } from '@/app/lib/validations';

describe('ALLOWED_MIME_TYPES', () => {
  it('should include PDF', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
  });

  it('should include DOCX', () => {
    expect(ALLOWED_MIME_TYPES).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('should include plain text', () => {
    expect(ALLOWED_MIME_TYPES).toContain('text/plain');
  });

  it('should not include executable types', () => {
    expect(ALLOWED_MIME_TYPES).not.toContain('application/x-msdownload');
    expect(ALLOWED_MIME_TYPES).not.toContain('application/octet-stream');
  });
});

describe('MAX_FILE_SIZE', () => {
  it('should be exactly 15MB', () => {
    expect(MAX_FILE_SIZE).toBe(15 * 1024 * 1024);
  });
});

describe('fileUploadSchema', () => {
  const validData = {
    fileName: 'resume.pdf',
    fileType: 'application/pdf' as const,
    fileSize: 1024 * 500,
  };

  it('should accept valid PDF upload data', () => {
    const result = fileUploadSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept DOCX mime type', () => {
    const result = fileUploadSchema.safeParse({
      ...validData,
      fileName: 'resume.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(result.success).toBe(true);
  });

  it('should accept TXT mime type', () => {
    const result = fileUploadSchema.safeParse({
      ...validData,
      fileName: 'resume.txt',
      fileType: 'text/plain',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid mime type', () => {
    const result = fileUploadSchema.safeParse({ ...validData, fileType: 'application/x-msdownload' });
    expect(result.success).toBe(false);
  });

  it('should reject file exceeding 15MB', () => {
    const result = fileUploadSchema.safeParse({ ...validData, fileSize: MAX_FILE_SIZE + 1 });
    expect(result.success).toBe(false);
  });

  it('should accept file at exactly 15MB', () => {
    const result = fileUploadSchema.safeParse({ ...validData, fileSize: MAX_FILE_SIZE });
    expect(result.success).toBe(true);
  });

  it('should reject empty file name', () => {
    const result = fileUploadSchema.safeParse({ ...validData, fileName: '' });
    expect(result.success).toBe(false);
  });

  it('should reject file name exceeding 255 characters', () => {
    const result = fileUploadSchema.safeParse({ ...validData, fileName: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe('jobDescriptionSchema', () => {
  it('should accept a valid job description', () => {
    const result = jobDescriptionSchema.safeParse('We are looking for a senior developer with 5 years...');
    expect(result.success).toBe(true);
  });

  it('should reject job description shorter than 10 characters', () => {
    const result = jobDescriptionSchema.safeParse('Too short');
    expect(result.success).toBe(false);
  });

  it('should reject job description exactly 9 characters', () => {
    const result = jobDescriptionSchema.safeParse('123456789');
    expect(result.success).toBe(false);
  });

  it('should accept job description at minimum 10 characters', () => {
    const result = jobDescriptionSchema.safeParse('1234567890');
    expect(result.success).toBe(true);
  });

  it('should reject job description exceeding 10000 characters', () => {
    const result = jobDescriptionSchema.safeParse('a'.repeat(10001));
    expect(result.success).toBe(false);
  });

  it('should accept job description at exactly 10000 characters', () => {
    const result = jobDescriptionSchema.safeParse('a'.repeat(10000));
    expect(result.success).toBe(true);
  });
});
