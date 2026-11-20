import { SavedQuotation, QuotationLeadStatus } from "./types";
import { api } from "./api";

const STORAGE_KEY = "travel_quotations_v1";
export const QUOTATIONS_UPDATED_EVENT = "quotations_updated";
const MAX_STORED_QUOTATIONS = 100;

export type SaveQuotationInput = Omit<SavedQuotation, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

function sortByUpdatedDesc(items: SavedQuotation[]): SavedQuotation[] {
  return [...items].sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tB - tA;
  });
}

function stripInlineImages(quotation: SavedQuotation): SavedQuotation {
  return {
    ...quotation,
    heroImage: quotation.heroImage?.startsWith("data:") ? "" : quotation.heroImage,
    days: (quotation.days || []).map((d) => ({
      ...d,
      images: (d.images || []).filter((img) => !img.startsWith("data:")),
    })),
    hotels: (quotation.hotels || []).map((h) => ({
      ...h,
      imageUrl: h.imageUrl?.startsWith("data:") ? "" : h.imageUrl,
    })),
  };
}

function persistQuotations(quotations: SavedQuotation[]): SavedQuotation[] {
  const sorted = sortByUpdatedDesc(quotations).slice(0, MAX_STORED_QUOTATIONS);
  if (typeof window === "undefined") return sorted;

  const candidates: Array<() => SavedQuotation[]> = [
    () => sorted,
    () => sorted.map(stripInlineImages),
    () => sorted.slice(0, 50).map(stripInlineImages),
    () => sorted.slice(0, 20).map(stripInlineImages),
    () => sorted.slice(0, 5).map(stripInlineImages),
  ];

  let lastErr: unknown;
  for (const buildCandidate of candidates) {
    try {
      const payload = buildCandidate();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(QUOTATIONS_UPDATED_EVENT, { detail: payload }));
      return payload;
    } catch (err) {
      lastErr = err;
    }
  }

  console.error("Failed to persist quotations", lastErr);
  return sorted;
}

/**
 * Returns all locally stored quotations sorted by most recently updated.
 */
export function getStoredQuotations(): SavedQuotation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortByUpdatedDesc(parsed);
  } catch (err) {
    console.error("Failed to load quotations from localStorage", err);
    return [];
  }
}

/**
 * Returns up to `limit` most recent quotations (default: 5).
 */
export function getRecentQuotations(limit = 5): SavedQuotation[] {
  return getStoredQuotations().slice(0, limit);
}

/**
 * Background async save to database API
 */
async function apiSaveQuotation(quotation: SavedQuotation): Promise<SavedQuotation | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  try {
    const res = await api.post<{ status: string; id?: string; quotation?: SavedQuotation }>(
      "/api/quotations/index.php",
      quotation
    );
    if (res?.quotation) {
      return res.quotation;
    }
    return quotation;
  } catch (err) {
    console.warn("Database sync for quotation failed (cached locally):", err);
    return null;
  }
}

/**
 * Background async update to database API
 */
async function apiUpdateQuotation(
  id: string,
  updates: Partial<SavedQuotation>
): Promise<SavedQuotation | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  try {
    const res = await api.put<{ status: string; quotation?: SavedQuotation }>(
      "/api/quotations/index.php",
      { id, ...updates }
    );
    return res?.quotation || null;
  } catch (err) {
    console.warn("Database update for quotation failed:", err);
    return null;
  }
}

/**
 * Background async delete from database API
 */
async function apiDeleteQuotation(id: string): Promise<boolean> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return false;

  try {
    await api.delete(`/api/quotations/index.php?id=${encodeURIComponent(id)}`);
    return true;
  } catch (err) {
    console.warn("Database delete for quotation failed:", err);
    return false;
  }
}

/**
 * Fetches all quotations from the database.
 * If user logs in from another device, this pulls all saved quotations into the device.
 * If database is empty but local storage has existing quotations, auto-syncs them to database.
 */
export async function fetchQuotationsFromDb(): Promise<SavedQuotation[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return getStoredQuotations();
  }

  try {
    const res = await api.get<{ status?: string; quotations?: SavedQuotation[] }>(
      "/api/quotations/index.php"
    );

    if (res && Array.isArray(res.quotations)) {
      if (res.quotations.length > 0) {
        // We received quotations from the database (e.g. from another device or prior sessions)
        persistQuotations(res.quotations);
        return sortByUpdatedDesc(res.quotations);
      } else {
        // Database is currently empty for this user. Check if we have local quotes to auto-migrate to DB
        const local = getStoredQuotations();
        if (local.length > 0) {
          syncQuotationsToDatabase(local).catch(() => {});
        }
        return local;
      }
    }
  } catch (err) {
    console.warn("Could not fetch quotations from database, falling back to local cache:", err);
  }

  return getStoredQuotations();
}

/**
 * Syncs an array of quotations to the database in batch.
 */
export async function syncQuotationsToDatabase(
  items?: SavedQuotation[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return { success: false, count: 0, error: "Please log in to sync quotations with database" };
  }

  const toSync = items || getStoredQuotations();
  if (toSync.length === 0) return { success: true, count: 0 };

  try {
    const res = await api.post<{ status: string; quotations?: SavedQuotation[] }>(
      "/api/quotations/index.php",
      { quotations: toSync }
    );

    if (res && Array.isArray(res.quotations) && res.quotations.length > 0) {
      persistQuotations(res.quotations);
      return { success: true, count: res.quotations.length };
    }
    return { success: true, count: toSync.length };
  } catch (batchErr: any) {
    console.warn("Batch quotation sync failed, trying individually:", batchErr);
    let savedCount = 0;
    for (const q of toSync) {
      try {
        await api.post("/api/quotations/index.php", q);
        savedCount++;
      } catch (err) {
        console.warn(`Failed to sync quotation ${q.id} to database:`, err);
      }
    }
    return { success: savedCount > 0, count: savedCount };
  }
}

/**
 * Saves or updates a quotation locally AND syncs to database.
 */
export function saveQuotation(input: SaveQuotationInput): SavedQuotation {
  const current = getStoredQuotations();
  const now = new Date().toISOString();

  const existingIdx = current.findIndex(
    (q) =>
      (input.id && q.id === input.id) ||
      (!input.id && input.quotationRef && q.quotationRef === input.quotationRef)
  );

  const existing = existingIdx !== -1 ? current[existingIdx] : null;
  const saved: SavedQuotation = {
    ...input,
    id: existing?.id || input.id || `qt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: input.status || existing?.status || "In Progress",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  const next =
    existingIdx !== -1
      ? [saved, ...current.filter((_, idx) => idx !== existingIdx)]
      : [saved, ...current];

  persistQuotations(next);

  // Background async save to database so other devices can see it
  apiSaveQuotation(saved).catch(() => {});

  return saved;
}

/**
 * Updates status of a quotation locally and in the database.
 */
export function updateQuotationStatus(
  id: string,
  status: QuotationLeadStatus | string
): SavedQuotation | null {
  const current = getStoredQuotations();
  const target = current.find((q) => q.id === id);
  if (!target) return null;
  const now = new Date().toISOString();
  const updated: SavedQuotation = {
    ...target,
    status,
    updatedAt: now,
  };
  const next = current.map((q) => (q.id === id ? updated : q));
  persistQuotations(next);

  // Background async update to database
  apiUpdateQuotation(id, { status }).catch(() => {});

  return updated;
}

/**
 * Updates partial fields of a quotation locally and in the database.
 */
export function updateQuotation(
  id: string,
  updates: Partial<SavedQuotation>
): SavedQuotation | null {
  const current = getStoredQuotations();
  const target = current.find((q) => q.id === id);
  if (!target) return null;
  const now = new Date().toISOString();
  const updated: SavedQuotation = {
    ...target,
    ...updates,
    updatedAt: now,
  };
  const next = current.map((q) => (q.id === id ? updated : q));
  persistQuotations(next);

  // Background async update to database
  apiUpdateQuotation(id, updates).catch(() => {});

  return updated;
}

/**
 * Deletes a quotation by ID locally and in the database.
 */
export function deleteQuotation(id: string): void {
  const current = getStoredQuotations();
  const next = current.filter((q) => q.id !== id);
  persistQuotations(next);

  // Background async delete from database
  apiDeleteQuotation(id).catch(() => {});
}
