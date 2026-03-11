import bcrypt from "bcryptjs";

const BCRYPT_COST_FACTOR = 12;

describe("Password Hashing (bcryptjs)", () => {
  it("should hash a password with cost factor 12", async () => {
    const password = "Password1!";
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it("should verify a correct password", async () => {
    const password = "Password1!";
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const password = "Password1!";
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    const isValid = await bcrypt.compare("WrongPassword1!", hash);
    expect(isValid).toBe(false);
  });

  it("should generate different hashes for the same password", async () => {
    const password = "Password1!";
    const hash1 = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const hash2 = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it("should never store password in plaintext", async () => {
    const password = "Password1!";
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    expect(hash).not.toContain(password);
  });
});
