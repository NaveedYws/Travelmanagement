import React, { useState, useEffect, useMemo } from "react";
import { Lock, Sparkles, Check, X } from "lucide-react";
import {
  DetailedItineraryDay,
  ItineraryFlight,
  ItineraryHotel,
  ItineraryTransport,
  ItinerarySightseeing,
  ItineraryService,
} from "@/lib/types";
import type { User } from "@/lib/types";

export interface ItineraryPdfData {
  quotationRef?: string;
  quotationDate?: string;
  validUntilDate?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: string;
  children: string;
  theme: string;
  colorTheme?: string;
  templateStyle?: "editorial" | "executive" | "modern";
  subTotal?: number;
  discountAmount?: number;
  discountPercent?: number;
  gstAmount?: number;
  gstRate?: number;
  finalRate: string;
  heroImage: string;
  days: DetailedItineraryDay[];
  flights: ItineraryFlight[];
  hotels: ItineraryHotel[];
  transports: ItineraryTransport[];
  sightseeings?: ItinerarySightseeing[];
  customServices?: ItineraryService[];
  inclusions: string[];
  exclusions: string[];
  clientNotes: string;
  duration: string;
  dateRange: string;
  guestPhotos?: string[];
}

interface ItineraryPdfDocumentProps {
  data: ItineraryPdfData;
  user?: User | null;
}

const PAGE =
  "w-[210mm] h-[297mm] bg-white overflow-hidden relative shrink-0 shadow-2xl mb-8 last:mb-0 select-none print:shadow-none print:mb-0 text-slate-800 font-sans leading-normal";

export function resolveImageUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith("holidaysbindas.com") || trimmed.includes(".com/") || trimmed.includes(".in/") || trimmed.includes(".org/")) {
    return `https://${trimmed}`;
  }

  const rawApi = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();
  const normApi = rawApi.startsWith("http://") || rawApi.startsWith("https://")
    ? rawApi
    : `https://${rawApi}`;
  const base = normApi.replace(/\/+$/, "");
  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${clean}`;
}

export function getCompanyProfile(user?: User | null) {
  let localData: any = {};
  let cachedLogoData = "";
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("agency_company_profile");
      if (raw) localData = JSON.parse(raw);
      cachedLogoData = localStorage.getItem("agency_company_logo_data") || localData.company_logo_data || "";
    } catch {}
  }

  const rawLogo = cachedLogoData || user?.company_logo || localData.company_logo || "";

  return {
    name: user?.company_name || localData.company_name || "",
    logo: rawLogo,
    phone: user?.company_phone || localData.company_phone || "",
    email: user?.company_email || localData.company_email || user?.email || "",
    address: user?.company_address || localData.company_address || "",
    website: user?.company_website || localData.company_website || "",
    bankName: user?.bank_name || localData.bank_name || "",
    accountHolder: user?.bank_account_name || localData.bank_account_name || "",
    accountNumber: user?.bank_account_no || localData.bank_account_no || "",
    ifsc: user?.bank_ifsc || localData.bank_ifsc || "",
    upiId: user?.bank_upi_id || localData.bank_upi_id || "",
    instagram: localData.company_instagram || localData.instagram || "",
    facebook: localData.company_facebook || localData.facebook || "",
  };
}

// Default Cancellation Policy
const DEFAULT_CANCELLATION_POLICY = [
  {
    period: "30+ Days Prior",
    refund: "90% Refund",
    detail: "Nominal administrative processing fee deducted",
  },
  {
    period: "15 to 29 Days",
    refund: "50% Refund",
    detail: "Retention of non-refundable hotel & transport commitments",
  },
  {
    period: "Less than 15 Days",
    refund: "Non-Refundable",
    detail: "100% cancellation fee as per partner policies & peak dates",
  },
];

// Parse Day Itinerary into structured point-wise bullet items
function parseDayPoints(description?: string, activities?: string): string[] {
  const points: string[] = [];

  // Parse activities if present and distinct
  if (activities && activities.trim()) {
    const actLines = activities.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of actLines) {
      const clean = line.replace(/^([•\-\*–—\u2022\u2023\u25E6\u2043\u2219]+|\d+[\.\)\-:]+)\s*/, "").trim();
      if (clean && !points.includes(clean)) {
        points.push(clean);
      }
    }
  }

  // Parse description
  if (description && description.trim()) {
    const descLines = description.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of descLines) {
      const clean = line.replace(/^([•\-\*–—\u2022\u2023\u25E6\u2043\u2219]+|\d+[\.\)\-:]+)\s*/, "").trim();
      if (clean && !points.includes(clean)) {
        points.push(clean);
      }
    }
  }

  // If only 1 long line without newlines, split on sentence boundaries
  if (points.length === 1 && points[0].length > 100 && points[0].includes(". ")) {
    const sentences = points[0]
      .split(/(?<=\.)\s+(?=[A-Z0-9])/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length > 1) {
      return sentences;
    }
  }

  return points.length > 0
    ? points
    : ["Scheduled sightseeing, transfers, and leisure activities as per tour program."];
}

// Smart chunking for days to avoid lonely 1-day pages and massive empty spaces
function chunkDays(days: DetailedItineraryDay[]): {
  firstPageDays: DetailedItineraryDay[];
  otherPages: DetailedItineraryDay[][];
} {
  const n = days.length;
  if (n === 0) {
    return { firstPageDays: [], otherPages: [] };
  }
  // Up to 4 days: all fit comfortably on Page 2 alongside executive summary & pricing!
  // This ensures 1, 2, 3, or 4-day itineraries flow continuously without massive whitespace voids
  if (n <= 4) {
    return { firstPageDays: days, otherPages: [] };
  }

  // 5 or more days:
  // First 3 days on Page 2 alongside executive summary
  const firstPageDays = days.slice(0, 3);
  const rest = days.slice(3);
  const otherPages: DetailedItineraryDay[][] = [];

  // Subsequent pages fit 3 to 4 days comfortably without empty space
  let i = 0;
  while (i < rest.length) {
    const remaining = rest.length - i;
    if (remaining <= 4) {
      otherPages.push(rest.slice(i));
      break;
    } else if (remaining === 5) {
      // Split 5 into 3 and 2 so neither page has an orphaned single day
      otherPages.push(rest.slice(i, i + 3));
      i += 3;
    } else {
      otherPages.push(rest.slice(i, i + 4));
      i += 4;
    }
  }

  return { firstPageDays, otherPages };
}

export function ItineraryPdfDocument({ data, user }: ItineraryPdfDocumentProps) {
  const [profileSync, setProfileSync] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setProfileSync((prev) => prev + 1);
    window.addEventListener("agency_profile_updated", handleUpdate);
    return () => window.removeEventListener("agency_profile_updated", handleUpdate);
  }, []);

  const company = getCompanyProfile(user);

  const {
    quotationRef = "QT-20261030-001",
    quotationDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    clientName = "Valued Traveler",
    clientPhone = "",
    clientEmail = "",
    tripTitle = "",
    destination = "",
    duration = "Dates to be confirmed",
    adults = "2",
    children = "0",
    finalRate = "0",
    discountAmount = 0,
    discountPercent = 10,
    gstAmount = 0,
    gstRate = 18,
    days = [],
    hotels = [],
    transports = [],
    sightseeings = [],
    inclusions = [],
    exclusions = [],
    clientNotes = "",
    guestPhotos = [],
    heroImage = "",
  } = data;

  // Filter user data
  const activeDays = days.filter((d) => (d.title || d.description || "").trim());
  const activeHotels = hotels.filter((h) => (h.hotelName || "").trim());
  const activeTransports = transports.filter((t) => (t.vehicleType || t.route || t.notes || "").trim());
  const activeActivities = (sightseeings || []).filter((s) => (s.title || "").trim());

  // User inclusions/exclusions (custom items added by user)
  const effectiveInclusions = (inclusions || []).filter((i) => i && i.trim());
  const effectiveExclusions = (exclusions || []).filter((e) => e && e.trim());

  const numAdults = parseInt(adults) || 1;
  const numChildren = parseInt(children) || 0;
  const guestCount = `${numAdults} Adult${numAdults > 1 ? "s" : ""}${
    numChildren > 0 ? ` · ${numChildren} Child${numChildren > 1 ? "ren" : ""}` : ""
  }`;

  const numFinalPrice = parseFloat(finalRate || "0");
  const formattedPrice = numFinalPrice > 0 ? numFinalPrice.toLocaleString("en-IN") : "0";

  // Chunk days intelligently
  const { firstPageDays, otherPages: dayPages } = chunkDays(activeDays);

  const hasAccommodationsOrFleet =
    activeHotels.length > 0 || activeTransports.length > 0 || activeActivities.length > 0;

  const hasPaymentDetails = Boolean(
    company.accountNumber || company.upiId || company.accountHolder || company.ifsc
  );

  // ONLY show guest picture page if user actually provided guest photos
  const hasActualGuestPhotos = Boolean(guestPhotos && guestPhotos.length > 0);

  // Total pages calculation
  let totalPages = 1; // Page 1: Cover
  totalPages += 1; // Page 2: Summary + first day(s)
  totalPages += dayPages.length; // Remaining day pages
  if (hasAccommodationsOrFleet) totalPages += 1; // Accommodations & Transport
  totalPages += 1; // Inclusions, Exclusions, Cancellation & Privacy Policy (Always guaranteed)
  if (hasPaymentDetails) totalPages += 1; // Payment & Bank info
  if (hasActualGuestPhotos) totalPages += 1; // Actual guest pictures

  let currentPage = 1;

  const coverBg =
    heroImage ||
    activeDays.find((d) => d.images && d.images[0]?.trim())?.images?.[0] ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600";

  // Dynamic customer display name (properly capitalized, e.g. "deepak" -> "Deepak", "aarif" -> "Aarif")
  const rawClientName = (clientName || "Valued Traveler").trim();
  const customerDisplayName = rawClientName
    ? rawClientName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Valued Traveler";

  return (
    <div className="font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white bg-slate-100 flex flex-col items-center">
      {/* ========================================================================= */}
      {/* PAGE 1: COVER PAGE (With Highly Visible Scenery & Welcome Briefing)       */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        {/* Scenic Travel Background Image Layer (Original Luminous Style Restored) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={coverBg}
            alt="Cover Travel Scenery"
            className="w-full h-full object-cover scale-105"
          />
          {/* Luminous frosted overlay to ensure scenery shines through while text is 100% readable */}
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-white/95" />
        </div>

        <div className="h-full flex flex-col justify-between pt-14 pb-20 px-12 text-center relative z-10">
          {/* Top Logo & Agency Brand Name from User Settings */}
          <div className="flex flex-col items-center">
            <CompanyLogo
              logo={company.logo}
              name={company.name}
              className="h-20 max-w-[240px] w-auto object-contain mb-3 drop-shadow-xs shrink-0"
            />

            <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-[#1e3a8a] mt-1 drop-shadow-xs">
              {(company.name || "EXCLUSIVE TRAVEL QUOTATION").replace(/^\.+/, "").trim()}
            </h1>
          </div>

          {/* Quotation Info & Client Name Showcase Card with Dynamic Customer Name & Welcome Briefing */}
          <div className="my-auto py-5 relative z-10 max-w-lg mx-auto w-full">
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/90 shadow-xl text-center space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                QUOTATION
              </p>
              <p className="text-xs text-slate-600 font-medium">
                No: {quotationRef} &nbsp;|&nbsp; Date: {quotationDate} &nbsp;|&nbsp; Valid: {validUntilDate}
              </p>

              <div className="pt-5 border-t border-slate-200/70 mt-3 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  PREPARED EXCLUSIVELY FOR
                </p>
                <h2 className="text-3xl font-black text-[#0f2942] tracking-tight mt-0.5">
                  {customerDisplayName}
                </h2>
                {tripTitle && (
                  <p className="text-sm font-semibold text-teal-700 mt-1">
                    {tripTitle}
                  </p>
                )}
                {destination && (
                  <p className="text-xs text-slate-500 font-medium">
                    {destination} · {duration}
                  </p>
                )}
              </div>

              {/* Welcome Briefing with Dynamic Customer Name */}
              <div className="pt-3 border-t border-slate-200/70 mt-2 text-xs text-slate-600 leading-relaxed text-center">
                <p>
                  Dear <strong className="text-slate-800 font-bold">{customerDisplayName}</strong>, welcome to your bespoke travel proposal! We are delighted to present this customized holiday itinerary crafted exclusively for your upcoming journey.
                </p>
              </div>
            </div>
          </div>

          {/* Accreditations & Badges */}
          <div className="space-y-4">
            <p className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
              MOT REGISTERED &nbsp;|&nbsp; IATA ACCREDITED &nbsp;|&nbsp; IATO MEMBER &nbsp;|&nbsp; TAAI MEMBER &nbsp;|&nbsp; ADTOI MEMBER &nbsp;|&nbsp; ATOAI MEMBER
            </p>
            <div className="flex items-center justify-center gap-7 pt-1 flex-wrap">
              <MotBadge />
              <IataBadge />
              <IatoBadge />
              <TaaiBadge />
              <AdtoiBadge />
              <AtoaiBadge />
            </div>

            {/* Contact Details from User Settings */}
            <div className="pt-6 text-xs text-slate-600 space-y-1 font-medium">
              <p>
                {[company.website, company.phone, company.email].filter(Boolean).join(" · ") ||
                  "Verified Travel Specialist"}
              </p>
              {company.address && <p>{company.address}</p>}
            </div>
          </div>
        </div>

        <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: EXECUTIVE SUMMARY, INVESTMENT BREAKDOWN & ITINERARY START         */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <div className="p-6 pb-12 space-y-2.5">
          <QuotationHeaderMini
            company={company}
            quotationRef={quotationRef}
            quotationDate={quotationDate}
            validUntilDate={validUntilDate}
          />

          {/* Section Banner */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
              EXECUTIVE TRIP SUMMARY &amp; INVESTMENT
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">All Prices in INR (₹)</span>
          </div>

          {/* Top 2-Column: Price Card + Package Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* TOTAL QUOTATION PRICE CARD */}
            <div className="bg-[#f4f7fb] border border-blue-200/80 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                  TOTAL QUOTATION INVESTMENT
                </p>
                <div className="space-y-0.5 text-xs pt-0.5">
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="font-semibold text-emerald-700">
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {gstAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span>GST ({gstRate}%)</span>
                      <span className="font-semibold text-slate-800">
                        ₹{gstAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">Amount Payable</p>
                  <p className="text-[9.5px] text-slate-400">
                    {gstAmount > 0 ? `Inclusive of ${gstRate}% GST` : "All-inclusive quotation rate"}
                  </p>
                </div>
                <p className="text-2xl font-black text-[#1e3a8a] tracking-tight leading-none">
                  ₹{formattedPrice}
                </p>
              </div>
            </div>

            {/* PREPARED FOR & PACKAGE DETAILS */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  TRAVELER &amp; PACKAGE SPECIFICATIONS
                </p>
                <div className="space-y-0.5 text-xs">
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Guest Name:</span>
                    <strong className="text-slate-900">{customerDisplayName}</strong>
                  </p>
                  <p className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Package:</span>
                    <span className="font-bold text-slate-800 text-right truncate">
                      {tripTitle || (destination ? `${destination} Tour` : "Confirmed Package")}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Duration:</span>
                    <span className="font-bold text-slate-800">{duration}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 font-medium">Travelers:</span>
                    <span className="font-bold text-slate-800">{guestCount}</span>
                  </p>
                </div>
              </div>
              {destination && (
                <div className="pt-0.5 border-t border-slate-200/80 text-[10px] text-slate-500">
                  <span>Destination: </span>
                  <strong className="text-teal-800">{destination}</strong>
                </div>
              )}
            </div>
          </div>

          {/* DAY-WISE ITINERARY (Timeline matching screenshot with small image in side) */}
          <div className="pt-0.5 space-y-1.5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
              <div className="w-4 h-4 text-sky-600 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] leading-none">
                DETAILED DAY-WISE TOUR ITINERARY
              </h3>
            </div>

            {firstPageDays.length > 0 ? (
              <div className="space-y-1">
                {firstPageDays.map((day, idx) => (
                  <DayTimelineItem
                    key={day.day}
                    day={day}
                    totalDays={activeDays.length}
                    hotelMealPlan={activeHotels[0]?.mealPlan}
                    isLast={idx === firstPageDays.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                Detailed day-wise schedule will be added to this quotation proposal.
              </div>
            )}
          </div>
        </div>

        <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
      </div>

      {/* ========================================================================= */}
      {/* PAGES 3..N: REMAINING DAYS (TIMELINE WITH SMALL IMAGE IN SIDE)            */}
      {/* ========================================================================= */}
      {dayPages.map((pageDays, pIdx) => (
        <div key={pIdx} data-pdf-page className={PAGE}>
          <div className="p-6 pb-12 space-y-2.5">
            <QuotationHeaderMini
              company={company}
              quotationRef={quotationRef}
              quotationDate={quotationDate}
              validUntilDate={validUntilDate}
            />

            <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
              <div className="w-4 h-4 text-sky-600 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] leading-none">
                DETAILED DAY-WISE TOUR ITINERARY (CONTINUED)
              </h3>
            </div>

            <div className="space-y-1">
              {pageDays.map((day, idx) => (
                <DayTimelineItem
                  key={day.day}
                  day={day}
                  totalDays={activeDays.length}
                  hotelMealPlan={activeHotels[0]?.mealPlan}
                  isLast={idx === pageDays.length - 1}
                />
              ))}
            </div>
          </div>

          <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
        </div>
      ))}

      {/* ========================================================================= */}
      {/* PAGE: CONFIRMED ACCOMMODATIONS & TRANSPORT FLEET                          */}
      {/* ========================================================================= */}
      {hasAccommodationsOrFleet && (
        <div data-pdf-page className={PAGE}>
          <div className="p-6 pb-12 space-y-3">
            <QuotationHeaderMini
              company={company}
              quotationRef={quotationRef}
              quotationDate={quotationDate}
              validUntilDate={validUntilDate}
            />

            {/* HOTELS & STAYS SECTION */}
            {activeHotels.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                    CONFIRMED ACCOMMODATION &amp; STAYS
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {activeHotels.length} Hotel{activeHotels.length > 1 ? "s" : ""} Selected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeHotels.map((hotel, hIdx) => {
                    const nightLabels = [`${hIdx + 1}${getOrdinalSuffix(hIdx + 1)}`];
                    const hotelPhoto =
                      hotel.imageUrl ||
                      (hotel.amenities?.startsWith("http") ? hotel.amenities : null);

                    return (
                      <div
                        key={hIdx}
                        className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            {nightLabels.map((nl) => (
                              <span
                                key={nl}
                                className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-100"
                              >
                                {nl} Night
                              </span>
                            ))}
                            <span className="font-bold text-slate-900 text-xs ml-1">
                              Stay at {hotel.location || "Confirmed Destination"}
                            </span>
                          </div>

                          {(hotel.checkIn || hotel.checkOut) && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              In: {formatPdfDateTime(hotel.checkIn, "14:00")} · Out:{" "}
                              {formatPdfDateTime(hotel.checkOut, "11:00")}
                            </p>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                {hotel.hotelName}
                              </h4>
                              {hotel.starRating && (
                                <p className="text-xs text-amber-500 font-bold tracking-widest mt-0.5">
                                  {renderStarRating(hotel.starRating)}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                              <div>
                                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                                  ROOM DETAILS
                                </p>
                                <p className="font-semibold text-slate-900 text-[11px]">
                                  {hotel.rooms || 1} {hotel.roomCategory || "Deluxe Room"}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {hotel.rooms || 1} Room(s) · {hotel.nights || 1} Night(s)
                                </p>
                              </div>

                              <div>
                                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                                  MEAL PLAN
                                </p>
                                <p className="font-bold text-teal-800 uppercase text-[11px]">
                                  {hotel.mealPlan || "CP (Breakfast Included)"}
                                </p>
                              </div>
                            </div>

                            {hotel.amenities && !hotel.amenities.startsWith("http") && (
                              <p className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                                <span className="font-semibold text-slate-600">Inclusions: </span>
                                {hotel.amenities}
                              </p>
                            )}
                          </div>

                          {hotelPhoto && (
                            <div className="w-[50mm] h-[32mm] shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
                              <img
                                src={hotelPhoto}
                                alt={hotel.hotelName}
                                className="w-full h-full object-cover"
                                crossOrigin={getSafeCrossOrigin(hotelPhoto)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TRANSPORTATION SECTION */}
            {activeTransports.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                    TRANSPORTATION &amp; FLEET SPECIFICATIONS
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Dedicated Vehicle</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
                  <div className="bg-[#1e3a8a] text-white font-semibold flex px-3 py-1.5 text-[10.5px]">
                    <div className="w-8">#</div>
                    <div className="w-36">Vehicle Category</div>
                    <div className="flex-1">Vehicle Details &amp; Inclusions</div>
                    <div className="w-32">Route / Scope</div>
                    <div className="w-16 text-right">Units</div>
                  </div>
                  {activeTransports.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex px-3 py-2 border-b border-slate-150 last:border-0 bg-white items-center text-[11px]"
                    >
                      <div className="w-8 text-slate-400 font-medium">{idx + 1}</div>
                      <div className="w-36 font-bold capitalize text-slate-900">
                        {t.vehicleType || "Private AC Vehicle"}
                      </div>
                      <div className="flex-1 text-slate-700 whitespace-pre-line leading-tight">
                        {t.notes || "Dedicated AC cab with chauffeur, fuel, toll taxes & parking"}
                      </div>
                      <div className="w-32 text-slate-600 font-medium">{t.route || "All Transfers"}</div>
                      <div className="w-16 text-right font-bold text-slate-800">
                        {t.vehiclesCount ? `${t.vehiclesCount} Unit(s)` : "1"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVITIES & EXCURSIONS */}
            {activeActivities.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                    ACTIVITIES, EXCURSIONS &amp; EXPERIENCES
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Confirmed Sightseeing</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
                  <div className="bg-[#1e3a8a] text-white font-semibold flex px-3 py-1.5 text-[10.5px]">
                    <div className="w-8">#</div>
                    <div className="flex-1">Activity / Attraction</div>
                    <div className="w-44">Location</div>
                    <div className="w-28">Date</div>
                    <div className="w-16 text-right">Pax</div>
                  </div>
                  {activeActivities.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex px-3 py-2 border-b border-slate-150 last:border-0 bg-white items-center text-[11px]"
                    >
                      <div className="w-8 text-slate-400 font-medium">{idx + 1}</div>
                      <div className="flex-1 font-bold text-slate-900 capitalize">{act.title}</div>
                      <div className="w-44 text-slate-600 capitalize">{act.city || "--"}</div>
                      <div className="w-28 text-slate-500">{act.date || quotationDate}</div>
                      <div className="w-16 text-right font-bold text-slate-800">{act.pax || 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE: INCLUSIONS, EXCLUSIONS, CANCELLATION & PRIVACY POLICY (GUARANTEED)  */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <div className="p-6 pb-12 space-y-2.5">
          <QuotationHeaderMini
            company={company}
            quotationRef={quotationRef}
            quotationDate={quotationDate}
            validUntilDate={validUntilDate}
          />

          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
              INCLUSIONS, EXCLUSIONS &amp; TRAVEL POLICIES
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Standard Commercial Guidelines</span>
          </div>

          {/* 2-Column: INCLUSIONS & EXCLUSIONS */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Inclusions Card */}
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-emerald-200/80 pb-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                  PACKAGE INCLUSIONS
                </p>
              </div>

              <ul className="space-y-1.5 text-[10.5px] text-slate-700">
                {effectiveInclusions.length > 0 ? (
                  effectiveInclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2 leading-snug">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5] mt-0.5" />
                      <span className="font-medium text-slate-800">{inc}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[10px] text-slate-400 italic">No specific inclusions added</li>
                )}
              </ul>
            </div>

            {/* Exclusions Card */}
            <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-rose-200/80 pb-1.5">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                  PACKAGE EXCLUSIONS
                </p>
              </div>

              <ul className="space-y-1.5 text-[10.5px] text-slate-700">
                {effectiveExclusions.length > 0 ? (
                  effectiveExclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2 leading-snug">
                      <X className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.5] mt-0.5" />
                      <span className="font-medium text-slate-800">{exc}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[10px] text-slate-400 italic">No specific exclusions added</li>
                )}
              </ul>
            </div>
          </div>

          {/* CANCELLATION & REFUND POLICY */}
          <div className="border border-slate-200 bg-white rounded-xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                CANCELLATION &amp; REFUND GUIDELINES
              </p>
              <span className="text-[9.5px] text-slate-400">Calculated from departure date</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
              {DEFAULT_CANCELLATION_POLICY.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 space-y-0.5"
                >
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{p.period}</p>
                  <p
                    className={`text-xs font-black ${
                      idx === 0
                        ? "text-emerald-700"
                        : idx === 1
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {p.refund}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-tight">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVACY POLICY & TRAVELER DATA PROTECTION */}
          <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center shrink-0">
                <Lock className="w-2.5 h-2.5 text-white" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                PRIVACY POLICY &amp; DATA PROTECTION
              </p>
            </div>
            <p className="text-[10.5px] text-slate-600 leading-relaxed font-normal">
              We respect and safeguard your privacy. All traveler information, government identification proofs (Aadhaar / Passport), contact numbers, and billing details collected during the inquiry and booking process are used strictly for airline ticketing, hotel reservations, transport permits, and official travel vouchers. We never sell, rent, or disclose client data to unauthorized third parties.
            </p>
          </div>

          {/* GENERAL TERMS & IMPORTANT NOTES */}
          <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-3 space-y-1.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
              GENERAL TERMS &amp; TRAVEL GUIDELINES
            </p>
            <ul className="space-y-1 text-[10px] text-slate-600">
              <li className="flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span>Standard hotel check-in time is 14:00 hrs and check-out time is 11:00 hrs across all properties.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span>Government-issued Photo ID (Aadhaar, Passport, or Voter ID) is mandatory for all adult guests upon check-in.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span>Vehicles are provided for designated itinerary transfers and sightseeing; not available on a 24-hour disposal basis.</span>
              </li>
            </ul>

            {/* User Custom Notes if any */}
            {clientNotes && (
              <div className="pt-2 border-t border-slate-200 mt-1">
                <p className="text-[10px] font-bold uppercase text-teal-800 mb-0.5">Special Agent Notes:</p>
                <p className="text-[10.5px] text-slate-700 whitespace-pre-line leading-relaxed bg-white p-2 rounded-lg border border-teal-200">
                  {clientNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE: PAYMENT OPTIONS & BANK TRANSFER                                     */}
      {/* ========================================================================= */}
      {hasPaymentDetails && (
        <div data-pdf-page className={PAGE}>
          <div className="p-6 pb-12 space-y-3">
            <QuotationHeaderMini
              company={company}
              quotationRef={quotationRef}
              quotationDate={quotationDate}
              validUntilDate={validUntilDate}
            />

            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                PAYMENT DETAILS &amp; BANK TRANSFER OPTIONS
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Secure Payment Gateway</span>
            </div>

            {/* Bank Card + QR Code */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2 text-xs text-slate-700 flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    BANK TRANSFER DETAILS
                  </p>

                  {company.accountHolder && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">Account Name:</span>
                      <strong className="text-slate-900">{company.accountHolder}</strong>
                    </div>
                  )}
                  {company.bankName && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">Bank Name:</span>
                      <strong className="text-slate-900">{company.bankName}</strong>
                    </div>
                  )}
                  {company.accountNumber && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">Account Number:</span>
                      <strong className="font-mono text-slate-900 text-sm tracking-wider">
                        {company.accountNumber}
                      </strong>
                    </div>
                  )}
                  {company.ifsc && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">IFSC Code:</span>
                      <strong className="font-mono text-slate-900 text-sm tracking-wider">
                        {company.ifsc}
                      </strong>
                    </div>
                  )}
                  {company.upiId && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">UPI ID:</span>
                      <strong className="font-mono text-teal-800 font-bold">{company.upiId}</strong>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Phone / WhatsApp:</span>
                      <strong className="font-mono text-slate-900">{company.phone}</strong>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-slate-400 font-medium text-[10.5px]">Supported Modes:</span>
                    <PaytmBadge />
                    <GpayBadge />
                    <PhonePeBadge />
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                      NEFT / IMPS / RTGS
                    </span>
                  </div>
                </div>

                {/* Instant QR Code */}
                {company.upiId && (
                  <div className="flex flex-col items-center shrink-0 pl-4 border-l border-slate-200">
                    <div className="p-2 border border-slate-300 rounded-xl bg-white shadow-2xs">
                      <UpiPaymentQr size={130} upiId={company.upiId} />
                    </div>
                    <span className="text-[9.5px] font-bold text-teal-800 mt-1">Scan &amp; Pay via UPI</span>
                    <span className="text-[8.5px] text-slate-400">Zero Convenience Fee</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOOKING PROCESS & CONFIRMATION MILESTONES */}
            <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-4 space-y-2">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#1e3a8a]">
                BOOKING &amp; CONFIRMATION MILESTONES
              </p>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-teal-700">01. Deposit</span>
                  <p className="font-bold text-slate-800 text-[11px]">25% Advance</p>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    Secures hotel reservations and vehicle fleet block.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-blue-700">02. Balance</span>
                  <p className="font-bold text-slate-800 text-[11px]">75% Balance</p>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    Payable 15 days prior to scheduled tour departure.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-emerald-700">03. Vouchers</span>
                  <p className="font-bold text-slate-800 text-[11px]">Travel Vouchers</p>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    Receive verified hotel vouchers and driver contact details.
                  </p>
                </div>
              </div>
            </div>

            {/* AUTHORIZED SIGN-OFF & STAMP */}
            <div className="pt-2 flex items-end justify-between text-xs text-slate-600">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">QUOTATION ISSUED BY</p>
                <p className="font-bold text-slate-900 text-sm">{company.name || "Authorized Travel Partner"}</p>
                <p className="text-[11px] text-slate-500">
                  {[company.email, company.phone].filter(Boolean).join(" · ")}
                </p>
              </div>

              <div className="text-center space-y-1">
                <div className="w-40 h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 bg-white">
                  Authorized Sign &amp; Seal
                </div>
                <p className="text-[9px] text-slate-400">Official Travel Specialist Signature</p>
              </div>
            </div>
          </div>

          <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE: GUEST PICTURES (ONLY IF USER UPLOADED ACTUAL GUEST PHOTOS)          */}
      {/* ========================================================================= */}
      {hasActualGuestPhotos && (
        <div data-pdf-page className={PAGE}>
          <div className="h-full flex flex-col justify-between items-center p-10 pb-20 text-center">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight pt-2">
              Our Guest Pictures &amp; Memories
            </h2>

            <div className="my-auto max-w-[170mm] max-h-[195mm] overflow-hidden rounded-xl border border-slate-200 shadow-md">
              <img
                src={guestPhotos[0]}
                alt="Our Guests"
                className="w-full h-full object-cover max-h-[195mm]"
                crossOrigin={getSafeCrossOrigin(guestPhotos[0])}
              />
            </div>

            <div className="pt-2 text-center text-xs text-slate-400">
              <p>
                Generated by {company.name || "Authorized Travel Partner"} &nbsp;|&nbsp; {quotationDate}
              </p>
            </div>
          </div>

          <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
        </div>
      )}
    </div>
  );
}

// =========================================================================
// HELPER COMPONENTS
// =========================================================================

function getDayMeals(day: DetailedItineraryDay, totalDays: number, defaultHotelPlan?: string): string {
  if (day.meals && day.meals.trim()) return day.meals;

  const desc = (day.description || "").toLowerCase();
  const hasBreakfast = desc.includes("breakfast");
  const hasLunch = desc.includes("lunch");
  const hasDinner = desc.includes("dinner");

  if (hasBreakfast && hasDinner) return "Breakfast & Dinner";
  if (hasBreakfast && hasLunch && hasDinner) return "All Meals";
  if (hasBreakfast) return "Breakfast";
  if (hasDinner) return "Dinner";

  if (defaultHotelPlan) {
    if (defaultHotelPlan.includes("MAP") || defaultHotelPlan.toLowerCase().includes("dinner")) {
      return "Breakfast & Dinner";
    }
    if (defaultHotelPlan.includes("CP") || defaultHotelPlan.toLowerCase().includes("breakfast")) {
      return "Breakfast";
    }
    if (defaultHotelPlan.includes("AP")) return "All Meals";
  }

  if (day.day === 1) return "Dinner";
  if (day.day === totalDays && totalDays > 1) return "Breakfast";
  return "Breakfast & Dinner";
}

function getDayHighlights(day: DetailedItineraryDay): string {
  if (day.highlights && day.highlights.length > 0) {
    return day.highlights.join(", ");
  }
  if (day.activities && day.activities.trim() && day.activities !== day.title) {
    return day.activities;
  }
  if (day.destination) {
    return `${day.destination} sightseeing, local transfers & photo stops`;
  }
  return "";
}

function DayTimelineItem({
  day,
  totalDays,
  hotelMealPlan,
  isLast,
}: {
  day: DetailedItineraryDay;
  totalDays: number;
  hotelMealPlan?: string;
  isLast?: boolean;
}) {
  const photo = day.images?.[0];
  const cleanTitle = day.title.replace(/^Day\s*\d+\s*[:\-]\s*/i, "").trim() || "Tour & Sightseeing";
  const meals = getDayMeals(day, totalDays, hotelMealPlan);
  const highlights = getDayHighlights(day);

  return (
    <div className="flex items-stretch gap-2.5">
      {/* Timeline Column: Circle Badge + Connecting Vertical Line */}
      <div className="flex flex-col items-center shrink-0 w-5 pt-0.5">
        <div className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-[10px] shadow-xs shrink-0 ring-2 ring-white">
          {day.day}
        </div>
        {!isLast && (
          <div className="w-[2px] flex-1 bg-sky-200 my-1" />
        )}
      </div>

      {/* Day Card */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs space-y-1 mb-1.5">
        {/* Top Header of Card: Day Title on left, Meals badge on right */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-0.5">
          <h4 className="text-xs font-bold text-slate-900 leading-snug">
            Day {day.day}: {cleanTitle}
          </h4>
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 text-[9px] font-semibold tracking-tight">
            Meals: {meals}
          </span>
        </div>

        {/* Content & Small Image on the side */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-[10px] text-slate-600 leading-relaxed font-normal whitespace-pre-line">
              {day.description}
            </p>

            {highlights && (
              <div className="flex items-start gap-1 text-[9.5px] pt-0.5 border-t border-slate-100 leading-tight">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">
                  <strong className="text-slate-800 font-bold">Highlights: </strong>
                  <span>{highlights}</span>
                </p>
              </div>
            )}
          </div>

          {/* Small image in side */}
          {photo && (
            <div className="w-[34mm] h-[22mm] shrink-0 overflow-hidden rounded-lg border border-slate-200/90 shadow-2xs bg-slate-50">
              <img
                src={photo}
                alt={day.title}
                className="w-full h-full object-cover"
                crossOrigin={getSafeCrossOrigin(photo)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuotationPageFooter({
  pageNum,
  totalPages,
  company,
}: {
  pageNum: number;
  totalPages: number;
  company: {
    website?: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
  };
}) {
  return (
    <>
      <div className="absolute bottom-8 left-0 right-0 text-center text-[9px] text-slate-400 font-normal">
        This quotation is valid until the date mentioned above. Prices and availability are subject to re-confirmation.
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#0b5c53] text-white flex items-center justify-between px-6 text-[9.5px] font-medium tracking-tight">
        <div className="flex items-center gap-3">
          {company.website && <span>{company.website}</span>}
          {company.website && company.phone && <span className="text-white/40">|</span>}
          {company.phone && <span>Ph: {company.phone}</span>}
          {company.instagram && (
            <>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1.5">
                <InstagramSvg className="w-3.5 h-3.5" />
                <span>{company.instagram}</span>
              </span>
            </>
          )}
          {company.facebook && (
            <span className="flex items-center gap-1.5">
              <FacebookSvg className="w-3.5 h-3.5" />
              <span>{company.facebook}</span>
            </span>
          )}
        </div>
        <div className="font-bold tracking-wider">
          {pageNum} / {totalPages}
        </div>
      </div>
    </>
  );
}

function CompanyLogo({
  logo,
  name,
  className = "h-20 max-w-[240px] w-auto object-contain mb-3",
}: {
  logo?: string;
  name?: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [loadError, setLoadError] = useState(false);

  const cleanName = (name || "Agency").replace(/^\.+/, "").trim();

  // Resolve logo to full URL or data URL
  const resolvedUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("agency_company_logo_data");
      if (cached && cached.startsWith("data:image")) return cached;
    }
    return resolveImageUrl(logo);
  }, [logo]);

  useEffect(() => {
    setLoadError(false);
    if (!resolvedUrl) {
      setDataUrl("");
      return;
    }

    if (resolvedUrl.startsWith("data:") || resolvedUrl.startsWith("blob:")) {
      setDataUrl(resolvedUrl);
      return;
    }

    // Try converting remote image to base64 Data URL so html2canvas renders it 100% reliably in PDF
    let active = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const b64 = canvas.toDataURL("image/png");
          if (active && b64 && b64.length > 50) {
            setDataUrl(b64);
            try {
              localStorage.setItem("agency_company_logo_data", b64);
            } catch {}
            return;
          }
        }
      } catch (e) {}
      if (active) setDataUrl(resolvedUrl);
    };
    img.onerror = () => {
      // If anonymous CORS fails, STILL use resolvedUrl for preview! Never hide logo!
      if (active) setDataUrl(resolvedUrl);
    };
    img.src = resolvedUrl;

    return () => {
      active = false;
    };
  }, [resolvedUrl]);

  if (!resolvedUrl || loadError) {
    const isSmall =
      className.includes("h-10") ||
      className.includes("h-11") ||
      className.includes("w-8") ||
      className.includes("max-w-[120px]") ||
      className.includes("max-w-[130px]");
    return (
      <div
        className={`${
          isSmall
            ? "w-10 h-10 rounded-xl text-sm"
            : "w-16 h-16 rounded-2xl text-2xl mb-3 shadow-md border-2 border-white/80"
        } bg-[#1e3a8a] text-white flex items-center justify-center font-black shrink-0`}
      >
        {cleanName.charAt(0).toUpperCase() || "A"}
      </div>
    );
  }

  const effectiveSrc = dataUrl || resolvedUrl;

  return (
    <img
      src={effectiveSrc}
      alt={cleanName}
      className={className}
      onError={() => {
        if (effectiveSrc !== resolvedUrl && resolvedUrl) {
          setDataUrl(resolvedUrl);
        } else {
          setLoadError(true);
        }
      }}
    />
  );
}

function QuotationHeaderMini({
  company,
  quotationRef,
  quotationDate,
  validUntilDate,
}: {
  company: any;
  quotationRef?: string;
  quotationDate?: string;
  validUntilDate?: string;
}) {
  const cleanCompanyName = (company.name || "TRAVEL QUOTATION").replace(/^\.+/, "").trim();

  return (
    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
      <div className="flex items-center gap-3.5">
        <CompanyLogo
          logo={company.logo}
          name={cleanCompanyName}
          className="h-11 w-auto object-contain max-w-[130px] shrink-0"
        />

        <div className="space-y-0.5 text-xs text-slate-500">
          <h2 className="text-base font-black tracking-wide uppercase text-[#1e3a8a] leading-tight">
            {cleanCompanyName}
          </h2>
          {company.website && <p className="text-[10.5px] text-slate-500 leading-tight">{company.website}</p>}
          {company.address && <p className="text-[10.5px] text-slate-500 leading-tight">{company.address}</p>}
          {(company.phone || company.email) && (
            <p className="text-[10.5px] text-slate-500 leading-tight">
              {[company.phone, company.email].filter(Boolean).join(" | ")}
            </p>
          )}
        </div>
      </div>

      <div className="text-right text-xs space-y-0.5 text-slate-600">
        <p className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400">QUOTATION</p>
        <p className="font-bold text-slate-900 text-[11px]">
          Ref: <span className="font-medium text-slate-700">{quotationRef}</span>
        </p>
        <p className="font-bold text-slate-900 text-[11px]">
          Date: <span className="font-medium text-slate-700">{quotationDate}</span>
        </p>
        <p className="font-bold text-slate-900 text-[11px]">
          Valid: <span className="font-medium text-slate-700">{validUntilDate}</span>
        </p>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function MotBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-14">
      <svg className="w-6 h-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L9 7h6l-3-5zm0 17l-4 3 1.5-4.5L6 14h5.5L12 9l1.5 5H19l-3.5 3.5L17 22l-5-3z" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter leading-tight mt-0.5">
        MOT REGISTERED
      </span>
    </div>
  );
}

function IataBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-14">
      <div className="flex items-center justify-center border-2 border-slate-700 rounded-full w-6 h-6">
        <span className="text-[8px] font-black text-slate-800 tracking-tighter">IATA</span>
      </div>
      <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter leading-tight mt-0.5">
        ACCREDITED
      </span>
    </div>
  );
}

function IatoBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-14">
      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center">
        <span className="text-[7px] font-black text-teal-800">IATO</span>
      </div>
      <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter leading-tight mt-0.5">
        IATO MEMBER
      </span>
    </div>
  );
}

function TaaiBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-14">
      <div className="w-6 h-6 rounded-sm bg-slate-100 border border-slate-400 flex items-center justify-center">
        <span className="text-[7px] font-black text-blue-900">TAAI</span>
      </div>
      <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter leading-tight mt-0.5">
        TAAI MEMBER
      </span>
    </div>
  );
}

function AdtoiBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-14">
      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center">
        <span className="text-[6.5px] font-black text-amber-800">ADTOI</span>
      </div>
      <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter leading-tight mt-0.5">
        ADTOI MEMBER
      </span>
    </div>
  );
}

function AtoaiBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-14">
      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center">
        <span className="text-[6.5px] font-black text-emerald-800">ATOAI</span>
      </div>
      <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter leading-tight mt-0.5">
        ATOAI MEMBER
      </span>
    </div>
  );
}

function UpiPaymentQr({ size = 130, upiId }: { size?: number; upiId: string }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center bg-white">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="5" y="5" width="26" height="26" rx="3" stroke="#0f172a" strokeWidth="4" />
        <rect x="11" y="11" width="14" height="14" rx="2" fill="#0f172a" />
        <rect x="69" y="5" width="26" height="26" rx="3" stroke="#0f172a" strokeWidth="4" />
        <rect x="75" y="11" width="14" height="14" rx="2" fill="#0f172a" />
        <rect x="5" y="69" width="26" height="26" rx="3" stroke="#0f172a" strokeWidth="4" />
        <rect x="11" y="75" width="14" height="14" rx="2" fill="#0f172a" />
        <path
          d="
          M36 6h4v4h-4z M44 6h8v4h-8z M56 6h4v4h-4z
          M36 14h8v4h-8z M48 14h4v4h-4z M60 14h4v4h-4z
          M36 22h4v8h-4z M44 26h12v4h-12z M60 22h4v4h-4z
          M6 36h12v4h-12z M22 36h4v4h-4z M30 36h4v4h-4z M38 36h8v4h-8z M50 36h4v4h-4z M58 36h12v4h-12z M74 36h4v4h-4z M82 36h12v4h-12z
          M6 44h4v8h-4z M14 48h12v4h-12z M30 44h4v4h-4z M38 48h8v4h-8z M50 44h8v4h-8z M62 48h8v4h-8z M74 44h4v8h-4z M82 48h12v4h-12z
          M6 56h8v4h-8z M18 60h4v4h-4z M26 56h8v4h-8z M38 56h4v8h-4z M46 60h8v4h-8z M58 56h8v4h-8z M70 60h12v4h-12z M86 56h8v4h-8z
          M36 68h4v4h-4z M44 72h8v4h-8z M56 68h8v4h-8z M68 68h4v4h-4z M76 72h18v4h-18z
          M36 76h8v4h-8z M48 80h4v8h-4z M56 76h4v4h-4z M64 80h8v4h-8z M76 80h4v4h-4z M84 76h10v4h-10z
          M36 84h4v4h-4z M44 88h12v4h-12z M60 84h8v8h-8z M72 88h4v4h-4z M80 84h4v8h-4z M88 88h6v4h-6z
        "
          fill="#0f172a"
        />
        <rect x="42" y="42" width="16" height="16" rx="4" fill="#0b5c53" />
        <text x="50" y="52" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">
          UPI
        </text>
      </svg>
    </div>
  );
}

function PaytmBadge() {
  return (
    <span className="px-2 py-0.5 bg-sky-50 border border-sky-200 rounded font-bold text-[10px] text-sky-700">
      Paytm
    </span>
  );
}

function GpayBadge() {
  return (
    <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold text-[10px] text-slate-800">
      GPay
    </span>
  );
}

function PhonePeBadge() {
  return (
    <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 rounded font-bold text-[10px] text-purple-700">
      PhonePe
    </span>
  );
}

function InstagramSvg({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function FacebookSvg({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.325-.597 1.325-1.326V1.326C24 .597 23.405 0 22.675 0z" />
    </svg>
  );
}

function formatPdfDateTime(dateStr?: string, defaultTime = "14:00") {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formattedDate = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${mins}` === "00:00" ? defaultTime : `${hours}:${mins}`;
    return `${formattedDate} ${timeStr}`;
  } catch {
    return dateStr;
  }
}

function renderStarRating(ratingStr?: string) {
  const num = parseInt(ratingStr || "3") || 3;
  return "★".repeat(Math.min(5, Math.max(1, num))) + "☆".repeat(Math.max(0, 5 - num));
}

function getSafeCrossOrigin(url?: string): "anonymous" | undefined {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
    return undefined;
  }
  return "anonymous";
}
