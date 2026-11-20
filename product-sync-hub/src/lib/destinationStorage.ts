import { api } from "./api";

export interface DestinationDayTemplate {
  id: string;
  dayNumber: number;
  destinationCity: string;
  title: string;
  description: string;
  imageUrl?: string;
  activities?: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  stateOrCountry?: string;
  coverImage?: string;
  description?: string;
  days: DestinationDayTemplate[];
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "travel_destination_library_v1";

export const DEFAULT_DESTINATIONS: DestinationItem[] = [];

export const DEMO_DEST_IDS = new Set([
  "dest-kashmir",
  "dest-ladakh",
  "dest-himachal",
  "dest-dubai",
  "dest-bali",
  "dest-kerala",
]);

export const DEMO_DEST_NAMES = new Set([
  "Kashmir Paradise",
  "Ladakh High Altitude Odyssey",
  "Himachal Explorer (Shimla & Manali)",
  "Dazzling Dubai & Desert Wonders",
  "Tropical Bali & Island Paradise",
  "Kerala God's Own Country",
]);

export function isDemoDestination(dest?: Partial<DestinationItem> | null): boolean {
  if (!dest) return false;
  if (dest.id && DEMO_DEST_IDS.has(dest.id)) return true;
  if (dest.name && DEMO_DEST_NAMES.has(dest.name.trim())) return true;
  return false;
}

export function getStoredDestinations(): DestinationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter((d) => !isDemoDestination(d));
      if (cleaned.length !== parsed.length) {
        persistDestinations(cleaned);
      }
      return cleaned;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    console.error("Failed to load destinations from localStorage", err);
    return [];
  }
}

export function persistDestinations(destinations: DestinationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
    window.dispatchEvent(new CustomEvent("destination_library_updated", { detail: destinations }));
  } catch (err) {
    console.error("Failed to persist destinations", err);
  }
}

/**
 * Background async save to database API
 */
async function apiSaveDestination(dest: DestinationItem): Promise<DestinationItem | null> {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const isNumericId = dest.id && /^\d+$/.test(dest.id);
    if (isNumericId) {
      const res = await api.put<{ status: string; id?: string; destination?: DestinationItem }>("/api/destinations/index.php", dest);
      return res?.destination || dest;
    } else {
      const res = await api.post<{ status: string; id?: string; destination?: DestinationItem }>("/api/destinations/index.php", dest);
      if (res?.id && res.id !== dest.id) {
        // Update local item with database numeric ID
        const current = getStoredDestinations();
        const idx = current.findIndex((d) => d.id === dest.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], id: res.id };
          persistDestinations(current);
        }
      }
      return res?.destination || { ...dest, id: res?.id || dest.id };
    }
  } catch (err) {
    console.warn("Database sync for destination failed (cached locally):", err);
    return null;
  }
}

/**
 * Background async delete from database API
 */
async function apiDeleteDestination(id: string): Promise<boolean> {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    if (/^\d+$/.test(id)) {
      await api.delete(`/api/destinations/index.php?id=${encodeURIComponent(id)}`);
    }
    return true;
  } catch (err) {
    console.warn("Database delete for destination failed:", err);
    return false;
  }
}

/**
 * Fetches all destinations from the database.
 * If database is empty, auto-syncs local/default destinations into the database.
 */
export async function fetchDestinationsFromDb(): Promise<DestinationItem[]> {
  const token = localStorage.getItem("token");
  if (!token) {
    return getStoredDestinations();
  }

  try {
    const res = await api.get<{ destinations: DestinationItem[] }>("/api/destinations/index.php");
    if (res && Array.isArray(res.destinations)) {
      // Clean up any legacy demo destinations found in database
      const demoDests = res.destinations.filter(isDemoDestination);
      for (const d of demoDests) {
        if (d.id) {
          apiDeleteDestination(d.id);
        }
      }

      const realDests = res.destinations.filter((d) => !isDemoDestination(d));
      persistDestinations(realDests);
      return realDests;
    }
  } catch (err) {
    console.warn("Could not fetch destinations from database, falling back to local cache:", err);
  }

  return getStoredDestinations();
}

/**
 * Syncs an array of destinations to the database in batch.
 */
export async function syncDestinationsToDatabase(items?: DestinationItem[]): Promise<{ success: boolean; count: number; error?: string }> {
  const token = localStorage.getItem("token");
  if (!token) return { success: false, count: 0, error: "Please log in to sync destinations with database" };

  const toSync = items || getStoredDestinations();
  if (toSync.length === 0) return { success: true, count: 0 };

  try {
    const res = await api.post<{ status: string; destinations?: DestinationItem[] }>("/api/destinations/index.php", {
      destinations: toSync.map((d) => ({
        name: d.name,
        stateOrCountry: d.stateOrCountry || "",
        coverImage: d.coverImage || "",
        description: d.description || "",
        days: d.days || [],
      })),
    });

    if (res.destinations && res.destinations.length > 0) {
      persistDestinations(res.destinations);
      return { success: true, count: res.destinations.length };
    }
    return { success: true, count: toSync.length };
  } catch (batchErr: any) {
    // Fallback: If server is still running older single-item endpoint, save one-by-one
    try {
      let savedCount = 0;
      for (const d of toSync) {
        await api.post("/api/destinations/index.php", {
          name: d.name,
          stateOrCountry: d.stateOrCountry || "",
          coverImage: d.coverImage || "",
          description: d.description || "",
          days: d.days || [],
        });
        savedCount++;
      }
      return { success: true, count: savedCount };
    } catch (fallbackErr: any) {
      console.error("Failed to sync destinations to database:", fallbackErr);
      return { success: false, count: 0, error: fallbackErr?.message || batchErr?.message || "Failed to sync destinations" };
    }
  }
}

export function saveDestination(item: {
  id?: string;
  name: string;
  stateOrCountry?: string;
  coverImage?: string;
  description?: string;
  days?: DestinationDayTemplate[];
}): DestinationItem {
  const current = getStoredDestinations();
  const now = new Date().toISOString();

  if (item.id) {
    const idx = current.findIndex((d) => d.id === item.id);
    if (idx !== -1) {
      const updated: DestinationItem = {
        ...current[idx],
        name: item.name.trim(),
        stateOrCountry: item.stateOrCountry || current[idx].stateOrCountry,
        coverImage: item.coverImage || current[idx].coverImage,
        description: item.description ?? current[idx].description,
        days: item.days ?? current[idx].days,
        updatedAt: now,
      };
      current[idx] = updated;
      persistDestinations(current);

      // Save to database asynchronously
      apiSaveDestination(updated);
      return updated;
    }
  }

  // Create new destination
  const newId = item.id || `dest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: DestinationItem = {
    id: newId,
    name: item.name.trim(),
    stateOrCountry: item.stateOrCountry || "",
    coverImage: item.coverImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
    description: item.description || "",
    days: item.days || [],
    createdAt: now,
    updatedAt: now,
  };

  const next = [created, ...current];
  persistDestinations(next);

  // Save to database asynchronously
  apiSaveDestination(created);
  return created;
}

export function deleteDestination(id: string): void {
  const current = getStoredDestinations();
  const next = current.filter((d) => d.id !== id);
  persistDestinations(next);

  // Delete from database asynchronously
  apiDeleteDestination(id);
}

export function addDayToDestination(
  destinationId: string,
  day: Omit<DestinationDayTemplate, "id"> & { id?: string }
): DestinationItem | null {
  const current = getStoredDestinations();
  const destIndex = current.findIndex((d) => d.id === destinationId);
  if (destIndex === -1) return null;

  const target = current[destIndex];
  const newDayId = day.id || `day-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const dayNumber = day.dayNumber || target.days.length + 1;

  const newDay: DestinationDayTemplate = {
    id: newDayId,
    dayNumber,
    destinationCity: day.destinationCity.trim(),
    title: day.title.trim(),
    description: day.description.trim(),
    imageUrl: day.imageUrl,
    activities: day.activities,
  };

  const updatedDest: DestinationItem = {
    ...target,
    days: [...target.days, newDay],
    updatedAt: new Date().toISOString(),
  };

  current[destIndex] = updatedDest;
  persistDestinations(current);

  // Persist updated days to database asynchronously
  apiSaveDestination(updatedDest);
  return updatedDest;
}

export function updateDayInDestination(
  destinationId: string,
  updatedDay: DestinationDayTemplate
): DestinationItem | null {
  const current = getStoredDestinations();
  const destIndex = current.findIndex((d) => d.id === destinationId);
  if (destIndex === -1) return null;

  const target = current[destIndex];
  const dayIndex = target.days.findIndex((d) => d.id === updatedDay.id);
  if (dayIndex === -1) return null;

  const updatedDays = [...target.days];
  updatedDays[dayIndex] = updatedDay;

  const updatedDest: DestinationItem = {
    ...target,
    days: updatedDays,
    updatedAt: new Date().toISOString(),
  };

  current[destIndex] = updatedDest;
  persistDestinations(current);

  // Persist updated days to database asynchronously
  apiSaveDestination(updatedDest);
  return updatedDest;
}

export function deleteDayFromDestination(destinationId: string, dayId: string): DestinationItem | null {
  const current = getStoredDestinations();
  const destIndex = current.findIndex((d) => d.id === destinationId);
  if (destIndex === -1) return null;

  const target = current[destIndex];
  const remainingDays = target.days
    .filter((d) => d.id !== dayId)
    .map((d, idx) => ({ ...d, dayNumber: idx + 1 }));

  const updatedDest: DestinationItem = {
    ...target,
    days: remainingDays,
    updatedAt: new Date().toISOString(),
  };

  current[destIndex] = updatedDest;
  persistDestinations(current);

  // Persist updated days to database asynchronously
  apiSaveDestination(updatedDest);
  return updatedDest;
}

export function resetDestinationsToDefaults(): DestinationItem[] {
  persistDestinations([]);
  return [];
}
