import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_DESTINATIONS,
  getStoredDestinations,
  saveDestination,
  deleteDestination,
  addDayToDestination,
  fetchDestinationsFromDb,
  syncDestinationsToDatabase,
  resetDestinationsToDefaults,
} from "../lib/destinationStorage";
import {
  DEFAULT_HOTELS,
  getStoredHotels,
  saveHotel,
  deleteHotel,
  fetchHotelsFromDb,
  syncHotelsToDatabase,
  resetHotelsToDefaults,
} from "../lib/hotelStorage";
import {
  getRecentQuotations,
  getStoredQuotations,
  saveQuotation,
  updateQuotationStatus,
  updateQuotation,
  deleteQuotation,
  fetchQuotationsFromDb,
  syncQuotationsToDatabase,
} from "../lib/quotationStorage";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Destinations Database Sync & Demo Data Removal", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "mock-valid-jwt-token");
    vi.clearAllMocks();
  });

  it("has empty DEFAULT_DESTINATIONS and getStoredDestinations returns empty array by default", () => {
    expect(DEFAULT_DESTINATIONS).toEqual([]);
    expect(getStoredDestinations()).toEqual([]);
  });

  it("filters out and purges legacy demo destinations from localStorage", () => {
    const legacy = [
      { id: "dest-kashmir", name: "Kashmir Paradise", days: [] },
      { id: "dest-custom", name: "Custom Paris Tour", days: [] },
      { id: "dest-dubai", name: "Dazzling Dubai & Desert Wonders", days: [] },
    ];
    localStorage.setItem("travel_destination_library_v1", JSON.stringify(legacy));

    const stored = getStoredDestinations();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Custom Paris Tour");
    // Verify localStorage was updated to purge demo data
    const rawAfter = JSON.parse(localStorage.getItem("travel_destination_library_v1") || "[]");
    expect(rawAfter).toHaveLength(1);
    expect(rawAfter[0].name).toBe("Custom Paris Tour");
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

  it("fetches destinations from database, purges demo destinations and updates local cache", async () => {
    const dbDestinations = [
      {
        id: "101",
        name: "Switzerland Alps Tour",
        stateOrCountry: "Switzerland",
        days: [],
      },
      {
        id: "102",
        name: "Kashmir Paradise",
        stateOrCountry: "India",
        days: [],
      },
    ];

    (api.get as any).mockResolvedValueOnce({ destinations: dbDestinations });
    (api.delete as any).mockResolvedValueOnce({ status: "success" });

    const result = await fetchDestinationsFromDb();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Switzerland Alps Tour");
    expect(getStoredDestinations()[0].name).toBe("Switzerland Alps Tour");
    // Verify delete was dispatched for the demo destination in DB
    expect(api.delete).toHaveBeenCalledWith("/api/destinations/index.php?id=102");
  });
});

describe("Hotels Database Sync & Demo Data Removal", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "mock-valid-jwt-token");
    vi.clearAllMocks();
  });

  it("has empty DEFAULT_HOTELS and getStoredHotels returns empty array by default", () => {
    expect(DEFAULT_HOTELS).toEqual([]);
    expect(getStoredHotels()).toEqual([]);
  });

  it("filters out and purges legacy demo hotels from localStorage", () => {
    const legacy = [
      { id: "hotel-srinagar-arco", name: "Hotel Arco", city: "Srinagar", rooms: ["Deluxe"] },
      { id: "hotel-custom-1", name: "My Luxury Villa", city: "Udaipur", rooms: ["Palace Suite"] },
      { id: "hotel-dubai-marina", name: "Marina Byblos Hotel", city: "Dubai", rooms: ["Deluxe"] },
    ];
    localStorage.setItem("travel_hotel_library_v1", JSON.stringify(legacy));

    const stored = getStoredHotels();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("My Luxury Villa");
    // Verify localStorage was updated to purge demo data
    const rawAfter = JSON.parse(localStorage.getItem("travel_hotel_library_v1") || "[]");
    expect(rawAfter).toHaveLength(1);
    expect(rawAfter[0].name).toBe("My Luxury Villa");
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

  it("fetches hotels from database, purges demo hotels and updates local cache", async () => {
    const dbHotels = [
      {
        id: "201",
        name: "Burj Al Arab",
        city: "Dubai",
        rooms: ["Deluxe Suite"],
        imageUrl: "",
        starRating: "5 Star Luxury",
      },
      {
        id: "202",
        name: "Hotel Arco",
        city: "Srinagar",
        rooms: ["Deluxe Room"],
        imageUrl: "",
        starRating: "4 Star",
      },
    ];

    (api.get as any).mockResolvedValueOnce({ hotels: dbHotels });
    (api.delete as any).mockResolvedValueOnce({ status: "success" });

    const result = await fetchHotelsFromDb();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Burj Al Arab");
    expect(getStoredHotels()[0].name).toBe("Burj Al Arab");
    // Verify delete was dispatched for the demo hotel in DB
    expect(api.delete).toHaveBeenCalledWith("/api/hotels/index.php?id=202");
  });
});

describe("Quotations Database Sync & Cross-Device Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "mock-valid-jwt-token");
    vi.clearAllMocks();
  });

  it("saves quotation locally and dispatches API call to database", async () => {
    (api.post as any).mockResolvedValueOnce({
      status: "success",
      id: "qt-101",
      quotation: {
        id: "qt-101",
        clientName: "Vishal",
        tripTitle: "Kashmir Tour 5 Days",
        finalQuotationTotal: 18900,
        status: "Converted",
      },
    });

    const saved = saveQuotation({
      id: "qt-101",
      quotationRef: "QT-20261113-269",
      quotationDate: "13 Nov 2026",
      clientName: "Vishal",
      clientEmail: "vishal@example.com",
      clientPhone: "9876543210",
      clientAddress: "Srinagar",
      adults: "2",
      children: "0",
      infants: "0",
      roomsCount: "1",
      mealPlan: "MAP",
      packageType: "Full Package",
      tripTitle: "Kashmir Tour 5 Days",
      destination: "Kashmir",
      startDate: "2026-11-20",
      endDate: "2026-11-25",
      theme: "Family",
      heroImage: "",
      days: [],
      hotels: [],
      transports: [],
      sightseeings: [],
      flights: [],
      trains: [],
      otherServices: [],
      inclusions: [],
      exclusions: [],
      clientNotes: "",
      selectedTheme: "blue",
      includeCoverPage: true,
      gstRate: 0,
      tcsRate: 0,
      discountAmount: 0,
      finalQuotationTotal: 18900,
      status: "Converted",
    });

    expect(saved.clientName).toBe("Vishal");
    expect(saved.finalQuotationTotal).toBe(18900);
    expect(getStoredQuotations().some((q) => q.clientName === "Vishal")).toBe(true);

    // Verify API call was dispatched to backend database endpoint
    expect(api.post).toHaveBeenCalledWith(
      "/api/quotations/index.php",
      expect.objectContaining({
        clientName: "Vishal",
        finalQuotationTotal: 18900,
      })
    );
  });

  it("updates quotation status locally and dispatches PUT API call to database", async () => {
    (api.post as any).mockResolvedValue({ status: "success" });
    (api.put as any).mockResolvedValueOnce({
      status: "success",
      quotation: { id: "qt-102", status: "Converted" },
    });

    saveQuotation({
      id: "qt-102",
      quotationRef: "QT-20261113-270",
      quotationDate: "13 Nov 2026",
      clientName: "Rohit",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      adults: "2",
      children: "0",
      infants: "0",
      roomsCount: "1",
      mealPlan: "",
      packageType: "Full Package",
      tripTitle: "Goa Holidays",
      destination: "Goa",
      startDate: "",
      endDate: "",
      theme: "",
      heroImage: "",
      days: [],
      hotels: [],
      transports: [],
      sightseeings: [],
      flights: [],
      trains: [],
      otherServices: [],
      inclusions: [],
      exclusions: [],
      clientNotes: "",
      selectedTheme: "",
      includeCoverPage: true,
      gstRate: 0,
      tcsRate: 0,
      discountAmount: 0,
      finalQuotationTotal: 25000,
      status: "In Progress",
    });

    updateQuotationStatus("qt-102", "Converted");

    expect(getStoredQuotations().find((q) => q.id === "qt-102")?.status).toBe("Converted");
    expect(api.put).toHaveBeenCalledWith(
      "/api/quotations/index.php",
      expect.objectContaining({ id: "qt-102", status: "Converted" })
    );
  });

  it("deletes quotation locally and dispatches DELETE API call to database", async () => {
    (api.delete as any).mockResolvedValueOnce({ status: "success" });

    deleteQuotation("qt-102");
    expect(api.delete).toHaveBeenCalledWith("/api/quotations/index.php?id=qt-102");
  });

  it("fetches quotations from database on login/another device and populates local store", async () => {
    const remoteQuotations = [
      {
        id: "qt-remote-1",
        quotationRef: "QT-REMOTE-1",
        quotationDate: "14 Nov 2026",
        clientName: "Remote Client 1",
        tripTitle: "Remote Device Package 1",
        destination: "Manali",
        finalQuotationTotal: 30000,
        status: "Converted",
        createdAt: "2026-11-14T10:00:00Z",
        updatedAt: "2026-11-14T10:00:00Z",
      },
      {
        id: "qt-remote-2",
        quotationRef: "QT-REMOTE-2",
        quotationDate: "15 Nov 2026",
        clientName: "Remote Client 2",
        tripTitle: "Remote Device Package 2",
        destination: "Ladakh",
        finalQuotationTotal: 45000,
        status: "In Progress",
        createdAt: "2026-11-15T12:00:00Z",
        updatedAt: "2026-11-15T12:00:00Z",
      },
    ];

    (api.get as any).mockResolvedValueOnce({ quotations: remoteQuotations });

    // Local storage is empty initially (simulate new browser / other device)
    expect(getStoredQuotations()).toHaveLength(0);

    const result = await fetchQuotationsFromDb();
    expect(result).toHaveLength(2);
    expect(result[0].clientName).toBe("Remote Client 2");
    expect(result[1].clientName).toBe("Remote Client 1");

    // Local storage now has the remote quotes from the database
    expect(getStoredQuotations()).toHaveLength(2);
    expect(getRecentQuotations(5)).toHaveLength(2);
  });

  it("auto-syncs local quotations to database if database is empty", async () => {
    (api.post as any).mockResolvedValue({ status: "success" });

    // Seed local quotation
    saveQuotation({
      id: "qt-local-pre",
      quotationRef: "QT-LOCAL",
      quotationDate: "10 Nov 2026",
      clientName: "Pre-existing Local Client",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      adults: "2",
      children: "0",
      infants: "0",
      roomsCount: "1",
      mealPlan: "",
      packageType: "Full Package",
      tripTitle: "Local Only Trip",
      destination: "Delhi",
      startDate: "",
      endDate: "",
      theme: "",
      heroImage: "",
      days: [],
      hotels: [],
      transports: [],
      sightseeings: [],
      flights: [],
      trains: [],
      otherServices: [],
      inclusions: [],
      exclusions: [],
      clientNotes: "",
      selectedTheme: "",
      includeCoverPage: true,
      gstRate: 0,
      tcsRate: 0,
      discountAmount: 0,
      finalQuotationTotal: 12000,
      status: "In Progress",
    });

    vi.clearAllMocks();
    // Server returns empty array
    (api.get as any).mockResolvedValueOnce({ quotations: [] });
    (api.post as any).mockResolvedValueOnce({
      status: "success",
      quotations: getStoredQuotations(),
    });

    const result = await fetchQuotationsFromDb();
    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe("Pre-existing Local Client");

    // Verifies batch auto-sync was triggered to save to database
    expect(api.post).toHaveBeenCalledWith(
      "/api/quotations/index.php",
      expect.objectContaining({ quotations: expect.any(Array) })
    );
  });
});
