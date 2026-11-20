import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  ItineraryPdfDocument,
  ItineraryPdfData,
  resolveImageUrl,
  getCompanyProfile,
} from "@/components/ItineraryPdfDocument";
import { User } from "@/lib/types";

const minimalPdfData: ItineraryPdfData = {
  clientName: "Test Client",
  tripTitle: "Kashmir Tour",
  destination: "Srinagar",
  startDate: "2026-11-20",
  endDate: "2026-11-25",
  duration: "5 Nights / 6 Days",
  dateRange: "20 Nov 2026 - 25 Nov 2026",
  adults: "2",
  children: "0",
  theme: "luxury",
  finalRate: "25000",
  heroImage: "",
  flights: [],
  hotels: [],
  transports: [],
  days: [
    {
      day: 1,
      destination: "Srinagar",
      title: "Arrival",
      activities: "",
      description: "Welcome to Kashmir",
      images: [],
      highlights: [],
    },
  ],
};

describe("Company Logo Resolution and Database Fetch across Devices", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes insecure and non-www holidaysbindas URLs to canonical HTTPS with www", () => {
    // 1. Insecure http without www
    const httpApex = "http://holidaysbindas.com/backend/backend/uploads/1_logo_123.png";
    expect(resolveImageUrl(httpApex)).toBe(
      "https://www.holidaysbindas.com/backend/backend/uploads/1_logo_123.png"
    );

    // 2. Secure https without www (which causes WordPress 301 cross-origin CORS redirect)
    const httpsApex = "https://holidaysbindas.com/backend/backend/uploads/1_logo_123.png";
    expect(resolveImageUrl(httpsApex)).toBe(
      "https://www.holidaysbindas.com/backend/backend/uploads/1_logo_123.png"
    );

    // 3. Already canonical
    const canonical = "https://www.holidaysbindas.com/backend/backend/uploads/1_logo_123.png";
    expect(resolveImageUrl(canonical)).toBe(canonical);

    // 4. Base64 data URL remains unchanged
    const b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    expect(resolveImageUrl(b64)).toBe(b64);

    // 5. Insecure third-party URL is auto-upgraded to https to prevent mixed content
    expect(resolveImageUrl("http://cdn.example.com/logo.jpg")).toBe("https://cdn.example.com/logo.jpg");
  });

  it("fetches company logo directly from user database profile when logging in from another device without local storage", () => {
    // Simulate brand new device: localStorage is completely empty!
    expect(localStorage.getItem("agency_company_profile")).toBeNull();
    expect(localStorage.getItem("agency_company_logo_data")).toBeNull();

    const dbUser: User = {
      id: 1,
      email: "khannaveed7006@gmail.com",
      company_name: "HOLIDAYS BINDAS",
      company_logo: "http://holidaysbindas.com/backend/backend/uploads/1_logo_1795156.png",
      company_phone: "+919906515550",
      company_email: "khannaveed7006@gmail.com",
      company_address: "Rainawari Chowk, Near Jawahar Lal Nehru Memorial Hospital",
      company_website: "holidaysbindas.com",
    };

    const company = getCompanyProfile(dbUser);
    expect(company.name).toBe("HOLIDAYS BINDAS");
    // Should get logo from dbUser
    expect(company.logo).toBe("http://holidaysbindas.com/backend/backend/uploads/1_logo_1795156.png");

    // Rendering ItineraryPdfDocument with dbUser on new device
    const { container } = render(
      <ItineraryPdfDocument data={minimalPdfData} user={dbUser} />
    );

    // Should render img tag with canonicalized https://www.holidaysbindas.com URL
    const img = container.querySelector("img[alt='HOLIDAYS BINDAS']") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toBe("https://www.holidaysbindas.com/backend/backend/uploads/1_logo_1795156.png");
  });

  it("caches database logo into localStorage for fast offline rendering", () => {
    const dbUser: User = {
      id: 1,
      email: "khannaveed7006@gmail.com",
      company_name: "HOLIDAYS BINDAS",
      company_logo: "https://www.holidaysbindas.com/backend/backend/uploads/1_logo_abc.png",
    };

    getCompanyProfile(dbUser);
    expect(localStorage.getItem("agency_company_logo_data")).toBe(
      "https://www.holidaysbindas.com/backend/backend/uploads/1_logo_abc.png"
    );
  });

  it("falls back gracefully to localStorage if user object is temporarily null or loading", () => {
    localStorage.setItem("agency_company_profile", JSON.stringify({
      company_name: "HOLIDAYS BINDAS",
      company_logo: "https://www.holidaysbindas.com/backend/backend/uploads/cached.png",
    }));

    const company = getCompanyProfile(null);
    expect(company.name).toBe("HOLIDAYS BINDAS");
    expect(company.logo).toBe("https://www.holidaysbindas.com/backend/backend/uploads/cached.png");
  });

  it("extracts website, phone, instagram, and facebook directly from user database profile", () => {
    const dbUser: User = {
      id: 1,
      email: "khannaveed7006@gmail.com",
      company_name: "HOLIDAYS BINDAS",
      company_website: "https://www.holidaysbindas.com",
      company_phone: "+919906515550",
      company_instagram: "@holidaysbindas",
      company_facebook: "facebook.com/holidaysbindas",
    };

    const company = getCompanyProfile(dbUser);
    expect(company.name).toBe("HOLIDAYS BINDAS");
    expect(company.website).toBe("https://www.holidaysbindas.com");
    expect(company.phone).toBe("+919906515550");
    expect(company.instagram).toBe("@holidaysbindas");
    expect(company.facebook).toBe("facebook.com/holidaysbindas");
  });
});
