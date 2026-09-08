/**
 * Sanitizes a filename against invalid OS characters and limits its length.
 *
 * Replaces characters that are invalid on Windows/Linux filesystems
 * (`\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`, `%`) with `-`, strips
 * control characters and leading dots, trims whitespace, and enforces a
 * maximum length of 100 characters. Falls back to `defaultName` when the
 * result would be empty.
 */
export function sanitizeFilename(
  filename: string,
  defaultName: string,
): string {
  if (!filename || typeof filename !== "string") {
    return defaultName;
  }
  const sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .trim()
    .replace(/^\.+/, "");
  if (!sanitized) {
    return defaultName;
  }
  return sanitized.slice(0, 100);
}
