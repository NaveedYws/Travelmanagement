import { SavedQuotation, QuotationLeadStatus } from "./types";

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
 * Saves or updates a quotation in localStorage and broadcasts an update event.
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
  return saved;
}

/**
 * Updates status of a stored quotation and broadcasts an update event.
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
  return updated;
}

/**
 * Updates partial fields of a stored quotation.
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
  return updated;
}

/**
 * Deletes a quotation by ID from localStorage.
 */
export function deleteQuotation(id: string): void {
  const current = getStoredQuotations();
  const next = current.filter((q) => q.id !== id);
  persistQuotations(next);
}
