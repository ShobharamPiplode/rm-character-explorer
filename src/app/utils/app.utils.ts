/** Two-letter initials: "Rick Sanchez" -> "RS", "Alexander" -> "A". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

/** Reads a sessionStorage value, or null if it is missing, not one of `allowed`, or storage is unavailable. */
export function readSessionValue<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const value = sessionStorage.getItem(key) as T;
    return allowed.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** Writes a sessionStorage value; if storage is unavailable (private mode etc.) the app keeps working in memory. */
export function writeSessionValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}
