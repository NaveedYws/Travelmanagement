import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  downloadPaymentReceiptPdf,
  downloadPaymentsSummaryPdf,
  resolveCompanyProfile,
} from "@/lib/paymentPdf";
import { SavedQuotation } from "@/lib/types";

// Mock jsPDF
vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      setFillColor: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      setLineDashPattern: vi.fn(),
      setTextColor: vi.fn(),
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      circle: vi.fn(),
      line: vi.fn(),
      text: vi.fn(),
      addImage: vi.fn(),
      save: vi.fn(),
    })),
  };
});

describe("paymentPdf utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("resolves company profile with name, phone, email, and logo", () => {
    localStorage.setItem(
      "agency_company_profile",
      JSON.stringify({
        company_name: "Kashmir Horizons Travels",
        company_phone: "+91 99999 12345",
        company_email: "info@kashmirhorizons.com",
        company_address: "Srinagar, Kashmir",
        company_website: "www.kashmirhorizons.com",
      })
    );
    localStorage.setItem("agency_company_logo_data", "data:image/png;base64,iVBORw0KGgo=");

    const profile = resolveCompanyProfile();

    expect(profile.name).toBe("Kashmir Horizons Travels");
    expect(profile.phone).toBe("+91 99999 12345");
    expect(profile.email).toBe("info@kashmirhorizons.com");
    expect(profile.address).toBe("Srinagar, Kashmir");
    expect(profile.website).toBe("www.kashmirhorizons.com");
    expect(profile.logo).toContain("data:image/png;base64");
  });

  it("generates payment receipt PDF with company profile and official stamp", () => {
    const mockQuote: SavedQuotation = {
      id: "quote-test-1",
      quotationRef: "QT-20261113-999",
      quotationDate: "13 Nov 2026",
      validUntilDate: "13 Dec 2026",
      clientName: "Rahil Sheikh",
      clientEmail: "rahil@example.com",
      clientPhone: "+91 9876543210",
      clientAddress: "Srinagar",
      adults: "2",
      children: "0",
      infants: "0",
      roomsCount: "1",
      mealPlan: "MAP",
      packageType: "Full Package",
      tripTitle: "5 Days 4 Nights Kashmir Tour",
      destination: "Kashmir",
      startDate: "2026-11-20",
      endDate: "2026-11-25",
      theme: "Standard",
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
      selectedTheme: "teal",
      includeCoverPage: false,
      gstRate: 5,
      tcsRate: 0,
      discountAmount: 0,
      finalQuotationTotal: 18900,
      paidAmount: 18900,
      paymentRecorded: true,
      paymentMethod: "UPI / QR Code",
      paymentDate: "13 Nov 2026",
      paymentStatus: "Paid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filename = downloadPaymentReceiptPdf(mockQuote, {
      name: "Trip Flow Travel Agency",
      phone: "+91 98765 00000",
      email: "booking@tripflow.com",
      address: "Lal Chowk, Srinagar",
      website: "www.tripflow.com",
      logo: "data:image/png;base64,mockLogo",
    });

    expect(filename).toBe("Receipt_Rahil_Sheikh_QT-20261113-999.pdf");
  });

  it("generates payments summary ledger PDF report", () => {
    const filename = downloadPaymentsSummaryPdf([], "Trip Flow Travel Agency");
    expect(filename).toContain("Payments_Report_");
  });
});
