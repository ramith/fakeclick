// Pure helpers shared by background.js — kept dependency-free (no chrome.*,
// no DOM) so they're directly unit-testable under plain Node.

export function hostnameOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname;
  } catch {
    return null;
  }
}

export function toMatchPatterns(domain) {
  return [`*://${domain}/*`, `*://*.${domain}/*`];
}
