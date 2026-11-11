import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { Dashboard } from "@/components/Dashboard";
import {
  saveQuotation,
  getRecentQuotations,
  getStoredQuotations,
  deleteQuotation,
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

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    products: [],
    isLoading: false,
    addProduct: { mutate: vi.fn(), mutateAsync: vi.fn() },
    updateProduct: { mutate: vi.fn() },
    deleteProduct: { mutate: vi.fn() },
  }),
}));

vi.mock("@/hooks/useInquiries", () => ({
  useInquiries: () => ({
    inquiries: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useBlogs", () => ({
  useBlogs: () => ({
    blogs: [],
    addBlog: { mutate: vi.fn() },
  }),
}));

vi.mock("@/components/DashboardCharts", () => ({
  DashboardCharts: () => <div data-testid="dashboard-charts" />,
}));

vi.mock("@/components/ApiLinkCard", () => ({
  ApiLinkCard: () => <div data-testid="api-link-card" />,
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
    quotationRef: `QT-20261111-${Math.floor(100 + Math.random() * 900)}`,
    quotationDate: "11 Nov 2026",
    validUntilDate: "11 Dec 2026",
    rateDisplayMode: "subtotal",
    clientName: "Test Client",
    clientEmail: "client@example.com",
    clientPhone: "+91 9876543210",
    clientAddress: "Delhi",
    adults: "2",
    children: "0",
    infants: "0",
    roomsCount: "1",
    mealPlan: "MAP (Breakfast & Dinner)",
    packageType: "Full Package",
    tripTitle: "Kashmir Getaway",
    destination: "Kashmir",
    startDate: "2026-12-01",
    endDate: "2026-12-05",
    theme: "Family",
    heroImage: "",
    days: [],
    hotels: [],
    transports: [],
    sightseeings: [],
    flights: [],
    trains: [],
    otherServices: [],
    inclusions: ["Breakfast & Dinner"],
    exclusions: ["Airfare"],
    clientNotes: "Standard policy",
    selectedTheme: "teal",
    includeCoverPage: false,
    gstRate: 5,
    tcsRate: 0,
    discountAmount: 0,
    finalQuotationTotal: 25000,
    ...overrides,
  };
}

describe("quotationStorage and Sidebar Last 5 Quotations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores quotations, returns only the 5 most recent, updates without duplicates, and deletes cleanly", () => {
    vi.useFakeTimers();
    try {
      for (let i = 1; i <= 6; i++) {
        vi.setSystemTime(new Date(2026, 10, 11, 10, i, 0));
        saveQuotation(
          makeQuotationInput({
            quotationRef: `QT-REF-${i}`,
            clientName: `Client ${i}`,
            tripTitle: `Trip ${i}`,
            finalQuotationTotal: i * 10000,
          })
        );
      }

      const recent = getRecentQuotations(5);
      expect(recent).toHaveLength(5);
      expect(recent.map((q) => q.clientName)).toEqual([
        "Client 6",
        "Client 5",
        "Client 4",
        "Client 3",
        "Client 2",
      ]);

      // Updating Client 2 moves it to #1 without increasing total stored count
      vi.setSystemTime(new Date(2026, 10, 11, 11, 0, 0));
      const client2 = recent[4];
      saveQuotation({
        ...client2,
        clientName: "Client 2 Updated",
      });

      expect(getStoredQuotations()).toHaveLength(6);
      const recentAfterUpdate = getRecentQuotations(5);
      expect(recentAfterUpdate[0].clientName).toBe("Client 2 Updated");

      deleteQuotation(recentAfterUpdate[0].id);
      expect(getRecentQuotations(5)[0].clientName).toBe("Client 6");
    } finally {
      vi.useRealTimers();
    }
  });

  it("replaces Overview in sidebar with Last 5 Quotations and reopens clicked quotation in Quotation Studio", async () => {
    vi.useFakeTimers();
    try {
      for (let i = 1; i <= 6; i++) {
        vi.setSystemTime(new Date(2026, 10, 11, 12, i, 0));
        saveQuotation(
          makeQuotationInput({
            quotationRef: `QT-SIDE-${i}`,
            clientName: `Guest ${i}`,
            tripTitle: `Destination Tour ${i}`,
            destination: `City ${i}`,
            finalQuotationTotal: i * 15000,
          })
        );
      }
    } finally {
      vi.useRealTimers();
    }

    render(<Dashboard />);

    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("button", { name: /^Overview$/i })).not.toBeInTheDocument();
    expect(within(nav).getByText("Last 5 Quotations")).toBeInTheDocument();

    // Only the last 5 (Guest 6 down to Guest 2) appear in the sidebar; Guest 1 is excluded
    expect(within(nav).getByText("Guest 6")).toBeInTheDocument();
    expect(within(nav).getByText("Guest 2")).toBeInTheDocument();
    expect(within(nav).queryByText("Guest 1")).not.toBeInTheDocument();

    // Clicking Guest 4 opens Quotation Studio populated with Guest 4's data
    fireEvent.click(within(nav).getByText("Guest 4"));

    expect(screen.getByRole("heading", { name: /Create Quotation/i })).toBeInTheDocument();
    expect((screen.getByPlaceholderText("e.g. John Doe") as HTMLInputElement).value).toBe("Guest 4");
    expect(screen.getByDisplayValue("Destination Tour 4")).toBeInTheDocument();
    expect(screen.getByDisplayValue("City 4")).toBeInTheDocument();

    // Update Client Name and Save Draft -> moves to top of Last 5 Quotations in sidebar
    const titleInput = screen.getByPlaceholderText("e.g. 5 Days Kashmir Paradise Tour");
    fireEvent.change(titleInput, { target: { value: "Updated Tour 4" } });

    const saveButtons = screen.getAllByRole("button", { name: /Save Draft/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(within(nav).getByText("Updated Tour 4")).toBeInTheDocument();
    });
  }, 20000);
});
