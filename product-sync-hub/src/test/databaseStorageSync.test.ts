import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredDestinations,
  saveDestination,
  deleteDestination,
  addDayToDestination,
  fetchDestinationsFromDb,
  syncDestinationsToDatabase,
  resetDestinationsToDefaults,
} from "../lib/destinationStorage";
import {
  getStoredHotels,
  saveHotel,
  deleteHotel,
  fetchHotelsFromDb,
  syncHotelsToDatabase,
  resetHotelsToDefaults,
} from "../lib/hotelStorage";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Destinations Database Sync", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "mock-valid-jwt-token");
    vi.clearAllMocks();
  });

  it("saves destination to local storage and dispatches API call to database", async () => {
    (api.post as any).mockResolvedValueOnce({
      status: "success",
      id: "99",
      destination: { id: "99", name: "Goa Beach Holiday", days: [] },
    });

    const item = saveDestination({
      name: "Goa Beach Holiday",
      stateOrCountry: "Goa, India",
      description: "Sun, sand and sea",
    });

    expect(item.name).toBe("Goa Beach Holiday");
    const stored = getStoredDestinations();
    expect(stored.some((d) => d.name === "Goa Beach Holiday")).toBe(true);

    // Verify API call was made to backend
    expect(api.post).toHaveBeenCalledWith(
      "/api/destinations/index.php",
      expect.objectContaining({ name: "Goa Beach Holiday" })
    );
  });

  it("updates existing destination in database using PUT", async () => {
    (api.put as any).mockResolvedValueOnce({
      status: "success",
      id: "42",
      destination: { id: "42", name: "Updated Goa", days: [] },
    });

    // Save with numeric database id
    const updated = saveDestination({
      id: "42",
      name: "Updated Goa",
      stateOrCountry: "Goa, India",
    });

    expect(updated.name).toBe("Updated Goa");
    expect(api.put).toHaveBeenCalledWith(
      "/api/destinations/index.php",
      expect.objectContaining({ id: "42", name: "Updated Goa" })
    );
  });

  it("deletes destination and calls DELETE API", async () => {
    (api.delete as any).mockResolvedValueOnce({ status: "success" });

    deleteDestination("42");
    expect(api.delete).toHaveBeenCalledWith("/api/destinations/index.php?id=42");
  });

  it("fetches destinations from database and updates local storage cache", async () => {
    const dbDestinations = [
      {
        id: "101",
        name: "Switzerland Alps Tour",
        stateOrCountry: "Switzerland",
        days: [],
      },
    ];

    (api.get as any).mockResolvedValueOnce({ destinations: dbDestinations });

    const result = await fetchDestinationsFromDb();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Switzerland Alps Tour");
    expect(getStoredDestinations()[0].name).toBe("Switzerland Alps Tour");
  });
});

describe("Hotels Database Sync", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "mock-valid-jwt-token");
    vi.clearAllMocks();
  });

  it("saves hotel to local storage and dispatches API call to database", async () => {
    (api.post as any).mockResolvedValueOnce({
      status: "success",
      id: "77",
      hotel: { id: "77", name: "Taj Exotica Goa", city: "Goa" },
    });

    const hotel = saveHotel({
      name: "Taj Exotica Goa",
      city: "Goa",
      rooms: ["Deluxe Villa", "Sea View Suite"],
      starRating: "5 Star Luxury",
      defaultRatePerNight: 25000,
    });

    expect(hotel.name).toBe("Taj Exotica Goa");
    const stored = getStoredHotels();
    expect(stored.some((h) => h.name === "Taj Exotica Goa")).toBe(true);

    expect(api.post).toHaveBeenCalledWith(
      "/api/hotels/index.php",
      expect.objectContaining({ name: "Taj Exotica Goa", city: "Goa" })
    );
  });

  it("updates existing hotel in database using PUT", async () => {
    (api.put as any).mockResolvedValueOnce({
      status: "success",
      id: "55",
      hotel: { id: "55", name: "Updated Taj Exotica", city: "Goa" },
    });

    saveHotel({
      id: "55",
      name: "Updated Taj Exotica",
      city: "Goa",
    });

    expect(api.put).toHaveBeenCalledWith(
      "/api/hotels/index.php",
      expect.objectContaining({ id: "55", name: "Updated Taj Exotica" })
    );
  });

  it("deletes hotel and calls DELETE API", async () => {
    (api.delete as any).mockResolvedValueOnce({ status: "success" });

    deleteHotel("55");
    expect(api.delete).toHaveBeenCalledWith("/api/hotels/index.php?id=55");
  });

  it("fetches hotels from database and updates local storage cache", async () => {
    const dbHotels = [
      {
        id: "201",
        name: "Burj Al Arab",
        city: "Dubai",
        rooms: ["Deluxe Suite"],
        imageUrl: "",
        starRating: "5 Star Luxury",
      },
    ];

    (api.get as any).mockResolvedValueOnce({ hotels: dbHotels });

    const result = await fetchHotelsFromDb();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Burj Al Arab");
    expect(getStoredHotels()[0].name).toBe("Burj Al Arab");
  });
});
