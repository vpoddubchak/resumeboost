import {
  registerSchema,
  loginSchema,
  uploadSchema,
  validateBody,
  sanitizeHtml,
} from "@/app/lib/validations";

describe("Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password1!",
        first_name: "John",
        last_name: "Doe",
      });
      expect(result.success).toBe(true);
    });

    it("should normalize email to lowercase", () => {
      const result = registerSchema.safeParse({
        email: "TEST@Example.COM",
        password: "Password1!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should reject invalid email", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "Password1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Pass1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without lowercase", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "PASSWORD1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password!!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without special character", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password12",
      });
      expect(result.success).toBe(false);
    });

    it("should allow optional first_name and last_name", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password1!",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid",
        password: "password",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("uploadSchema", () => {
    it("should accept valid PDF upload", () => {
      const result = uploadSchema.safeParse({
        file_name: "resume.pdf",
        mime_type: "application/pdf",
        file_size: 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    it("should reject unsupported file type", () => {
      const result = uploadSchema.safeParse({
        file_name: "image.png",
        mime_type: "image/png",
        file_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject file larger than 10MB", () => {
      const result = uploadSchema.safeParse({
        file_name: "resume.pdf",
        mime_type: "application/pdf",
        file_size: 11 * 1024 * 1024,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("validateBody", () => {
  it("should return success with valid data", () => {
    const result = validateBody(loginSchema, {
      email: "test@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("should return error with field path for invalid data", () => {
    const result = validateBody(loginSchema, {
      email: "invalid",
      password: "password",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("email");
    }
  });

  it("should return error for missing required fields", () => {
    const result = validateBody(loginSchema, {});
    expect(result.success).toBe(false);
  });
});

describe("sanitizeHtml", () => {
  it("should escape HTML entities", () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("should escape ampersands", () => {
    expect(sanitizeHtml("a & b")).toBe("a &amp; b");
  });

  it("should escape single quotes", () => {
    expect(sanitizeHtml("it's")).toBe("it&#x27;s");
  });

  it("should leave safe strings unchanged", () => {
    expect(sanitizeHtml("Hello World 123")).toBe("Hello World 123");
  });
});
