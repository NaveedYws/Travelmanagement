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

  it("navigates to Last 10 Quotations page, shows table with name, date and edit option, and reopens quotation in Quotation Studio", async () => {
    vi.useFakeTimers();
    try {
      for (let i = 1; i <= 11; i++) {
        vi.setSystemTime(new Date(2026, 10, 11, 12, i, 0));
        saveQuotation(
          makeQuotationInput({
            quotationRef: `QT-SIDE-${i}`,
            clientName: `Guest ${i}`,
            tripTitle: `Destination Tour ${i}`,
            destination: `City ${i}`,
            quotationDate: `1${i} Nov 2026`,
            finalQuotationTotal: i * 15000,
          })
        );
      }
    } finally {
      vi.useRealTimers();
    }

    render(<Dashboard />);

    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("Last 10 Quotations")).toBeInTheDocument();

    // Click "Last 10 Quotations" in the sidebar to open the dedicated page
    fireEvent.click(within(nav).getByText("Last 10 Quotations"));

    // Page title and table are rendered (not cramped in sidebar)
    expect(screen.getByRole("heading", { name: "Last 10 Quotations" })).toBeInTheDocument();
    expect(screen.getByText("Name (Client / Lead)")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Edit Option")).toBeInTheDocument();

    // Shows the last 10 (Guest 11 down to Guest 2), while Guest 1 is excluded from top 10
    const table = screen.getByRole("table");
    expect(within(table).getByText("Guest 11")).toBeInTheDocument();
    expect(within(table).getByText("Guest 2")).toBeInTheDocument();
    expect(within(table).queryByText("Guest 1")).not.toBeInTheDocument();

    // Clicking Guest 4's Edit option opens Quotation Studio populated with Guest 4's data
    const guest4Row = within(table).getByText("Guest 4").closest("tr")!;
    const editBtn = within(guest4Row).getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole("heading", { name: /Create Quotation/i })).toBeInTheDocument();
    expect((screen.getByPlaceholderText("e.g. John Doe") as HTMLInputElement).value).toBe("Guest 4");
    expect(screen.getByDisplayValue("Destination Tour 4")).toBeInTheDocument();
    expect(screen.getByDisplayValue("City 4")).toBeInTheDocument();

    // Update Client Name and Save Draft -> updates the table in real time
    const titleInput = screen.getByPlaceholderText("e.g. 5 Days Kashmir Paradise Tour");
    fireEvent.change(titleInput, { target: { value: "Updated Tour 4" } });

    const saveButtons = screen.getAllByRole("button", { name: /Save Draft/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Updated Tour 4").length).toBeGreaterThanOrEqual(1);
    });
  }, 20000);

  it("toggles between Cal Amount and Edit Amount modes, persists edited total across reopen, and restores calculated total", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 10, 11, 13, 1, 0));
      saveQuotation(
        makeQuotationInput({
          quotationRef: "QT-MODE-1",
          clientName: "Custom Rate Guest",
          tripTitle: "Custom Price Tour",
          destination: "Manali",
          gstRate: 5,
          tcsRate: 0,
          discountAmount: 0,
          finalQuotationTotal: 0,
        })
      );

      vi.setSystemTime(new Date(2026, 10, 11, 13, 2, 0));
      saveQuotation(
        makeQuotationInput({
          quotationRef: "QT-MODE-2",
          clientName: "Other Guest",
          tripTitle: "Standard Tour",
          destination: "Shimla",
          gstRate: 0,
          tcsRate: 0,
          discountAmount: 0,
          finalQuotationTotal: 0,
        })
      );
    } finally {
      vi.useRealTimers();
    }

    render(<Dashboard />);
    const nav = screen.getByRole("navigation");

    // Open Last 10 Quotations page
    fireEvent.click(within(nav).getByText("Last 10 Quotations"));

    const table = screen.getByRole("table");
    const customRow = within(table).getByText("Custom Rate Guest").closest("tr")!;
    fireEvent.click(within(customRow).getByRole("button", { name: /Edit/i }));
    expect(screen.getByRole("heading", { name: /Create Quotation/i })).toBeInTheDocument();

    // Starts with Subtotal Only Mode and Cal Amount Mode (both switches visible)
    const rateSwitch = screen.getByRole("switch", { name: /Toggle subtotal or full customized rate/i });
    expect(rateSwitch).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Subtotal Only Mode")).toBeInTheDocument();
    expect(screen.getByText("Consolidated Package Rate")).toBeInTheDocument();

    const amountSwitch = screen.getByRole("switch", { name: /Toggle Cal Amount or Edit Amount/i });
    expect(amountSwitch).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Cal Amount Mode")).toBeInTheDocument();
    expect(screen.getByText("Auto-calculated from services")).toBeInTheDocument();
    expect(screen.queryByLabelText("Edit Total Quotation Price")).not.toBeInTheDocument();

    // Switch rate display to Full Rate AND amount mode to Edit Amount
    fireEvent.click(rateSwitch);
    expect(rateSwitch).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Full Itemized Mode")).toBeInTheDocument();
    expect(screen.getByText("Hotel Accommodation")).toBeInTheDocument();

    fireEvent.click(amountSwitch);
    expect(amountSwitch).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Edit Amount Mode")).toBeInTheDocument();
    expect(screen.getByText("Enter custom quotation total")).toBeInTheDocument();

    const editAmountInput = screen.getByLabelText("Edit Total Quotation Price") as HTMLInputElement;
    fireEvent.change(editAmountInput, { target: { value: "48000" } });
    expect(editAmountInput.value).toBe("48000");
    expect(screen.getAllByText(/₹48,000/).length).toBeGreaterThan(0);

    // Save Draft -> persists both rateDisplayMode and amountMode/manualAmount in localStorage
    const saveButtons = screen.getAllByRole("button", { name: /Save Draft/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      const saved = getRecentQuotations(10).find((q) => q.quotationRef === "QT-MODE-1");
      expect(saved?.rateDisplayMode).toBe("full");
      expect(saved?.amountMode).toBe("manual");
      expect(saved?.manualAmount).toBe("48000");
      expect(saved?.finalQuotationTotal).toBe(48000);
    });

    // Switch to another quotation in the table, then reopen Custom Rate Guest
    const otherRow = within(table).getByText("Other Guest").closest("tr")!;
    fireEvent.click(within(otherRow).getByRole("button", { name: /Edit/i }));
    expect(screen.getByDisplayValue("Standard Tour")).toBeInTheDocument();
    expect(screen.getByText("Subtotal Only Mode")).toBeInTheDocument();
    expect(screen.getByText("Cal Amount Mode")).toBeInTheDocument();

    const customRow2 = within(table).getByText("Custom Rate Guest").closest("tr")!;
    fireEvent.click(within(customRow2).getByRole("button", { name: /Edit/i }));
    expect(screen.getByDisplayValue("Custom Price Tour")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Toggle subtotal or full customized rate/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText("Full Itemized Mode")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Toggle Cal Amount or Edit Amount/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText("Edit Amount Mode")).toBeInTheDocument();
    expect((screen.getByLabelText("Edit Total Quotation Price") as HTMLInputElement).value).toBe("48000");
    expect(screen.getAllByText(/₹48,000/).length).toBeGreaterThan(0);

    // Switch back to Subtotal Only and Cal Amount -> restores calculated view in Quotation Studio
    fireEvent.click(screen.getByRole("switch", { name: /Toggle subtotal or full customized rate/i }));
    expect(screen.getByText("Subtotal Only Mode")).toBeInTheDocument();
    expect(screen.getByText("Consolidated Package Rate")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: /Toggle Cal Amount or Edit Amount/i }));
    expect(screen.getByRole("switch", { name: /Toggle Cal Amount or Edit Amount/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(screen.getByText("Cal Amount Mode")).toBeInTheDocument();
    expect(screen.queryByLabelText("Edit Total Quotation Price")).not.toBeInTheDocument();
    expect(screen.getAllByText(/₹48,000/).length).toBeGreaterThan(0);

    // Save Draft in Subtotal + Cal Amount modes -> persists both and updates table total
    fireEvent.click(screen.getAllByRole("button", { name: /Save Draft/i })[0]);

    await waitFor(() => {
      const saved = getRecentQuotations(10).find((q) => q.quotationRef === "QT-MODE-1");
      expect(saved?.rateDisplayMode).toBe("subtotal");
      expect(saved?.amountMode).toBe("calculated");
      expect(saved?.finalQuotationTotal).toBe(0);
    });
  }, 20000);
});
