export interface StorageInfo {
  usage: number;
  quota: number;
  persisted: boolean;
}

/**
 * Requests persistent storage from the browser if supported.
 * Checks persisted status first and silently ignores environments where
 * the StorageManager API is unsupported or fails.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }
  try {
    const isPersisted = await navigator.storage.persisted?.();
    if (isPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Retrieves storage usage/quota estimation and persistence status.
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  let persisted = false;
  let usage = 0;
  let quota = 0;

  if (typeof navigator !== "undefined" && navigator.storage) {
    try {
      if (navigator.storage.persisted) {
        persisted = await navigator.storage.persisted();
      }
      if (navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        usage = estimate.usage ?? 0;
        quota = estimate.quota ?? 0;
      }
    } catch {
      // Ignore errors in restricted/unsupported environments
    }
  }

  return { usage, quota, persisted };
}

/**
 * Checks whether an error is a QuotaExceededError from IndexedDB or the Storage API.
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException) {
    return err.name === "QuotaExceededError" || err.code === 22;
  }
  if (typeof err === "object") {
    const e = err as { name?: unknown; code?: unknown; message?: unknown };
    if (e.name === "QuotaExceededError" || e.code === 22) return true;
    if (typeof e.message === "string" && /quota/i.test(e.message)) return true;
  }
  return false;
}
