import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LeadBoard, LEAD_STATUS_OPTIONS } from "@/components/LeadBoard";
import {
  saveQuotation,
  getStoredQuotations,
  updateQuotationStatus,
  SaveQuotationInput,
} from "@/lib/quotationStorage";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, email: "agency@example.com", company_name: "Trip Flow" },
    businessType: "travel",
    role: "admin",
    signOut: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ message: "Saved", id: 1 }),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function makeQuotationInput(overrides: Partial<SaveQuotationInput> = {}): SaveQuotationInput {
  return {
    quotationRef: `QT-20261113-${Math.floor(100 + Math.random() * 900)}`,
    quotationDate: "13 Nov 2026",
    validUntilDate: "13 Dec 2026",
    rateDisplayMode: "subtotal",
    clientName: "Rohan Verma",
    clientEmail: "rohan@example.com",
    clientPhone: "+91 9876543210",
    clientAddress: "Mumbai",
    adults: "2",
    children: "1",
    infants: "0",
    roomsCount: "1",
    mealPlan: "MAP (Breakfast & Dinner)",
    packageType: "Full Package",
    tripTitle: "Kashmir Tour Package",
    destination: "Kashmir",
    startDate: "2026-12-01",
    endDate: "2026-12-06",
    theme: "Honeymoon",
    heroImage: "",
    days: [],
    hotels: [],
    transports: [],
    sightseeings: [],
    flights: [],
    trains: [],
    otherServices: [],
    inclusions: ["All meals included", "Sedan transport"],
    exclusions: ["Airfare"],
    clientNotes: "Special request for lake view room",
    selectedTheme: "teal",
    includeCoverPage: false,
    gstRate: 5,
    tcsRate: 0,
    discountAmount: 0,
    finalQuotationTotal: 48500,
    status: "In Progress",
    ...overrides,
  };
}

describe("LeadBoard component and quotation status tracking", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders empty state when there are no quotations", () => {
    render(<LeadBoard />);
    expect(screen.getByText(/Lead Board/i)).toBeInTheDocument();
    expect(screen.getByText(/No leads on the board yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Your First Quotation/i)).toBeInTheDocument();
  });

  it("displays client name, date, quoted amount, and status dropdown when quotation is created/downloaded", () => {
    saveQuotation(
      makeQuotationInput({
        clientName: "Aarav Sharma",
        quotationDate: "14 Nov 2026",
        finalQuotationTotal: 65000,
        tripTitle: "5N/6D Kashmir Paradise",
        destination: "Srinagar & Gulmarg",
        status: "In Progress",
      })
    );

    render(<LeadBoard />);

    expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
    expect(screen.getByText("14 Nov 2026")).toBeInTheDocument();
    expect(screen.getAllByText("₹65,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("5N/6D Kashmir Paradise")).toBeInTheDocument();
    // Live status dropdown is present
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThanOrEqual(1);
  });

  it("updates quotation lead status to Hold, Converted, Active, or Cancel via updateQuotationStatus and persists", () => {
    const saved = saveQuotation(
      makeQuotationInput({
        id: "qt-test-status-1",
        clientName: "Priya Patel",
        finalQuotationTotal: 72000,
        status: "In Progress",
      })
    );

    expect(saved.status).toBe("In Progress");

    // Update status to Converted
    const updated = updateQuotationStatus(saved.id, "Converted");
    expect(updated?.status).toBe("Converted");

    const inStorage = getStoredQuotations().find((q) => q.id === saved.id);
    expect(inStorage?.status).toBe("Converted");

    // Update to Hold
    const updatedHold = updateQuotationStatus(saved.id, "Hold");
    expect(updatedHold?.status).toBe("Hold");

    // Update to Active
    const updatedActive = updateQuotationStatus(saved.id, "Active");
    expect(updatedActive?.status).toBe("Active");

    // Update to Completed
    const updatedCompleted = updateQuotationStatus(saved.id, "Completed");
    expect(updatedCompleted?.status).toBe("Completed");

    // Update to Canceled
    const updatedCancel = updateQuotationStatus(saved.id, "Canceled");
    expect(updatedCancel?.status).toBe("Canceled");
  });

  it("supports all 6 requested statuses in sequence: In Progress, Hold, Converted, Active, Completed, Canceled", () => {
    expect(LEAD_STATUS_OPTIONS).toEqual([
      "In Progress",
      "Hold",
      "Converted",
      "Active",
      "Completed",
      "Canceled",
    ]);
  });

  it("filters leads by status and search query", () => {
    saveQuotation(
      makeQuotationInput({
        id: "lead-1",
        clientName: "Vikas Khanna",
        destination: "Manali",
        status: "Active",
        finalQuotationTotal: 30000,
      })
    );
    saveQuotation(
      makeQuotationInput({
        id: "lead-2",
        clientName: "Ananya Roy",
        destination: "Goa",
        status: "Converted",
        finalQuotationTotal: 45000,
      })
    );

    render(<LeadBoard />);

    expect(screen.getByText("Vikas Khanna")).toBeInTheDocument();
    expect(screen.getByText("Ananya Roy")).toBeInTheDocument();

    // Filter by Converted
    const convertedFilterBtn = screen.getByRole("button", { name: /Converted/i });
    fireEvent.click(convertedFilterBtn);

    expect(screen.getByText("Ananya Roy")).toBeInTheDocument();
    expect(screen.queryByText("Vikas Khanna")).not.toBeInTheDocument();

    // Switch to search
    const searchInput = screen.getByPlaceholderText(/Search leads/i);
    fireEvent.change(searchInput, { target: { value: "Goa" } });
    expect(screen.getByText("Ananya Roy")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Manali" } });
    expect(screen.queryByText("Ananya Roy")).not.toBeInTheDocument();
  });

  it("calls onOpenQuotation callback when clicking on lead row or open button", () => {
    const onOpenQuotation = vi.fn();
    saveQuotation(
      makeQuotationInput({
        id: "lead-open-1",
        clientName: "Kavita Rao",
        tripTitle: "Kerala Backwaters",
        finalQuotationTotal: 55000,
      })
    );

    render(<LeadBoard onOpenQuotation={onOpenQuotation} />);

    const leadRow = screen.getByText("Kavita Rao").closest("tr");
    expect(leadRow).toBeInTheDocument();
    fireEvent.click(leadRow!);

    expect(onOpenQuotation).toHaveBeenCalledTimes(1);
    expect(onOpenQuotation.mock.calls[0][0].clientName).toBe("Kavita Rao");
  });
});
