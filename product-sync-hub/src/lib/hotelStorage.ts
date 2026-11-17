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

export const DEFAULT_HOTELS: HotelItem[] = [
  {
    id: "hotel-srinagar-arco",
    name: "Hotel Arco",
    city: "Srinagar",
    rooms: ["Standard Deluxe Room", "Executive Valley Room", "Family Heritage Suite"],
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200",
    starRating: "4 Star",
    defaultMealPlan: "CP (Breakfast Included)",
    defaultRatePerNight: 4500,
    amenities: "Free High-Speed Wi-Fi, 24/7 Central Heating, Buffet Breakfast, Travel Desk",
    description: "Centrally located premium hotel in Srinagar offering modern luxury and warm Kashmiri hospitality."
  },
  {
    id: "hotel-srinagar-lalit",
    name: "The Lalit Grand Palace",
    city: "Srinagar",
    rooms: ["Deluxe Heritage Room", "Palace Suite", "Royal Dal Lake View Suite"],
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200",
    starRating: "5 Star Luxury",
    defaultMealPlan: "CP (Breakfast Included)",
    defaultRatePerNight: 18000,
    amenities: "Historic Royal Property, Dal Lake View, Spa & Wellness, Fine Dining",
    description: "Former royal palace designed by Maharaja Pratap Singh overlooking the picturesque Dal Lake."
  },
  {
    id: "hotel-gulmarg-khyber",
    name: "The Khyber Himalayan Resort & Spa",
    city: "Gulmarg",
    rooms: ["Premier Pine View Room", "Luxury Mountain View", "Gulmarg Heritage Suite", "2-Bedroom Luxury Cottage"],
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200",
    starRating: "5 Star Luxury",
    defaultMealPlan: "MAP (Breakfast + Dinner)",
    defaultRatePerNight: 22000,
    amenities: "Ski-in/Ski-out, Heated Indoor Swimming Pool, L'Occitane Spa, Gondola Proximity",
    description: "World-class alpine luxury resort set amidst pristine pir panjal mountain range."
  },
  {
    id: "hotel-pahalgam-pine",
    name: "Pine-n-Peak (Welcomhotel by ITC)",
    city: "Pahalgam",
    rooms: ["Superior Room", "Deluxe Pine View", "Lidder River Suite", "Executive Pine Cottage"],
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200",
    starRating: "5 Star Luxury",
    defaultMealPlan: "MAP (Breakfast + Dinner)",
    defaultRatePerNight: 14500,
    amenities: "Lidder River Views, Aru Valley Road, Pine Wood Architecture, Bonfire Lounge",
    description: "Premier luxury retreat situated on the Rajwas Plateau with panoramic views of Pahalgam."
  },
  {
    id: "hotel-katra-continental",
    name: "Hotel Katra Continental",
    city: "Katra",
    rooms: ["Deluxe Room", "Super Deluxe Room", "Executive Yatra Suite", "Family 4-Bed Room"],
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1200",
    starRating: "4 Star",
    defaultMealPlan: "CP (Breakfast Included)",
    defaultRatePerNight: 3200,
    amenities: "Free Yatra Helipad / Banganga Drop, Pure Vegetarian Kitchen, 24/7 Hot Water",
    description: "Conveniently located for Mata Vaishno Devi pilgrims with dedicated shuttle services."
  },
  {
    id: "hotel-leh-grand-dragon",
    name: "The Grand Dragon",
    city: "Leh, Ladakh",
    rooms: ["Deluxe Room", "Heritage Suite", "Premier Mountain View Suite"],
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1200",
    starRating: "5 Star Luxury",
    defaultMealPlan: "MAP (Breakfast + Dinner)",
    defaultRatePerNight: 12000,
    amenities: "Oxygen Enrichment on Demand, Centrally Heated, Solar Powered, Stok Kangri View",
    description: "Ladakh's first luxury eco-friendly hotel with stunning mountain views."
  },
  {
    id: "hotel-manali-solang",
    name: "Solang Valley Resort",
    city: "Manali",
    rooms: ["Deluxe Valley Room", "Glacier Suite", "Machan River View Cottage"],
    imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1200",
    starRating: "4 Star",
    defaultMealPlan: "MAP (Breakfast + Dinner)",
    defaultRatePerNight: 6500,
    amenities: "Solang Snow Valley Proximity, Beas River View, Adventure Desk, Lawn Bonfire",
    description: "Nestled right inside Solang Valley surrounded by snow peaks and pine forests."
  },
  {
    id: "hotel-dubai-marina",
    name: "Marina Byblos Hotel",
    city: "Dubai",
    rooms: ["Standard Deluxe Room", "Executive Suite", "Marina View Suite"],
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200",
    starRating: "4 Star",
    defaultMealPlan: "BB (Breakfast Included)",
    defaultRatePerNight: 8500,
    amenities: "Rooftop Swimming Pool, Near DMCC Metro Station, 5-min walk to JBR Beach",
    description: "Vibrant city hotel in the heart of Dubai Marina close to all major attractions."
  }
];

export function getStoredHotels(): HotelItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HOTELS));
      return DEFAULT_HOTELS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HOTELS));
    return DEFAULT_HOTELS;
  } catch (err) {
    console.error("Failed to load hotels from localStorage", err);
    return DEFAULT_HOTELS;
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
      if (res.hotels.length > 0) {
        persistHotels(res.hotels);
        return res.hotels;
      } else {
        // Database is empty for this user: auto-seed from local library into database
        const local = getStoredHotels();
        if (local.length > 0) {
          await syncHotelsToDatabase(local);
        }
        return local;
      }
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
  persistHotels(DEFAULT_HOTELS);
  syncHotelsToDatabase(DEFAULT_HOTELS);
  return DEFAULT_HOTELS;
}
