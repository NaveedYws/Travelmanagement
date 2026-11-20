import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  ItineraryPdfDocument,
  ItineraryPdfData,
  planContentPages,
  resolvePdfTheme,
  PDF_THEMES,
} from "@/components/ItineraryPdfDocument";

const makeDay = (day: number, title: string, bullets: string[]) => ({
  day,
  destination: "Srinagar",
  title,
  activities: "",
  description: bullets.join("\n"),
  images: ["data:image/gif;base64,R0lGODlhAQABAAAAACw="],
  highlights: ["Scenic Views"],
});

const sampleData: ItineraryPdfData = {
  clientName: "Deepak",
  tripTitle: "Kashmir Paradise Tour",
  destination: "Srinagar, Gulmarg, Pahalgam",
  startDate: "2026-05-10",
  endDate: "2026-05-16",
  duration: "6 Nights / 7 Days",
  dateRange: "10 May 2026 - 16 May 2026",
  adults: "2",
  children: "0",
  theme: "luxury",
  finalRate: "48500",
  heroImage: "",
  flights: [],
  hotels: [
    {
      hotelName: "Hotel Akbar Srinagar",
      location: "Srinagar",
      checkIn: "2026-05-10",
      checkOut: "2026-05-13",
      roomCategory: "Deluxe Room",
      mealPlan: "MAP (Breakfast & Dinner)",
      nights: 3,
      rooms: 1,
    },
    {
      hotelName: "Pine View Pahalgam",
      location: "Pahalgam",
      checkIn: "2026-05-13",
      checkOut: "2026-05-15",
      roomCategory: "Super Deluxe Room",
      mealPlan: "MAP (Breakfast & Dinner)",
      nights: 2,
      rooms: 1,
    },
  ],
  transports: [
    {
      date: "2026-05-10",
      vehicleType: "Innova Crysta",
      route: "Srinagar Airport -> Pahalgam -> Gulmarg -> Srinagar",
      pickupTime: "10:00",
      dropoff: "Airport",
      notes: "Dedicated AC cab with driver, fuel, toll and parking",
      vehiclesCount: 1,
    },
  ],
  days: [
    makeDay(1, "Arrival in Srinagar", [
      "Pickup from Srinagar Airport.",
      "Transfer to houseboat on Dal Lake.",
      "Evening Shikara ride.",
      "Dinner and overnight stay.",
    ]),
    makeDay(2, "Srinagar to Pahalgam", [
      "Breakfast at houseboat.",
      "Drive to Pahalgam via Pampore saffron fields.",
      "Visit Awantipora ruins.",
      "Evening leisure by Lidder River.",
      "Dinner and overnight stay in Pahalgam.",
    ]),
    makeDay(3, "Pahalgam Sightseeing", [
      "Breakfast at hotel.",
      "Explore Betaab Valley.",
      "Visit Aru Valley and Chandanwari.",
      "Return to hotel for dinner.",
    ]),
    makeDay(4, "Pahalgam to Srinagar", [
      "Breakfast at hotel.",
      "Drive back to Srinagar.",
      "Check-in to hotel.",
      "Evening shopping at Lal Chowk.",
      "Dinner and overnight stay.",
    ]),
    makeDay(5, "Day 5: : Srinagar – Gulmarg Excursion – Srinagar", [
      "Breakfast at the houseboat.",
      "Proceed for a full-day excursion to Gulmarg.",
      "Enjoy beautiful snow-covered mountain views (season permitting).",
      "Optional Gondola cable-car ride at your own expense.",
      "Return to Srinagar.",
      "Dinner and overnight stay at Srinagar hotel.",
    ]),
    makeDay(6, "Day 6: Srinagar Local Sightseeing", [
      "Breakfast at the hotel.",
      "Visit famous Mughal Gardens:",
      "Nishat Bagh",
      "Shalimar Bagh",
      "Chashme Shahi",
      "Pari Mahal",
      "Shankaracharya Temple",
      "Hazratbal Shrine",
      "Return to hotel.",
      "Dinner and overnight stay in Srinagar.",
    ]),
  ],
  inclusions: [
    "Accommodation on twin sharing basis",
    "Daily Breakfast & Dinner",
    "All sightseeing & transfers by private vehicle",
  ],
  exclusions: [
    "Airfare / Train tickets",
    "Gondola cable car tickets",
    "Personal expenses and tips",
  ],
  clientNotes: "Check-in time is 2:00 PM and check-out time is 11:00 AM.",
};

describe("ItineraryPdfDocument uniform text sizes", () => {
  it("uses identical text size classes for section headings, day titles, and bullets across all pages", () => {
    const { container } = render(
      <ItineraryPdfDocument
        data={sampleData}
        user={{
          id: 1,
          email: "agent@example.com",
          company_name: "Holidays Bindas",
          bank_account_no: "1234567890",
          bank_ifsc: "SBIN0001234",
        }}
      />
    );

    const pages = Array.from(container.querySelectorAll("[data-pdf-page]"));
    expect(pages.length).toBeGreaterThanOrEqual(3);

    // Every section header (CONFIRMED ACCOMMODATION, TRANSPORTATION, DAY-WISE ITINERARY PART 1/2, INCLUSIONS, PAYMENT) uses text-[13px]
    const sectionHeadings = Array.from(container.querySelectorAll("h3")).filter(
      (h) => h.className.includes("uppercase tracking-wider")
    );
    expect(sectionHeadings.length).toBeGreaterThanOrEqual(5);
    for (const heading of sectionHeadings) {
      expect(heading.className).toContain("text-[13px]");
    }

    // Every Day card heading across all pages has identical text-[13.5px] class and clean Day X: prefix
    const dayHeadings = Array.from(container.querySelectorAll("h4")).filter((h) =>
      /^Day \d+:/.test(h.textContent || "")
    );
    expect(dayHeadings).toHaveLength(6);
    for (const dayHeading of dayHeadings) {
      expect(dayHeading.className).toContain("text-[13.5px]");
      expect(dayHeading.textContent).not.toMatch(/^Day \d+:\s*:/);
    }

    // Every Day bullet point across all pages has identical text-[12px] class
    const dayBulletLists = dayHeadings.map((h) =>
      h.closest("div.flex-1")?.querySelectorAll("ul li span.break-words")
    );
    for (const spans of dayBulletLists) {
      expect(spans && spans.length).toBeGreaterThan(0);
      spans?.forEach((span) => {
        expect(span.className).toContain("text-[12px]");
      });
    }

    // Inclusions/Exclusions lists and Special Agent Notes also use text-[12px]
    const incExcLists = Array.from(container.querySelectorAll("ul.text-\\[12px\\]"));
    expect(incExcLists).toHaveLength(2);
    expect(container.textContent).toContain("Day 5: Srinagar – Gulmarg Excursion – Srinagar");
  });

  it("packs Day 5 onto Page 2 alongside Days 1-4 when remaining page space fits it", () => {
    const kashmirDays = [
      { ...sampleData.days[0], highlights: [] },
      { ...sampleData.days[1], highlights: [] },
      { ...sampleData.days[2], highlights: [] },
      {
        day: 4,
        destination: "Srinagar",
        title: "Pahalgam – Srinagar Houseboat",
        activities: "",
        description: [
          "Breakfast at the hotel.",
          "Enjoy Pahalgam sightseeing.",
          "Visit beautiful valleys and scenic locations.",
          "Later drive towards Srinagar.",
          "Check in at houseboat.",
          "Enjoy a complimentary Shikara ride on Dal Lake.",
          "Dinner and overnight stay in houseboat.",
        ].join("\n"),
        images: ["data:image/gif;base64,R0lGODlhAQABAAAAACw="],
        highlights: [],
      },
      { ...sampleData.days[4], highlights: [] },
      { ...sampleData.days[5], highlights: [] },
    ];

    const pages = planContentPages({
      activeDays: kashmirDays,
      activeHotels: sampleData.hotels,
      activeTransports: sampleData.transports,
      activeActivities: [],
      effectiveInclusions: sampleData.inclusions,
      effectiveExclusions: sampleData.exclusions,
      hasPaymentDetails: true,
      clientNotes: sampleData.clientNotes,
    });

    // Page 1 has hotels & transports; Page 2 packs Days 1-5 cleanly instead of leaving a large gap after Day 4
    expect(pages[1].days?.list.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(pages[2].days?.list.map((d) => d.day)).toEqual([6]);
  });

  it("starts day-wise itinerary on the same page following transport instead of dropping the rest of the page", () => {
    // 4 hotels fill Page 1, so transports are placed on Page 2
    const fourHotels = Array.from({ length: 4 }, (_, i) => ({
      hotelName: `Hotel ${i + 1}`,
      location: `Location ${i + 1}`,
      checkIn: "2026-05-10",
      checkOut: "2026-05-12",
      roomCategory: "Deluxe Room",
      mealPlan: "MAP",
      nights: 2,
      rooms: 1,
    }));

    const pages = planContentPages({
      activeDays: sampleData.days,
      activeHotels: fourHotels,
      activeTransports: [
        {
          vehicleType: "Maruti Ertiga",
          pickupTime: "10:00 AM",
          route: "katra to srinagar to sonmarg to gulmarg to pahalgam to jammu departure",
          inclusions: ["Driver Allowance", "Toll & State Taxes", "Fuel Charges", "Parking Fees"],
          vehiclesCount: 1,
        },
      ],
      activeActivities: [],
      effectiveInclusions: [],
      effectiveExclusions: [],
      hasPaymentDetails: false,
      clientNotes: "",
    });

    // Page 1 has hotels
    expect(pages[0].hotels).toBeDefined();

    // Page 2 has transports AND starts the Day Itinerary on the same page
    expect(pages[1].transports).toBeDefined();
    expect(pages[1].days).toBeDefined();
    expect(pages[1].days?.list.length).toBeGreaterThanOrEqual(1);
    expect(pages[1].days?.list[0].day).toBe(1);
  });

  it("renders transport from/to dates and custom included services in PDF", () => {
    const { container } = render(
      <ItineraryPdfDocument
        data={{
          ...sampleData,
          transports: [
            {
              date: "2026-05-10",
              toDate: "2026-05-16",
              vehicleType: "Innova Crysta",
              route: "Srinagar Airport -> Srinagar",
              pickupTime: "10:00 AM",
              dropoff: "Airport",
              notes: "AC Cab",
              vehiclesCount: 1,
              inclusions: ["Driver Allowance", "Tolls & State Taxes", "Border Permit"],
            },
          ],
        }}
      />
    );

    expect(container.textContent).toContain("From: 10 May 2026");
    expect(container.textContent).toContain("16 May 2026");
    expect(container.textContent).toContain("Pickup: 10:00 AM");
    expect(container.textContent).toContain("Included: Driver Allowance • Tolls & State Taxes • Border Permit");
  });

  it("numbers hotel nights cumulatively instead of using hotel index", () => {
    const { container } = render(
      <ItineraryPdfDocument
        data={{
          ...sampleData,
          hotels: [
            {
              hotelName: "Heritage Luxury Hotel",
              location: "Srinagar",
              checkIn: "2026-05-10",
              checkOut: "2026-05-12",
              roomCategory: "11 Double Sharing Room",
              mealPlan: "MAP",
              nights: 2,
              rooms: 1,
            },
            {
              hotelName: "Apple Tree Resort",
              location: "Gulmarg",
              checkIn: "2026-05-12",
              checkOut: "2026-05-13",
              roomCategory: "11 Double Sharing Room",
              mealPlan: "MAP",
              nights: 1,
              rooms: 1,
            },
          ],
        }}
      />
    );

    const heritageHeader = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent?.includes("Stay at Srinagar") && el.className.includes("border-b border-slate-100")
    );
    const appleTreeHeader = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent?.includes("Stay at Gulmarg") && el.className.includes("border-b border-slate-100")
    );

    expect(heritageHeader?.textContent).toContain("1st Night");
    expect(heritageHeader?.textContent).toContain("2nd Night");
    expect(appleTreeHeader?.textContent).toContain("3rd Night");
    expect(appleTreeHeader?.textContent).not.toContain("2nd Night");

    // Verify startNight offset carries over when hotels paginate across pages
    const manyHotels = Array.from({ length: 6 }, (_, i) => ({
      hotelName: `Hotel ${i + 1}`,
      location: `City ${i + 1}`,
      checkIn: "2026-05-10",
      checkOut: "2026-05-12",
      roomCategory: "Deluxe Room",
      mealPlan: "MAP",
      nights: 2,
      rooms: 1,
    }));
    const pages = planContentPages({
      activeDays: [],
      activeHotels: manyHotels,
      activeTransports: [],
      activeActivities: [],
      effectiveInclusions: [],
      effectiveExclusions: [],
      hasPaymentDetails: false,
      clientNotes: "",
    });
    expect(pages[0].hotels?.startNight).toBe(1);
    const placedOnPage1 = pages[0].hotels?.list.length || 0;
    expect(placedOnPage1).toBeLessThan(manyHotels.length);
    expect(pages[1].hotels?.startNight).toBe(1 + placedOnPage1 * 2);
  });

  it("applies selectedTheme / colorTheme palette colors dynamically to headings, badges, and footers", () => {
    // 1. Verify theme resolver for all palette items
    expect(resolvePdfTheme("teal").id).toBe("teal");
    expect(resolvePdfTheme("blue").id).toBe("blue");
    expect(resolvePdfTheme("indigo").id).toBe("indigo");
    expect(resolvePdfTheme("emerald").id).toBe("emerald");
    expect(resolvePdfTheme("rose").id).toBe("rose");
    expect(resolvePdfTheme("amber").id).toBe("amber");
    expect(resolvePdfTheme("slate").id).toBe("slate");

    // 2. Render with "rose" theme
    const { container: roseContainer } = render(
      <ItineraryPdfDocument
        data={{
          ...sampleData,
          colorTheme: "rose",
        }}
        user={{
          id: 1,
          email: "agent@example.com",
          company_name: "Holidays Bindas",
        }}
      />
    );

    // Section headings should have rose primary color (rgb(190, 18, 60) for #be123c)
    const headings = roseContainer.querySelectorAll("h3");
    expect(headings.length).toBeGreaterThan(0);
    const dayHeading = Array.from(headings).find((h) =>
      h.textContent?.includes("DETAILED DAY-WISE TOUR ITINERARY")
    );
    expect((dayHeading as HTMLElement)?.style.color).toBe("rgb(190, 18, 60)");

    // Day badge circles should have rose primary color
    const dayCircles = roseContainer.querySelectorAll(".rounded-full");
    const day1Badge = Array.from(dayCircles).find((el) => el.textContent === "1");
    expect((day1Badge as HTMLElement)?.style.backgroundColor).toBe("rgb(190, 18, 60)");

    // Footer bar should have rose footer color (rgb(136, 19, 55) for #881337)
    const footers = roseContainer.querySelectorAll(".h-7");
    expect(footers.length).toBeGreaterThan(0);
    expect((footers[0] as HTMLElement)?.style.backgroundColor).toBe("rgb(136, 19, 55)");

    // 3. Render with "blue" theme
    const { container: blueContainer } = render(
      <ItineraryPdfDocument
        data={{
          ...sampleData,
          selectedTheme: "blue",
        }}
        user={{
          id: 1,
          email: "agent@example.com",
          company_name: "Holidays Bindas",
        }}
      />
    );

    const blueHeadings = blueContainer.querySelectorAll("h3");
    const blueDayHeading = Array.from(blueHeadings).find((h) =>
      h.textContent?.includes("DETAILED DAY-WISE TOUR ITINERARY")
    );
    expect((blueDayHeading as HTMLElement)?.style.color).toBe("rgb(29, 78, 216)");

    const blueFooters = blueContainer.querySelectorAll(".h-7");
    expect((blueFooters[0] as HTMLElement)?.style.backgroundColor).toBe("rgb(30, 58, 138)");
  });

  it("renders dynamic company website, phone number, and facebook/instagram social links with icons in page footer", () => {
    const { container } = render(
      <ItineraryPdfDocument
        data={sampleData}
        user={{
          id: 1,
          email: "support@customtravels.com",
          company_name: "Custom Travels",
          company_website: "https://www.customtravels.com",
          company_phone: "+91 9876543210",
          company_instagram: "@custom_travels",
          company_facebook: "facebook.com/customtravelspage",
        }}
      />
    );

    const footers = container.querySelectorAll(".h-7");
    expect(footers.length).toBeGreaterThan(0);

    const firstFooter = footers[0] as HTMLElement;
    expect(firstFooter.textContent).toMatch(/custom travels/i);
    expect(firstFooter.textContent).toContain("customtravels.com");
    expect(firstFooter.textContent).toContain("Ph: +91 9876543210");
    expect(firstFooter.textContent).toContain("@custom_travels");
    expect(firstFooter.textContent).toContain("customtravelspage");

    // Verify social links have Instagram and Facebook SVG icons
    const footerSvgs = firstFooter.querySelectorAll("svg");
    expect(footerSvgs.length).toBe(2);

    // Verify links have correct href
    const instaLink = firstFooter.querySelector('a[href*="instagram.com"]') as HTMLAnchorElement;
    expect(instaLink).toBeTruthy();
    expect(instaLink.href).toContain("instagram.com/custom_travels");

    const fbLink = firstFooter.querySelector('a[href*="facebook.com"]') as HTMLAnchorElement;
    expect(fbLink).toBeTruthy();
    expect(fbLink.href).toContain("facebook.com/customtravelspage");
  });
});
