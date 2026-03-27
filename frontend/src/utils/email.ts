/**
 * Returns whether a string looks like a reasonably valid email
 * (user@domain with at least one dot in the TLD).
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0) return false;
  if (normalized.length > 254) return false;
  return EMAIL_REGEX.test(normalized);
}

export function validateEmailField(value: string): { ok: true } | { ok: false; message: string } {
  const normalized = value.trim();
  if (!normalized) {
    return { ok: false, message: "Email is required." };
  }
  if (!isValidEmail(normalized)) {
    return { ok: false, message: "Enter a valid email (e.g. john.doe@email.com)." };
  }
  return { ok: true };
}
