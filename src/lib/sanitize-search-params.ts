export const SENSITIVE_SEARCH_KEYS = new Set([
  "email",
  "password",
  "passwd",
  "pass",
  "pwd",
  "invite",
  "invite_code",
  "token",
  "access_token",
  "refresh_token",
]);

export function stripSensitiveFromSearchRecord(
  search: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(search)) {
    if (!SENSITIVE_SEARCH_KEYS.has(key.toLowerCase())) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function hasSensitiveSearchParams(search: Record<string, unknown>): boolean {
  return Object.keys(search).some((key) => SENSITIVE_SEARCH_KEYS.has(key.toLowerCase()));
}

/** Removes credential-like keys from the current URL without a navigation round-trip. */
export function stripSensitiveSearchParams(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  let dirty = false;

  for (const key of [...params.keys()]) {
    if (SENSITIVE_SEARCH_KEYS.has(key.toLowerCase())) {
      params.delete(key);
      dirty = true;
    }
  }

  if (!dirty) return false;

  const next = params.toString();
  const path = window.location.pathname;
  window.history.replaceState(window.history.state, "", next ? `${path}?${next}` : path);
  return true;
}
