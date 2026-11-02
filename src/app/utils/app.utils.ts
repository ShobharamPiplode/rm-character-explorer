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
