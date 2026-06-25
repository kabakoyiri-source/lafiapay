// ============================================================================
// LafiaPay — Persisted Store
// Wraps localStorage to persist mockStore data between page reloads.
// On first load: seeds with demo data. On subsequent loads: restores state.
// ============================================================================

const STORE_KEY = 'lafiapay-store';
const STORE_VERSION = 'v2'; // Bump to force re-seed

export interface PersistedData {
  version: string;
  profiles: unknown[];
  commercants: unknown[];
  comptes: unknown[];
  transactions: unknown[];
  litiges: unknown[];
  auditLogs: unknown[];
  alertes: unknown[];
}

/**
 * Check if persisted data exists and is the current version.
 */
export function hasPersistedData(): boolean {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as PersistedData;
    return data.version === STORE_VERSION;
  } catch {
    return false;
  }
}

/**
 * Load persisted data from localStorage.
 * Returns null if no valid data exists.
 */
export function loadPersistedData(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedData;
    if (data.version !== STORE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Save current store state to localStorage.
 */
export function persistData(data: Omit<PersistedData, 'version'>): void {
  const payload: PersistedData = {
    version: STORE_VERSION,
    ...data,
  };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('LafiaPay: Failed to persist store data', e);
  }
}

/**
 * Clear all persisted data (force re-seed on next load).
 */
export function clearPersistedData(): void {
  localStorage.removeItem(STORE_KEY);
}

/**
 * Get current store version.
 */
export function getStoreVersion(): string {
  return STORE_VERSION;
}
