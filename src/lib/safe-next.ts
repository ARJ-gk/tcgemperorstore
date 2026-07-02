/**
 * Sanitize a post-auth redirect target to a same-origin path.
 * Rejects absolute URLs, protocol-relative (`//`), and backslash tricks
 * (browsers normalize `\` to `/`) to prevent open redirects.
 */
export function safeNext(value: string | null | undefined): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return "/";
}
