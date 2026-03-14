import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  first_name: z
    .string()
    .max(100, "First name must be 100 characters or less")
    .optional(),
  last_name: z
    .string()
    .max(100, "Last name must be 100 characters or less")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const uploadSchema = z.object({
  file_name: z.string().max(255),
  mime_type: z
    .string()
    .refine(
      (val) =>
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ].includes(val),
      "Unsupported file type. Allowed: PDF, DOC, DOCX, TXT"
    ),
  file_size: z
    .number()
    .max(10 * 1024 * 1024, "File size must be 10MB or less")
    .positive("File size must be positive"),
});

export const consultationSchema = z.object({
  consultation_date: z.string().datetime("Invalid date format"),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
});

export const userUpdateSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
});

export const analyzeRequestSchema = z.object({
  upload_id: z.number().int().positive('Upload ID must be a positive integer'),
  job_description: z.string().min(10, 'Job description too short').max(10000, 'Job description too long'),
  locale: z.enum(['en', 'uk']).optional().default('en'),
});

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.enum(ALLOWED_MIME_TYPES),
  fileSize: z.number().max(MAX_FILE_SIZE),
});

export const jobDescriptionSchema = z.string().min(10).max(10000);

/**
 * Validate request body against a Zod schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: { code: string; message: string } } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Invalid input",
    },
  };
}

/**
 * Sanitize a string to prevent XSS by escaping HTML entities.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
