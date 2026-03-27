import { describe, expect, it } from "vitest";
import { isValidEmail, validateEmailField } from "./email";

describe("isValidEmail", () => {
  it("accepts a typical address", () => {
    expect(isValidEmail("john.doe@example.com")).toBe(true);
  });

  it("rejects empty or whitespace", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects addresses longer than 254 characters", () => {
    const local = "a".repeat(64);
    const domain = `${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(63)}`;
    const long = `${local}@${domain}`;
    expect(long.length).toBeGreaterThan(254);
    expect(isValidEmail(long)).toBe(false);
  });

  it("rejects missing @ or domain", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });
});

describe("validateEmailField", () => {
  it("requires non-empty input", () => {
    const r = validateEmailField("  ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/required/i);
  });

  it("rejects invalid format", () => {
    const r = validateEmailField("bad");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/valid email/i);
  });

  it("accepts valid email", () => {
    expect(validateEmailField("user@host.com")).toEqual({ ok: true });
  });
});
