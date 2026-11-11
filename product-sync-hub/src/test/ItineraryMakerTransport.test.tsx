import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ItineraryMaker } from "@/components/ItineraryMaker";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

describe("ItineraryMaker Transport From/To Dates and Included Services dropdown", () => {
  it("allows setting From Date, To Date, toggling dropdown Included Services, and adding manual custom services", () => {
    render(<ItineraryMaker />);

    fireEvent.click(screen.getByRole("button", { name: /Create Itinerary/i }));

    // Set vehicle type
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Sedan / Innova Crysta / Tempo Traveller"),
      { target: { value: "Innova Crysta" } }
    );

    // Set From Date & To Date
    const fromDateInput = screen.getByLabelText("From Date");
    const toDateInput = screen.getByLabelText("To Date");
    fireEvent.change(fromDateInput, { target: { value: "2026-06-01" } });
    fireEvent.change(toDateInput, { target: { value: "2026-06-06" } });

    expect((fromDateInput as HTMLInputElement).value).toBe("2026-06-01");
    expect((toDateInput as HTMLInputElement).value).toBe("2026-06-06");

    // Open Included Services dropdown and toggle options
    const dropdownTrigger = screen.getByRole("button", { name: "Included Services Dropdown" });
    fireEvent.click(dropdownTrigger);

    // Uncheck default "Parking Fees" and check "State & Border Permits"
    fireEvent.click(screen.getByRole("option", { name: "Parking Fees" }));
    fireEvent.click(screen.getByRole("option", { name: "State & Border Permits" }));

    // Add a custom service manually
    const manualInput = screen.getByLabelText("Manual Included Service");
    fireEvent.change(manualInput, { target: { value: "Oxygen Cylinder" } });
    fireEvent.keyDown(manualInput, { key: "Enter", code: "Enter" });

    expect((manualInput as HTMLInputElement).value).toBe("");
    // The custom service also appears in the open dropdown as selected
    expect(screen.getByRole("option", { name: "Oxygen Cylinder" }).getAttribute("aria-selected")).toBe("true");

    // Remove a selected badge directly
    fireEvent.click(screen.getByRole("button", { name: "Remove Fuel Charges" }));

    // Save the transport entry
    fireEvent.click(screen.getByRole("button", { name: "+ Add Transport" }));

    // Verify added transport card renders date range and customized included services
    expect(screen.getByText(/Added Transport \(1\)/i)).toBeInTheDocument();
    const dateLine = screen.getByText(/From: 2026-06-01 to 2026-06-06/i);
    const savedCard = dateLine.closest("div.space-y-1") as HTMLElement;
    expect(savedCard).not.toBeNull();
    expect(within(savedCard).getByText("Driver Allowance")).toBeInTheDocument();
    expect(within(savedCard).getByText("Tolls & State Taxes")).toBeInTheDocument();
    expect(within(savedCard).getByText("State & Border Permits")).toBeInTheDocument();
    expect(within(savedCard).getByText("Oxygen Cylinder")).toBeInTheDocument();
    expect(within(savedCard).queryByText("Parking Fees")).not.toBeInTheDocument();
    expect(within(savedCard).queryByText("Fuel Charges")).not.toBeInTheDocument();
  }, 20000);
});
