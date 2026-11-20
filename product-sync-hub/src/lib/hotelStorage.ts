import { api } from "./api";

export interface HotelItem {
  id: string;
  name: string;
  city: string;
  rooms: string[]; // room categories/types, e.g. ["Deluxe Room", "Super Deluxe", "Executive Suite"]
  imageUrl: string;
  starRating?: string;
  defaultMealPlan?: string;
  defaultRatePerNight?: number;
  amenities?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "travel_hotel_library_v1";

export const DEFAULT_HOTELS: HotelItem[] = [];

export const DEMO_HOTEL_IDS = new Set([
  "hotel-srinagar-arco",
  "hotel-srinagar-lalit",
  "hotel-gulmarg-khyber",
  "hotel-pahalgam-pine",
  "hotel-katra-continental",
  "hotel-leh-grand-dragon",
  "hotel-manali-solang",
  "hotel-dubai-marina",
]);

export const DEMO_HOTEL_NAMES = new Set([
  "Hotel Arco",
  "The Lalit Grand Palace",
  "The Khyber Himalayan Resort & Spa",
  "Pine-n-Peak (Welcomhotel by ITC)",
  "Hotel Katra Continental",
  "The Grand Dragon",
  "Solang Valley Resort",
  "Marina Byblos Hotel",
]);

export function isDemoHotel(hotel?: Partial<HotelItem> | null): boolean {
  if (!hotel) return false;
  if (hotel.id && DEMO_HOTEL_IDS.has(hotel.id)) return true;
  if (hotel.name && DEMO_HOTEL_NAMES.has(hotel.name.trim())) return true;
  return false;
}

export function getStoredHotels(): HotelItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter((h) => !isDemoHotel(h));
      if (cleaned.length !== parsed.length) {
        persistHotels(cleaned);
      }
      return cleaned;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    console.error("Failed to load hotels from localStorage", err);
    return [];
  }
}

export function persistHotels(hotels: HotelItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hotels));
    window.dispatchEvent(new CustomEvent("hotel_library_updated", { detail: hotels }));
  } catch (err) {
    console.error("Failed to persist hotels", err);
  }
}

/**
 * Background async save to database API
 */
async function apiSaveHotel(hotel: HotelItem): Promise<HotelItem | null> {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const isNumericId = hotel.id && /^\d+$/.test(hotel.id);
    if (isNumericId) {
      const res = await api.put<{ status: string; id?: string; hotel?: HotelItem }>("/api/hotels/index.php", hotel);
      return res?.hotel || hotel;
    } else {
      const res = await api.post<{ status: string; id?: string; hotel?: HotelItem }>("/api/hotels/index.php", hotel);
      if (res?.id && res.id !== hotel.id) {
        // Update local item with database numeric ID
        const current = getStoredHotels();
        const idx = current.findIndex((h) => h.id === hotel.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], id: res.id };
          persistHotels(current);
        }
      }
      return res?.hotel || { ...hotel, id: res?.id || hotel.id };
    }
  } catch (err) {
    console.warn("Database sync for hotel failed (cached locally):", err);
    return null;
  }
}

/**
 * Background async delete from database API
 */
async function apiDeleteHotel(id: string): Promise<boolean> {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    if (/^\d+$/.test(id)) {
      await api.delete(`/api/hotels/index.php?id=${encodeURIComponent(id)}`);
    }
    return true;
  } catch (err) {
    console.warn("Database delete for hotel failed:", err);
    return false;
  }
}

/**
 * Fetches all hotels from the database.
 * If database is empty, auto-syncs local/default hotels into the database.
 */
export async function fetchHotelsFromDb(): Promise<HotelItem[]> {
  const token = localStorage.getItem("token");
  if (!token) {
    return getStoredHotels();
  }

  try {
    const res = await api.get<{ hotels: HotelItem[] }>("/api/hotels/index.php");
    if (res && Array.isArray(res.hotels)) {
      // Clean up any legacy demo hotels found in database
      const demoHotels = res.hotels.filter(isDemoHotel);
      for (const d of demoHotels) {
        if (d.id) {
          apiDeleteHotel(d.id);
        }
      }

      const realHotels = res.hotels.filter((h) => !isDemoHotel(h));
      persistHotels(realHotels);
      return realHotels;
    }
  } catch (err) {
    console.warn("Could not fetch hotels from database, falling back to local cache:", err);
  }

  return getStoredHotels();
}

/**
 * Syncs an array of hotels to the database in batch.
 */
export async function syncHotelsToDatabase(items?: HotelItem[]): Promise<{ success: boolean; count: number; error?: string }> {
  const token = localStorage.getItem("token");
  if (!token) return { success: false, count: 0, error: "Please log in to sync hotels with database" };

  const toSync = items || getStoredHotels();
  if (toSync.length === 0) return { success: true, count: 0 };

  try {
    const res = await api.post<{ status: string; hotels?: HotelItem[] }>("/api/hotels/index.php", {
      hotels: toSync.map((h) => ({
        name: h.name,
        city: h.city,
        rooms: h.rooms || ["Deluxe Room"],
        imageUrl: h.imageUrl || "",
        starRating: h.starRating || "3 Star",
        defaultMealPlan: h.defaultMealPlan || "CP (Breakfast Included)",
        defaultRatePerNight: h.defaultRatePerNight || 0,
        amenities: h.amenities || "",
        description: h.description || "",
      })),
    });

    if (res.hotels && res.hotels.length > 0) {
      persistHotels(res.hotels);
      return { success: true, count: res.hotels.length };
    }
    return { success: true, count: toSync.length };
  } catch (batchErr: any) {
    // Fallback: If server returns error on batch, try saving items one-by-one
    try {
      let savedCount = 0;
      for (const h of toSync) {
        await api.post("/api/hotels/index.php", {
          name: h.name,
          city: h.city,
          rooms: h.rooms || ["Deluxe Room"],
          imageUrl: h.imageUrl || "",
          starRating: h.starRating || "3 Star",
          defaultMealPlan: h.defaultMealPlan || "CP (Breakfast Included)",
          defaultRatePerNight: h.defaultRatePerNight || 0,
          amenities: h.amenities || "",
          description: h.description || "",
        });
        savedCount++;
      }
      return { success: true, count: savedCount };
    } catch (fallbackErr: any) {
      console.error("Failed to sync hotels to database:", fallbackErr);
      return { success: false, count: 0, error: fallbackErr?.message || batchErr?.message || "Failed to sync hotels to database" };
    }
  }
}

export function saveHotel(item: {
  id?: string;
  name: string;
  city: string;
  rooms?: string[] | string;
  imageUrl?: string;
  starRating?: string;
  defaultMealPlan?: string;
  defaultRatePerNight?: number;
  amenities?: string;
  description?: string;
}): HotelItem {
  const current = getStoredHotels();
  const now = new Date().toISOString();

  // Normalize rooms to string array
  let normalizedRooms: string[] = [];
  if (Array.isArray(item.rooms)) {
    normalizedRooms = item.rooms.map((r) => r.trim()).filter(Boolean);
  } else if (typeof item.rooms === "string") {
    normalizedRooms = item.rooms
      .split(/[,;\n]+/)
      .map((r) => r.trim())
      .filter(Boolean);
  }
  if (normalizedRooms.length === 0) {
    normalizedRooms = ["Deluxe Room"];
  }

  if (item.id) {
    const idx = current.findIndex((h) => h.id === item.id);
    if (idx !== -1) {
      const updated: HotelItem = {
        ...current[idx],
        name: item.name.trim(),
        city: item.city.trim(),
        rooms: normalizedRooms,
        imageUrl: item.imageUrl || current[idx].imageUrl || "",
        starRating: item.starRating || current[idx].starRating,
        defaultMealPlan: item.defaultMealPlan || current[idx].defaultMealPlan,
        defaultRatePerNight: item.defaultRatePerNight !== undefined ? item.defaultRatePerNight : current[idx].defaultRatePerNight,
        amenities: item.amenities !== undefined ? item.amenities : current[idx].amenities,
        description: item.description !== undefined ? item.description : current[idx].description,
        updatedAt: now,
      };
      current[idx] = updated;
      persistHotels(current);

      // Save to database asynchronously
      apiSaveHotel(updated);
      return updated;
    }
  }

  // Create new hotel
  const newId = item.id || `hotel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: HotelItem = {
    id: newId,
    name: item.name.trim(),
    city: item.city.trim(),
    rooms: normalizedRooms,
    imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200",
    starRating: item.starRating || "3 Star",
    defaultMealPlan: item.defaultMealPlan || "CP (Breakfast Included)",
    defaultRatePerNight: item.defaultRatePerNight || 0,
    amenities: item.amenities || "",
    description: item.description || "",
    createdAt: now,
    updatedAt: now,
  };

  const next = [created, ...current];
  persistHotels(next);

  // Save to database asynchronously
  apiSaveHotel(created);
  return created;
}

export function deleteHotel(id: string): void {
  const current = getStoredHotels();
  const next = current.filter((h) => h.id !== id);
  persistHotels(next);

  // Delete from database asynchronously
  apiDeleteHotel(id);
}

export function resetHotelsToDefaults(): HotelItem[] {
  persistHotels([]);
  return [];
}
