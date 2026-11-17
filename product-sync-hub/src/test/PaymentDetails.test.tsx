import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaymentDetails } from "@/components/PaymentDetails";
import { saveQuotation, SaveQuotationInput } from "@/lib/quotationStorage";
import * as paymentPdf from "@/lib/paymentPdf";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, email: "agency@example.com", company_name: "Trip Flow Travel Agency" },
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
    children: "0",
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
    inclusions: ["All meals included"],
    exclusions: ["Airfare"],
    clientNotes: "",
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

describe("PaymentDetails component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders empty state when there are converted leads but no payment recorded yet", () => {
    // Converted lead without paymentRecorded should NOT show in payment table initially
    saveQuotation(
      makeQuotationInput({
        clientName: "Pending Client",
        status: "Converted",
        finalQuotationTotal: 18900,
      })
    );

    render(<PaymentDetails />);

    expect(screen.getByText(/Payment Details/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /No Payments Recorded Yet/i })
    ).toBeInTheDocument();
    // Customer must NOT appear in the table before payment is done
    expect(screen.queryByText("Pending Client")).not.toBeInTheDocument();
  });

  it("shows payment record in table only after payment is recorded", () => {
    // Lead with recorded payment
    saveQuotation(
      makeQuotationInput({
        id: "conv-1",
        clientName: "Vikram Malhotra",
        quotationDate: "14 Nov 2026",
        finalQuotationTotal: 75000,
        paidAmount: 75000,
        paymentRecorded: true,
        tripTitle: "6N/7D Golden Triangle",
        destination: "Delhi & Agra",
        status: "Converted",
        paymentMethod: "UPI / QR Code",
      })
    );

    // Another lead that is Converted but has no recorded payment (should NOT appear)
    saveQuotation(
      makeQuotationInput({
        id: "conv-unpaid-1",
        clientName: "Amitabh Sen",
        status: "Converted",
        finalQuotationTotal: 30000,
      })
    );

    render(<PaymentDetails />);

    // Recorded customer is visible
    expect(screen.getByText("Vikram Malhotra")).toBeInTheDocument();
    expect(screen.getByText("14 Nov 2026")).toBeInTheDocument();
    expect(screen.getAllByText("₹75,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("6N/7D Golden Triangle")).toBeInTheDocument();
    expect(screen.getByText("PAID")).toBeInTheDocument();

    // Unrecorded lead is NOT visible in table
    expect(screen.queryByText("Amitabh Sen")).not.toBeInTheDocument();

    // Download PDF button is visible
    const downloadBtn = screen.getByRole("button", { name: /Download PDF/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it("calls downloadPaymentReceiptPdf when clicking Download PDF on a row", () => {
    const spyDownload = vi
      .spyOn(paymentPdf, "downloadPaymentReceiptPdf")
      .mockReturnValue("Receipt_Test.pdf");

    saveQuotation(
      makeQuotationInput({
        id: "conv-2",
        clientName: "Meera Nair",
        finalQuotationTotal: 52000,
        paidAmount: 52000,
        paymentRecorded: true,
        status: "Converted",
      })
    );

    render(<PaymentDetails />);

    const downloadBtn = screen.getByRole("button", { name: /Download PDF/i });
    fireEvent.click(downloadBtn);

    expect(spyDownload).toHaveBeenCalledTimes(1);
    expect(spyDownload.mock.calls[0][0].clientName).toBe("Meera Nair");
  });

  it("calls downloadPaymentsSummaryPdf when clicking Download All Report (PDF)", () => {
    const spySummary = vi
      .spyOn(paymentPdf, "downloadPaymentsSummaryPdf")
      .mockReturnValue("Payments_Report_Test.pdf");

    saveQuotation(
      makeQuotationInput({
        id: "conv-3",
        clientName: "Sanjay Kapoor",
        finalQuotationTotal: 88000,
        paidAmount: 88000,
        paymentRecorded: true,
        status: "Converted",
      })
    );

    render(<PaymentDetails />);

    const reportBtn = screen.getByRole("button", { name: /Download All Report \(PDF\)/i });
    fireEvent.click(reportBtn);

    expect(spySummary).toHaveBeenCalledTimes(1);
  });

  it("filters recorded payment records by search query", () => {
    saveQuotation(
      makeQuotationInput({
        id: "c-1",
        clientName: "Deepak Chopra",
        destination: "Kashmir",
        status: "Converted",
        finalQuotationTotal: 60000,
        paidAmount: 60000,
        paymentRecorded: true,
      })
    );
    saveQuotation(
      makeQuotationInput({
        id: "c-2",
        clientName: "Sunita Menon",
        destination: "Kerala",
        status: "Converted",
        finalQuotationTotal: 40000,
        paidAmount: 40000,
        paymentRecorded: true,
      })
    );

    render(<PaymentDetails />);

    expect(screen.getByText("Deepak Chopra")).toBeInTheDocument();
    expect(screen.getByText("Sunita Menon")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search payments/i);
    fireEvent.change(searchInput, { target: { value: "Deepak" } });

    expect(screen.getByText("Deepak Chopra")).toBeInTheDocument();
    expect(screen.queryByText("Sunita Menon")).not.toBeInTheDocument();
  });

  it("opens Add Payment drawer and only includes Converted and Active leads in the customer dropdown", () => {
    // Lead 1: Converted (eligible)
    saveQuotation(
      makeQuotationInput({
        id: "lead-converted-1",
        clientName: "Rahul Converted",
        status: "Converted",
        finalQuotationTotal: 25000,
      })
    );
    // Lead 2: Active (eligible)
    saveQuotation(
      makeQuotationInput({
        id: "lead-active-1",
        clientName: "Pooja Active",
        status: "Active",
        finalQuotationTotal: 35000,
      })
    );
    // Lead 3: In Progress (NOT eligible)
    saveQuotation(
      makeQuotationInput({
        id: "lead-prog-1",
        clientName: "Sunil InProgress",
        status: "In Progress",
        finalQuotationTotal: 15000,
      })
    );
    // Lead 4: Hold (NOT eligible)
    saveQuotation(
      makeQuotationInput({
        id: "lead-hold-1",
        clientName: "Manish Hold",
        status: "Hold",
        finalQuotationTotal: 18000,
      })
    );

    render(<PaymentDetails />);

    // Click Add Payment button
    const addPaymentBtn = screen.getAllByRole("button", { name: /Add Payment/i })[0];
    fireEvent.click(addPaymentBtn);

    // Drawer opens
    expect(screen.getByText("Record customer payment for active or converted leads to generate official receipts")).toBeInTheDocument();

    // Verify helper text displays correct counts of eligible leads
    expect(
      screen.getByText(/Filtering leads where status is/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/2 available/i)).toBeInTheDocument();

    // Editable customer name input is present and prefilled with the first eligible lead
    const nameInput = screen.getByLabelText(/Customer Name/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe("Pooja Active");

    // Edit customer name input
    fireEvent.change(nameInput, { target: { value: "Rahil Custom Payment" } });
    expect(nameInput.value).toBe("Rahil Custom Payment");

    // Submit payment
    const recordBtn = screen.getByRole("button", { name: /Record Payment/i });
    fireEvent.click(recordBtn);

    // Payment should now be recorded and visible in the table
    expect(screen.getByText("Rahil Custom Payment")).toBeInTheDocument();
  });

  it("allows removing a recorded payment which returns table to empty state", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    saveQuotation(
      makeQuotationInput({
        id: "to-remove-1",
        clientName: "Removable Customer",
        finalQuotationTotal: 25000,
        paidAmount: 25000,
        paymentRecorded: true,
        status: "Converted",
      })
    );

    render(<PaymentDetails />);

    expect(screen.getByText("Removable Customer")).toBeInTheDocument();

    const removeBtn = screen.getByTitle(/Remove Payment Record/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText("Removable Customer")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /No Payments Recorded Yet/i })
    ).toBeInTheDocument();
  });
});
