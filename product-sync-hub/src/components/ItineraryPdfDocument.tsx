import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Check, X } from "lucide-react";
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
  infants?: string;
  rooms?: string;
  mealPlan?: string;
  theme: string;
  colorTheme?: string;
  selectedTheme?: string;
  templateStyle?: "editorial" | "executive" | "modern";
  includeCoverPage?: boolean;
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
  routePlan?: string | string[];
}

interface ItineraryPdfDocumentProps {
  data: ItineraryPdfData;
  user?: User | null;
}

export interface PdfThemeConfig {
  id: string;
  name: string;
  primary: string;        // Main primary brand color e.g. #0f766e
  dark: string;           // Dark text & card headers e.g. #0b5c53
  accent: string;         // Secondary accent e.g. #0d9488
  lightBg: string;        // Light tint for summary & specs cards e.g. #f0fdfa
  cardBorder: string;     // Border color for cards e.g. #99f6e4
  lightBadgeBg: string;   // Pill background e.g. #ccfbf1
  badgeText: string;      // Pill text e.g. #115e59
  lineBg: string;         // Vertical timeline line e.g. #5eead4
  footerBg: string;       // Bottom footer bar background e.g. #0b5c53
}

export const PDF_THEMES: Record<string, PdfThemeConfig> = {
  teal: {
    id: "teal",
    name: "Teal Modern",
    primary: "#0f766e",
    dark: "#0b5c53",
    accent: "#0d9488",
    lightBg: "#f0fdfa",
    cardBorder: "#99f6e4",
    lightBadgeBg: "#ccfbf1",
    badgeText: "#115e59",
    lineBg: "#5eead4",
    footerBg: "#0b5c53",
  },
  blue: {
    id: "blue",
    name: "Royal Blue",
    primary: "#1d4ed8",
    dark: "#1e3a8a",
    accent: "#2563eb",
    lightBg: "#eff6ff",
    cardBorder: "#bfdbfe",
    lightBadgeBg: "#dbeafe",
    badgeText: "#1e40af",
    lineBg: "#93c5fd",
    footerBg: "#1e3a8a",
  },
  indigo: {
    id: "indigo",
    name: "Deep Indigo",
    primary: "#4338ca",
    dark: "#312e81",
    accent: "#4f46e5",
    lightBg: "#eef2ff",
    cardBorder: "#c7d2fe",
    lightBadgeBg: "#e0e7ff",
    badgeText: "#3730a3",
    lineBg: "#a5b4fc",
    footerBg: "#312e81",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Pine",
    primary: "#047857",
    dark: "#064e3b",
    accent: "#059669",
    lightBg: "#ecfdf5",
    cardBorder: "#a7f3d0",
    lightBadgeBg: "#d1fae5",
    badgeText: "#065f46",
    lineBg: "#6ee7b7",
    footerBg: "#064e3b",
  },
  rose: {
    id: "rose",
    name: "Ruby Rose",
    primary: "#be123c",
    dark: "#881337",
    accent: "#e11d48",
    lightBg: "#fff1f2",
    cardBorder: "#fecdd3",
    lightBadgeBg: "#ffe4e6",
    badgeText: "#9f1239",
    lineBg: "#fda4af",
    footerBg: "#881337",
  },
  amber: {
    id: "amber",
    name: "Sunset Gold",
    primary: "#b45309",
    dark: "#78350f",
    accent: "#d97706",
    lightBg: "#fffbeb",
    cardBorder: "#fde68a",
    lightBadgeBg: "#fef3c7",
    badgeText: "#92400e",
    lineBg: "#fcd34d",
    footerBg: "#78350f",
  },
  slate: {
    id: "slate",
    name: "Corporate Slate",
    primary: "#334155",
    dark: "#0f172a",
    accent: "#475569",
    lightBg: "#f8fafc",
    cardBorder: "#cbd5e1",
    lightBadgeBg: "#f1f5f9",
    badgeText: "#1e293b",
    lineBg: "#94a3b8",
    footerBg: "#1e293b",
  },
};

export function resolvePdfTheme(colorKey?: string): PdfThemeConfig {
  if (!colorKey) return PDF_THEMES.teal;
  const key = colorKey.toLowerCase().trim();
  if (PDF_THEMES[key]) return PDF_THEMES[key];
  for (const id of Object.keys(PDF_THEMES)) {
    if (key.includes(id)) return PDF_THEMES[id];
  }
  return PDF_THEMES.teal;
}

export const PdfThemeContext = React.createContext<PdfThemeConfig>(PDF_THEMES.teal);
export const usePdfTheme = () => React.useContext(PdfThemeContext);

const PAGE =
  "w-[210mm] min-w-[210mm] max-w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] box-border bg-white overflow-hidden relative shrink-0 shadow-2xl mb-8 last:mb-0 select-none print:shadow-none print:mb-0 text-slate-800 font-sans leading-normal";

export function resolveImageUrl(url?: string): string {
  if (!url) return "";
  let trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Canonicalize holidaysbindas.com domain to https://www.holidaysbindas.com to prevent 301 redirects and CORS blocks
  if (trimmed.includes("holidaysbindas.com")) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
    if (!trimmed.includes("www.holidaysbindas.com")) {
      trimmed = trimmed.replace("holidaysbindas.com", "www.holidaysbindas.com");
    }
    return trimmed;
  }

  if (trimmed.startsWith("http://")) {
    if (!trimmed.includes("localhost") && !trimmed.includes("127.0.0.1")) {
      return trimmed.replace(/^http:\/\//i, "https://");
    }
    return trimmed;
  }
  if (trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith("www.") || trimmed.includes(".com/") || trimmed.includes(".in/") || trimmed.includes(".org/")) {
    return `https://${trimmed}`;
  }

  const rawApi = (import.meta.env.VITE_API_URL || "https://www.holidaysbindas.com/backend/backend").trim();
  let normApi = rawApi.startsWith("http://") || rawApi.startsWith("https://")
    ? rawApi
    : `https://${rawApi}`;
  if (normApi.includes("holidaysbindas.com")) {
    normApi = normApi.replace(/^http:\/\//i, "https://");
    if (!normApi.includes("www.holidaysbindas.com")) {
      normApi = normApi.replace("holidaysbindas.com", "www.holidaysbindas.com");
    }
  }
  const base = normApi.replace(/\/+$/, "");
  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${clean}`;
}

export function getCompanyProfile(user?: User | null) {
  let localData: any = {};
  let cachedLogoData = "";
  let cachedQrData = "";
  let cachedReviewsData = "";
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("agency_company_profile");
      if (raw) localData = JSON.parse(raw);
      cachedLogoData = localStorage.getItem("agency_company_logo_data") || localData.company_logo_data || "";
      cachedQrData = localStorage.getItem("agency_bank_qr_data") || localData.bank_qr_data || "";
      cachedReviewsData = localStorage.getItem("agency_reviews_banner_data") || localData.reviews_banner_data || "";
    } catch {}
  }

  const rawLogo = user?.company_logo || localData.company_logo || cachedLogoData || "";
  const rawQr = user?.bank_qr || localData.bank_qr || cachedQrData || "";
  const rawReviews = user?.reviews_banner || localData.reviews_banner || cachedReviewsData || "/google-reviews-banner.png";

  // Sync back to local storage cache if retrieved from user database
  if (typeof window !== "undefined" && user?.company_logo && !cachedLogoData) {
    try {
      localStorage.setItem("agency_company_logo_data", user.company_logo);
    } catch {}
  }

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
    qrCode: rawQr,
    reviewsBanner: rawReviews,
    instagram: user?.company_instagram || localData.company_instagram || localData.instagram || "",
    facebook: user?.company_facebook || localData.company_facebook || localData.facebook || "",
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
function parseDayPoints(description?: string, activities?: string, dayTitle?: string): string[] {
  const points: string[] = [];

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/^(day\s*\d+\s*[:\-–—]*\s*)+/i, "")
      .replace(/^[:\-–—\s]+/, "")
      .replace(/[:\-–—\s]+$/, "")
      .trim();

  const normalizedTitle = dayTitle ? normalize(dayTitle) : "";

  const addLine = (rawLine: string) => {
    const clean = rawLine
      .replace(/^([•\-\*–—\u2022\u2023\u25E6\u2043\u2219]+|\d+[\.\)\-:]+)\s*/, "")
      .replace(/^[:\-–—\s]+/, "")
      .trim();
    if (!clean) return;

    // Filter out if this line simply repeats the day title
    if (normalizedTitle && normalize(clean) === normalizedTitle) {
      return;
    }

    if (!points.includes(clean)) {
      points.push(clean);
    }
  };

  // Parse activities if present and distinct
  if (activities && activities.trim()) {
    const actLines = activities.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of actLines) {
      addLine(line);
    }
  }

  // Parse description
  if (description && description.trim()) {
    const descLines = description.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of descLines) {
      addLine(line);
    }
  }

  // If only 1 long line without newlines, split on sentence boundaries
  if (points.length === 1 && points[0].length > 100 && points[0].includes(". ")) {
    const sentences = points[0]
      .split(/(?<=\.)\s+(?=[A-Z0-9])/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length > 1) {
      return sentences.filter((s) => !normalizedTitle || normalize(s) !== normalizedTitle);
    }
  }

  return points.length > 0
    ? points
    : ["Scheduled sightseeing, transfers, and leisure activities as per tour program."];
}

export interface ContentPagePlan {
  days?: {
    list: DetailedItineraryDay[];
    partTitle: string;
  };
  hotels?: {
    list: ItineraryHotel[];
    startNight?: number;
    totalHotels?: number;
  };
  transports?: {
    list: ItineraryTransport[];
  };
  activities?: {
    list: ItinerarySightseeing[];
  };
  inclusionsExclusions?: {
    inclusions: string[];
    exclusions: string[];
  };
  policies?: {
    clientNotes?: string;
    showAccreditations?: boolean;
  };
  payment?: {
    showMilestones?: boolean;
  };
}

// Smart page planner that packs days, hotels, vehicles, policies, and payment
// without unnecessary empty spaces or orphaned items on pages
function estimateDayHeight(day: DetailedItineraryDay): number {
  const hasPhoto = Boolean(day.images?.[0]);
  const cleanTitle =
    (day.title || "")
      .replace(/^(?:day\s*\d+\s*[:\-–—]*\s*)+/i, "")
      .replace(/^[:\-–—\s]+/, "")
      .trim() || "Tour & Sightseeing";
  const titleLines = Math.max(1, Math.ceil((cleanTitle.length + 8) / 80));
  const titleHeight = titleLines * 4.5;

  const charsPerLine = hasPhoto ? 85 : 108;
  const points = parseDayPoints(day.description, day.activities, day.title);
  const bulletsHeight = points.reduce((sum, pt) => {
    const lines = Math.max(1, Math.ceil(pt.length / charsPerLine));
    return sum + lines * 5.0 + 0.5;
  }, 0);

  const photoH = hasPhoto ? 28 : 0;
  const contentH = Math.max(bulletsHeight, photoH);

  const highlightsText =
    day.highlights && day.highlights.length > 0 ? day.highlights.join(", ") : "";
  const highlightsLines = highlightsText
    ? Math.max(1, Math.ceil((highlightsText.length + 12) / charsPerLine))
    : 0;
  const highlightsH = highlightsLines > 0 ? 2.0 + highlightsLines * 3.8 : 0;

  return 7.5 + titleHeight + contentH + highlightsH;
}

const ROUTE_KNOWN_PLACES = [
  "Srinagar Airport", "Srinagar", "Gulmarg", "Pahalgam", "Sonmarg", "Doodhpathri", "Yusmarg",
  "Jammu Airport", "Jammu Railway Station", "Jammu", "Katra", "Vaishno Devi", "Patnitop",
  "Leh Airport", "Leh", "Nubra Valley", "Nubra", "Pangong Tso", "Pangong", "Sham Valley", "Kargil",
  "Manali", "Shimla", "Kufri", "Solang Valley", "Dharamshala", "Dalhousie", "Amritsar", "Delhi Airport", "Delhi", "Agra", "Jaipur",
  "Cochin Airport", "Cochin", "Munnar", "Thekkady", "Alleppey", "Kovalam", "Goa", "Port Blair", "Havelock",
  "Dubai", "Bali", "Ubud", "Kuta", "Nusa Penida", "Bangkok", "Phuket", "Pattaya", "Singapore", "Maldives"
];

export function extractRouteFromItinerary(
  days: DetailedItineraryDay[],
  transports?: ItineraryTransport[],
  fallbackDestination?: string
): string[] {
  // 1. If transports has a structured route with arrows
  if (transports && transports.length > 0) {
    for (const t of transports) {
      if (t.route && (t.route.includes("→") || t.route.includes("->") || t.route.includes("-->"))) {
        const parts = t.route.split(/→|->|-->/).map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) return parts;
      }
    }
  }

  if (!days || days.length === 0) {
    if (fallbackDestination) {
      const clean = fallbackDestination.replace(/tour|package|trip|confirmed/gi, "").trim();
      return clean ? [clean] : [];
    }
    return [];
  }

  const findPlace = (text?: string): string | null => {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const p of ROUTE_KNOWN_PLACES) {
      const regex = new RegExp(`\\b${p.toLowerCase().replace(/\\s+/g, "\\s+")}\\b`, "i");
      if (regex.test(lower)) return p;
    }
    return null;
  };

  const stops: string[] = [];

  days.forEach((day, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === days.length - 1;
    const textAll = `${day.destination || ""} ${day.title || ""} ${day.description || ""}`;

    // For Day 1, check if airport arrival
    if (isFirst) {
      if (/airport/i.test(textAll)) {
        const place = findPlace(textAll);
        if (place && !place.toLowerCase().includes("airport")) {
          stops.push(`${place} Airport`);
        } else if (place) {
          stops.push(place);
        } else {
          stops.push(day.destination || "Airport");
        }

        // Also check if day 1 transfers to another city (e.g. Jammu to Katra)
        if (/transfer to|drive to|proceed to/i.test(day.title || "")) {
          const destMatch = (day.title || "").match(/(?:transfer|drive|proceed)\s+to\s+([A-Za-z\s]+?)(?:&|\/|–|-|$)/i);
          if (destMatch && destMatch[1]) {
            const destClean = destMatch[1].trim();
            const known = findPlace(destClean) || destClean;
            if (known && known !== stops[stops.length - 1]) stops.push(known);
          }
        }
        return;
      }
    }

    // Try finding place from destination field first
    let place = findPlace(day.destination);
    if (!place) {
      if (day.destination && day.destination.trim()) {
        const clean = day.destination
          .replace(/departure|arrival|excursion|tour|sightseeing/gi, "")
          .trim();
        if (clean) place = findPlace(clean) || clean;
      }
    }

    // If still not found, check title
    if (!place && !isLast) {
      place = findPlace(day.title);
    }

    // Check if excursion returning to base (e.g. "Day Excursion to Gulmarg")
    const isExcursion = /excursion|day trip|visit to/i.test(day.title || "");

    if (place) {
      const lastStop = stops[stops.length - 1];
      if (lastStop !== place) {
        stops.push(place);
      }

      // If excursion from base hub, return to base hub if stays in base hub
      if (isExcursion && idx < days.length - 1) {
        const baseHub = stops[0]?.replace(/\s+Airport$/, "");
        if (baseHub && place !== baseHub) {
          stops.push(baseHub);
        }
      }
    }

    // For last day, ensure departure hub is added if different from current last stop
    if (isLast) {
      const placeMatch = findPlace(textAll);
      const cleanBase = placeMatch ? placeMatch.replace(/\s+Airport$/i, "") : "";
      const last = stops[stops.length - 1] || "";
      const cleanLast = last.replace(/\s+Airport$/i, "");
      if (cleanBase && cleanLast !== cleanBase) {
        stops.push(cleanBase);
      }
    }
  });

  // Final deduplication of consecutive duplicate stops
  const finalStops: string[] = [];
  for (let i = 0; i < stops.length; i++) {
    if (i === 0 || stops[i] !== stops[i - 1]) {
      finalStops.push(stops[i]);
    }
  }

  if (finalStops.length >= 2) return finalStops;
  if (fallbackDestination) {
    const clean = fallbackDestination.replace(/tour|package|trip|confirmed/gi, "").trim();
    if (clean) return [clean];
  }
  return finalStops;
}

export function renderRouteStopIcon(stop: string) {
  const s = stop.toLowerCase();
  if (/airport|flight/i.test(s)) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-sky-600 shrink-0">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    );
  }
  if (/railway|train|station|tawi/i.test(s)) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-amber-600 shrink-0">
        <rect width="16" height="16" x="4" y="3" rx="2" />
        <path d="M4 11h16" />
        <path d="M12 3v8" />
        <path d="m8 19-2 3" />
        <path d="m18 22-2-3" />
        <circle cx="8" cy="15" r="1" />
        <circle cx="16" cy="15" r="1" />
      </svg>
    );
  }
  if (/katra|vaishno|darshan|temple|amritsar|haridwar|rishikesh/i.test(s)) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-orange-600 shrink-0">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6a3 3 0 0 1 6 0v6" />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (/gulmarg|pahalgam|sonmarg|doodhpathri|yusmarg|gurez|sinthan|manali|shimla|kufri|solang|leh|nubra|pangong|ladakh|patnitop|kashmir/i.test(s)) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-600 shrink-0">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </svg>
    );
  }
  if (/goa|havelock|kovalam|andaman|maldives|phuket|bali|beach/i.test(s)) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-teal-600 shrink-0">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  // Default stylish map pin
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-sky-600 shrink-0">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function planContentPages({
  activeDays = [],
  activeHotels = [],
  activeTransports = [],
  activeActivities = [],
  effectiveInclusions = [],
  effectiveExclusions = [],
  hasPaymentDetails = false,
  clientNotes = "",
}: {
  activeDays: DetailedItineraryDay[];
  activeHotels: ItineraryHotel[];
  activeTransports: ItineraryTransport[];
  activeActivities: ItinerarySightseeing[];
  effectiveInclusions: string[];
  effectiveExclusions: string[];
  hasPaymentDetails: boolean;
  clientNotes: string;
}): ContentPagePlan[] {
  // A4 page is 297mm. Reserve ~20mm at bottom (13mm validity disclaimer + footer + 7mm buffer).
  const MAX_PAGE_HEIGHT = 271; // mm of usable vertical space per page
  const TOP_CARD_HEIGHT = 105; // Realistic height of Company Detail + Summary Card with inline route
  const PAGE_1_USABLE_HEIGHT = MAX_PAGE_HEIGHT - TOP_CARD_HEIGHT; // ~166mm available on Page 1
  const MIN_SPACE_THRESHOLD = 12; // Tight ~12mm bottom space (matching Page 1 bottom margin)
  const pages: ContentPagePlan[] = [];

  const getHotelsHeight = (count: number) =>
    count > 0 ? 8 + count * 38 : 0;

  const transportsHeight =
    activeTransports.length > 0
      ? 7 +
        activeTransports.reduce((sum, t) => {
          const hasNotes = Boolean(t.notes);
          const hasDates = Boolean(t.date || t.toDate || t.pickupTime);
          const extra = (hasDates ? 3 : 0) + (hasNotes ? 3 : 0);
          return sum + 13 + extra;
        }, 0)
      : 0;

  const activitiesHeight =
    activeActivities.length > 0 ? 10 + activeActivities.length * 7.5 : 0;

  const calcIncExcListHeight = (items: string[]) =>
    items.reduce((sum, item) => sum + Math.max(1, Math.ceil(item.length / 50)) * 4.4 + 0.6, 0);
  const incExcBodyHeight = Math.max(
    calcIncExcListHeight(effectiveInclusions),
    calcIncExcListHeight(effectiveExclusions),
    6
  );
  const incExcHeight =
    effectiveInclusions.length > 0 || effectiveExclusions.length > 0
      ? 12 + incExcBodyHeight
      : 0;

  const getPoliciesHeight = () => {
    if (!clientNotes) return 0;
    const lines = clientNotes
      .split(/\r?\n/)
      .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.trim().length / 80)), 0);
    return 10 + lines * 4.5;
  };
  const paymentHeight = hasPaymentDetails ? 70 : 0;

  let unplacedDays = [...activeDays];
  let unplacedHotels = [...activeHotels];
  let unplacedInclusions = [...effectiveInclusions];
  let unplacedExclusions = [...effectiveExclusions];
  let nextHotelNight = 1;
  let transportsPlaced = activeTransports.length === 0;
  let activitiesPlaced = activeActivities.length === 0;
  let incExcPlaced = effectiveInclusions.length === 0 && effectiveExclusions.length === 0;
  let policiesPlaced = false;
  let paymentPlaced = !hasPaymentDetails;

  const placeHotels = (page: ContentPagePlan, list: ItineraryHotel[]) => {
    page.hotels = {
      list,
      startNight: nextHotelNight,
      totalHotels: activeHotels.length,
    };
    nextHotelNight += list.reduce(
      (sum, h) => sum + Math.max(1, Number(h.nights) || 1),
      0
    );
  };

  let dayPartIndex = 1;

  while (
    unplacedDays.length > 0 ||
    unplacedHotels.length > 0 ||
    !transportsPlaced ||
    !activitiesPlaced ||
    !incExcPlaced ||
    !policiesPlaced ||
    !paymentPlaced
  ) {
    const page: ContentPagePlan = {};
    const isFirstPage = pages.length === 0;
    let spaceLeft = isFirstPage ? PAGE_1_USABLE_HEIGHT : MAX_PAGE_HEIGHT;

    // STEP 1: PLACE HOTELS / ACCOMMODATION (Always prioritized first on Page 1)
    if (unplacedHotels.length > 0) {
      const hHeight = getHotelsHeight(unplacedHotels.length);

      if (hHeight <= spaceLeft) {
        placeHotels(page, unplacedHotels);
        spaceLeft -= hHeight;
        unplacedHotels = [];
      } else {
        // Not all hotels fit: take as many as fit cleanly on this page
        let countThatFit = 0;
        for (let i = unplacedHotels.length - 1; i >= 1; i--) {
          if (getHotelsHeight(i) <= spaceLeft) {
            countThatFit = i;
            break;
          }
        }
        if (countThatFit > 0) {
          const taken = unplacedHotels.splice(0, countThatFit);
          placeHotels(page, taken);
          spaceLeft -= getHotelsHeight(countThatFit);
          pages.push(page);
          continue;
        } else if (Object.keys(page).length > 0) {
          pages.push(page);
          continue;
        }
      }
    }

    // TIGHT BOTTOM CLEARANCE: Continue sections on same page unless less than ~10mm remains
    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 2: PLACE TRANSPORTS (Immediately following Accommodation)
    if (!transportsPlaced && activeTransports.length > 0) {
      if (transportsHeight <= spaceLeft) {
        page.transports = { list: activeTransports };
        spaceLeft -= transportsHeight;
        transportsPlaced = true;
      } else if (page.hotels) {
        pages.push(page);
        continue;
      }
    }

    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 3: PLACE ITINERARY DAYS (Immediately following Transports)
    if (unplacedDays.length > 0) {
      // If Page 1 already contains Accommodation or Transport, and a multi-day itinerary follows (unplacedDays.length > 2),
      // finish Page 1 cleanly so the Day-wise Itinerary starts together at the top of Page 2!
      if (isFirstPage && (page.hotels || page.transports) && unplacedDays.length > 2) {
        pages.push(page);
        continue;
      }

      let daysToTake = unplacedDays.length;
      let dHeight =
        6.5 +
        unplacedDays
          .slice(0, daysToTake)
          .reduce((sum, d) => sum + estimateDayHeight(d), 0);

      while (daysToTake > 1 && dHeight > spaceLeft) {
        daysToTake--;
        dHeight =
          6.5 +
          unplacedDays
            .slice(0, daysToTake)
            .reduce((sum, d) => sum + estimateDayHeight(d), 0);
      }

      if (dHeight <= spaceLeft && daysToTake >= 1) {
        const taken = unplacedDays.splice(0, daysToTake);
        const partTitle =
          unplacedDays.length > 0 || dayPartIndex > 1
            ? `DETAILED DAY-WISE TOUR ITINERARY (PART ${dayPartIndex++})`
            : "DETAILED DAY-WISE TOUR ITINERARY";

        page.days = {
          list: taken,
          partTitle,
        };
        spaceLeft -= dHeight;

        // If more itinerary days still remain for subsequent pages, finish this page cleanly.
        if (unplacedDays.length > 0) {
          pages.push(page);
          continue;
        }
      } else if (page.hotels || page.transports) {
        // Not enough room to start days on this page with hotels/transports -> push to next page
        pages.push(page);
        continue;
      }
    } else if (
      isFirstPage &&
      unplacedHotels.length === 0 &&
      transportsPlaced &&
      activitiesPlaced &&
      incExcPlaced &&
      policiesPlaced &&
      paymentPlaced
    ) {
      pages.push(page);
      continue;
    }

    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 4: PLACE ACTIVITIES / SIGHTSEEING
    if (!activitiesPlaced && activeActivities.length > 0) {
      if (activitiesHeight <= spaceLeft) {
        page.activities = { list: activeActivities };
        spaceLeft -= activitiesHeight;
        activitiesPlaced = true;
      } else if (page.days || page.hotels || page.transports) {
        pages.push(page);
        continue;
      }
    }

    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 5: PLACE INCLUSIONS / EXCLUSIONS
    if (!incExcPlaced && (unplacedInclusions.length > 0 || unplacedExclusions.length > 0)) {
      const currentIncExcHeight =
        12 +
        Math.max(
          calcIncExcListHeight(unplacedInclusions),
          calcIncExcListHeight(unplacedExclusions),
          6
        );

      if (currentIncExcHeight <= spaceLeft) {
        page.inclusionsExclusions = {
          inclusions: unplacedInclusions,
          exclusions: unplacedExclusions,
        };
        spaceLeft -= currentIncExcHeight;
        unplacedInclusions = [];
        unplacedExclusions = [];
        incExcPlaced = true;
      } else if (spaceLeft >= 36 && (unplacedInclusions.length > 2 || unplacedExclusions.length > 2)) {
        // Partial fit: Take as many items as fit on this page to prevent leaving large empty gaps!
        const maxLinesFit = Math.max(2, Math.floor((spaceLeft - 12) / 5.0));
        const incCount = Math.min(unplacedInclusions.length, maxLinesFit);
        const excCount = Math.min(unplacedExclusions.length, maxLinesFit);

        if (incCount >= 2 || excCount >= 2) {
          const takenInc = unplacedInclusions.splice(0, incCount);
          const takenExc = unplacedExclusions.splice(0, excCount);
          page.inclusionsExclusions = {
            inclusions: takenInc,
            exclusions: takenExc,
          };
          const takenHeight = 12 + Math.max(incCount, excCount) * 5.0;
          spaceLeft -= takenHeight;
          if (unplacedInclusions.length === 0 && unplacedExclusions.length === 0) {
            incExcPlaced = true;
          }
          pages.push(page);
          continue;
        } else if (page.days || page.hotels || page.transports || page.activities) {
          pages.push(page);
          continue;
        }
      } else if (page.days || page.hotels || page.transports || page.activities) {
        pages.push(page);
        continue;
      }
    } else {
      incExcPlaced = true;
    }

    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 6: PLACE POLICIES & PAYMENT (COMMERCIAL SECTION)
    if (unplacedHotels.length === 0 && unplacedDays.length === 0) {
      const polHeight = getPoliciesHeight();

      if (!policiesPlaced) {
        if (polHeight === 0) {
          policiesPlaced = true;
        } else if (polHeight <= spaceLeft) {
          page.policies = {
            clientNotes,
            showAccreditations: false,
          };
          spaceLeft -= polHeight;
          policiesPlaced = true;
        } else if (page.days || page.hotels || page.transports || page.inclusionsExclusions) {
          pages.push(page);
          continue;
        }
      }

      if (policiesPlaced && !paymentPlaced && hasPaymentDetails) {
        if (paymentHeight <= spaceLeft) {
          page.payment = {
            showMilestones: spaceLeft >= paymentHeight + 15,
          };
          spaceLeft -= paymentHeight;
          paymentPlaced = true;
        } else if (page.days || page.hotels || page.transports || page.inclusionsExclusions || page.policies) {
          pages.push(page);
          continue;
        }
      }
    }

    // Safeguard: Ensure at least one section is consumed per page to avoid infinite loop
    if (Object.keys(page).length === 0) {
      if (unplacedHotels.length > 0) {
        placeHotels(page, unplacedHotels);
        unplacedHotels = [];
      } else if (!transportsPlaced && activeTransports.length > 0) {
        page.transports = { list: activeTransports };
        transportsPlaced = true;
      } else if (unplacedDays.length > 0) {
        page.days = {
          list: unplacedDays,
          partTitle:
            dayPartIndex > 1
              ? `DETAILED DAY-WISE TOUR ITINERARY (PART ${dayPartIndex++})`
              : "DETAILED DAY-WISE TOUR ITINERARY",
        };
        unplacedDays = [];
      } else if (!activitiesPlaced && activeActivities.length > 0) {
        page.activities = { list: activeActivities };
        activitiesPlaced = true;
      } else if (!incExcPlaced && (unplacedInclusions.length > 0 || unplacedExclusions.length > 0)) {
        page.inclusionsExclusions = {
          inclusions: unplacedInclusions,
          exclusions: unplacedExclusions,
        };
        unplacedInclusions = [];
        unplacedExclusions = [];
        incExcPlaced = true;
      } else if (!policiesPlaced) {
        page.policies = { clientNotes, showAccreditations: false };
        policiesPlaced = true;
      } else if (!paymentPlaced) {
        page.payment = { showMilestones: true };
        paymentPlaced = true;
      }
    }

    pages.push(page);
    if (pages.length > 10) break;
  }

  // Ensure at least 1 content page
  if (pages.length === 0) {
    pages.push({
      policies: { clientNotes, showAccreditations: false },
    });
  }

  return pages;
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
    includeCoverPage = false,
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
  const numInfants = parseInt(data.infants || "0") || 0;
  const guestCount = `${numAdults} Adult${numAdults > 1 ? "s" : ""}${
    numChildren > 0 ? ` · ${numChildren} Child${numChildren > 1 ? "ren" : ""}` : ""
  }${numInfants > 0 ? ` · ${numInfants} Infant${numInfants > 1 ? "s" : ""}` : ""}`;

  const displayRooms = data.rooms
    ? /^\d+$/.test(data.rooms.trim())
      ? `${data.rooms.trim()} Room${data.rooms.trim() === "1" ? "" : "s"}`
      : data.rooms.trim()
    : "";

  const displayMealPlan = data.mealPlan || activeHotels[0]?.mealPlan || "";

  const numFinalPrice = parseFloat(finalRate || "0");
  const formattedPrice = numFinalPrice > 0 ? numFinalPrice.toLocaleString("en-IN") : "0";

  const hasPaymentDetails = Boolean(
    company.accountNumber || company.upiId || company.accountHolder || company.ifsc || company.qrCode
  );

  // ONLY show guest picture page if user actually provided guest photos
  const hasActualGuestPhotos = Boolean(guestPhotos && guestPhotos.length > 0);

  // Dynamic intelligent content pages (auto-merges sections when they fit without whitespace voids)
  const contentPages = useMemo(
    () =>
      planContentPages({
        activeDays,
        activeHotels,
        activeTransports,
        activeActivities,
        effectiveInclusions,
        effectiveExclusions,
        hasPaymentDetails,
        clientNotes,
      }),
    [
      activeDays,
      activeHotels,
      activeTransports,
      activeActivities,
      effectiveInclusions,
      effectiveExclusions,
      hasPaymentDetails,
      clientNotes,
    ]
  );

  // Total pages: Page 1 (Summary + Days 1-3) + Subsequent Content Pages + Guest Photos (if any)
  const firstPagePlan = contentPages[0] || {};
  const totalPages = Math.max(1, contentPages.length) + (hasActualGuestPhotos ? 1 : 0);

  const cleanCompanyName = (company.name || "HOLIDAYS BINDAS").replace(/^\.+/, "").trim();

  // Dynamic customer display name (properly capitalized, e.g. "deepak" -> "Deepak", "aarif" -> "Aarif")
  const rawClientName = (clientName || "Valued Traveler").trim();
  const customerDisplayName = rawClientName
    ? rawClientName
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Valued Traveler";

  const routeStops = useMemo(() => {
    if (data.routePlan) {
      if (Array.isArray(data.routePlan)) return data.routePlan.filter(Boolean);
      if (typeof data.routePlan === "string" && data.routePlan.trim()) {
        return data.routePlan.split(/→|->|-->/).map((s) => s.trim()).filter(Boolean);
      }
    }
    return extractRouteFromItinerary(activeDays, activeTransports, destination || tripTitle);
  }, [data.routePlan, activeDays, activeTransports, destination, tripTitle]);

  const activeTheme = resolvePdfTheme(data.colorTheme || data.selectedTheme || data.theme);

  return (
    <PdfThemeContext.Provider value={activeTheme}>
      <div className="font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white bg-slate-100 flex flex-col items-center">
        {/* ========================================================================= */}
        {/* PAGE 1: EXECUTIVE SUMMARY + ITINERARY (MATCHING USER SCREENSHOT)          */}
        {/* ========================================================================= */}
        <div data-pdf-page className={PAGE}>
          <div className="p-5 pb-[20mm] space-y-2.5">
            {/* --- 1. COMPANY DETAIL & EXECUTIVE SUMMARY CARD --- */}
            <div className="rounded-2xl border border-slate-300/90 bg-white p-4 shadow-xs space-y-2.5">
              {/* Top Row: Company Info + Quotation Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex items-start justify-center shrink-0 pt-0.5">
                    <CompanyLogo
                      logo={company.logo}
                      name={cleanCompanyName}
                      className="h-16 w-auto max-w-[150px] max-h-[66px] object-contain shrink-0 mb-0"
                    />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-[13px] font-black uppercase text-[#0f2942] leading-tight">
                      {cleanCompanyName}
                    </h3>
                    {company.website && (
                      <p className="text-[10.5px] text-slate-600 font-medium leading-tight break-words">
                        {company.website}
                      </p>
                    )}
                    <p className="text-[10.5px] text-slate-500 leading-tight break-words">
                      {company.address || "Jammu & Kashmir, India"}
                    </p>
                    {company.phone && (
                      <p className="text-[10.5px] text-slate-700 font-medium leading-tight break-words">
                        {company.phone}
                      </p>
                    )}
                    {company.email && (
                      <p className="text-[10.5px] text-slate-700 font-medium leading-tight break-all">
                        {company.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-0.5 text-slate-700 border-l border-slate-200 pl-4 shrink-0 min-w-[130px]">
                  <p className="text-[11px] uppercase font-bold text-slate-800 leading-tight tracking-wider">
                    QUOTATION
                  </p>
                  <p className="text-[10.5px] text-slate-700 leading-tight break-words">
                    No: <span className="font-semibold">{quotationRef}</span>
                  </p>
                  <p className="text-[10.5px] text-slate-700 leading-tight">
                    Date: <span className="font-semibold">{quotationDate}</span>
                  </p>
                  <p className="text-[10.5px] text-slate-700 leading-tight">
                    Valid: <span className="font-semibold">{validUntilDate}</span>
                  </p>
                </div>
              </div>

              {/* Bottom 2-Column: Price Card + Package Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                {/* Left: EXECUTIVE TRIP SUMMARY & INVESTMENT */}
                <div className="flex flex-col min-w-0">
                  <div className="mb-1">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-white text-[8.5px] font-bold uppercase leading-none"
                      style={{ backgroundColor: activeTheme.dark }}
                    >
                      EXECUTIVE TRIP SUMMARY &amp; INVESTMENT
                    </span>
                  </div>

                  <div
                    className="border rounded-xl p-3 flex flex-col justify-between flex-1 min-h-[96px] min-w-0"
                    style={{ backgroundColor: activeTheme.lightBg, borderColor: activeTheme.cardBorder }}
                  >
                    <div className="space-y-1">
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider leading-none"
                        style={{ backgroundColor: activeTheme.lightBadgeBg, color: activeTheme.badgeText }}
                      >
                        {duration ? `${duration} Package` : "Tour Package"}
                      </span>
                      <h4
                        className="font-black text-[14px] uppercase leading-tight tracking-tight break-words"
                        style={{ color: activeTheme.dark }}
                      >
                        {tripTitle || (destination ? `${destination} Tour Package` : "Confirmed Package")}
                      </h4>
                      {routeStops && routeStops.length > 0 && (
                        <p className="text-[9px] text-slate-600 leading-tight pt-1">
                          <span
                            className="font-bold uppercase text-[8.5px] tracking-wider mr-1"
                            style={{ color: activeTheme.dark }}
                          >
                            Route:
                          </span>
                          <span className="font-semibold text-slate-700 break-words">
                            {routeStops.join(" → ")}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end pt-2 border-t border-slate-200/80 mt-1.5">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Destination:</p>
                        <p className="text-[9.5px] text-slate-800 font-bold leading-tight break-words">
                          {destination || "Confirmed Destination"}
                        </p>
                      </div>
                      <p
                        className="text-[21px] font-black leading-none shrink-0 pl-2 border-l border-slate-300"
                        style={{ color: activeTheme.dark }}
                      >
                        ₹{formattedPrice}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: TRAVELER & PACKAGE SPECIFICATIONS */}
                <div className="flex flex-col min-w-0">
                  <div className="mb-1">
                    <p
                      className="text-[9.5px] font-bold uppercase leading-none py-0.5"
                      style={{ color: activeTheme.dark }}
                    >
                      TRAVELER &amp; PACKAGE SPECIFICATIONS
                    </p>
                  </div>

                  <div
                    className="border rounded-xl p-2.5 space-y-1 flex-1 min-h-[96px] min-w-0 text-[9.5px]"
                    style={{ backgroundColor: activeTheme.lightBg, borderColor: activeTheme.cardBorder }}
                  >
                    <PdfFieldRow label="Client Name:" value={customerDisplayName} />
                    <PdfFieldRow
                      label="Package:"
                      value={tripTitle || (destination ? `${destination} Tour` : "Confirmed Package")}
                      strong
                      size="large"
                      strongColor={activeTheme.dark}
                    />
                    <PdfFieldRow label="Duration:" value={duration} />
                    <PdfFieldRow label="Traveler:" value={guestCount} />
                    {displayRooms && <PdfFieldRow label="Rooms:" value={displayRooms} />}
                    {displayMealPlan && <PdfFieldRow label="Meal Plan:" value={displayMealPlan} />}
                    <PdfFieldRow
                      label="Destination:"
                      value={destination || "Confirmed Destination"}
                      strong
                      strongColor={activeTheme.dark}
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* --- 2. CONFIRMED ACCOMMODATION & STAYS --- */}
          {firstPagePlan?.hotels && (
            <HotelsSectionContent
              hotels={firstPagePlan.hotels.list}
              startNight={firstPagePlan.hotels.startNight}
              totalHotels={firstPagePlan.hotels.totalHotels}
            />
          )}

          {/* --- 3. TRANSPORTATION & FLEET SPECIFICATIONS --- */}
          {firstPagePlan?.transports && (
            <TransportsSectionContent transports={firstPagePlan.transports.list} />
          )}

          {/* --- 4. DETAILED DAY-WISE TOUR ITINERARY --- */}
          {firstPagePlan?.days && (
            <DaysSectionContent
              days={firstPagePlan.days.list}
              totalDays={activeDays.length}
              hotelMealPlan={displayMealPlan || activeHotels[0]?.mealPlan}
              partTitle={firstPagePlan.days.partTitle}
            />
          )}

          {firstPagePlan?.activities && (
            <ActivitiesSectionContent
              activities={firstPagePlan.activities.list}
              quotationDate={quotationDate}
            />
          )}

          {firstPagePlan?.inclusionsExclusions && (
            <InclusionsExclusionsContent
              inclusions={firstPagePlan.inclusionsExclusions.inclusions}
              exclusions={firstPagePlan.inclusionsExclusions.exclusions}
            />
          )}

          {firstPagePlan?.policies && (
            <PoliciesContent
              clientNotes={firstPagePlan.policies.clientNotes}
              showAccreditations={firstPagePlan.policies.showAccreditations}
            />
          )}

          {firstPagePlan?.payment && (
            <PaymentSectionContent
              company={company}
              quotationDate={quotationDate}
              showMilestones={firstPagePlan.payment.showMilestones}
            />
          )}
        </div>

        <QuotationPageFooter
          pageNum={1}
          totalPages={totalPages}
          company={company}
        />
      </div>

      {/* ========================================================================= */}
      {/* SUBSEQUENT PAGES: DYNAMIC SMART-PACKED SECTIONS (STAYS, TRANSPORT, DAYS, PAY) */}
      {/* ========================================================================= */}
      {contentPages.slice(1).map((page, idx) => {
        const pageNum = idx + 2;
        return (
          <div key={idx} data-pdf-page className={PAGE}>
            <div className="p-5 pb-[20mm] space-y-2.5">
              {page.hotels && (
                <HotelsSectionContent
                  hotels={page.hotels.list}
                  startNight={page.hotels.startNight}
                  totalHotels={page.hotels.totalHotels}
                />
              )}

              {page.transports && (
                <TransportsSectionContent transports={page.transports.list} />
              )}

              {page.days && (
                <DaysSectionContent
                  days={page.days.list}
                  totalDays={activeDays.length}
                  hotelMealPlan={displayMealPlan || activeHotels[0]?.mealPlan}
                  partTitle={page.days.partTitle}
                />
              )}

              {page.activities && (
                <ActivitiesSectionContent
                  activities={page.activities.list}
                  quotationDate={quotationDate}
                />
              )}

              {page.inclusionsExclusions && (
                <InclusionsExclusionsContent
                  inclusions={page.inclusionsExclusions.inclusions}
                  exclusions={page.inclusionsExclusions.exclusions}
                />
              )}

              {page.policies && (
                <PoliciesContent
                  clientNotes={page.policies.clientNotes}
                  showAccreditations={page.policies.showAccreditations}
                />
              )}

              {page.payment && (
                <PaymentSectionContent
                  company={company}
                  quotationDate={quotationDate}
                  showMilestones={page.payment.showMilestones}
                />
              )}
            </div>

            <QuotationPageFooter
              pageNum={pageNum}
              totalPages={totalPages}
              company={company}
            />
          </div>
        );
      })}

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

          <QuotationPageFooter
            pageNum={totalPages}
            totalPages={totalPages}
            company={company}
          />
        </div>
      )}
      </div>
    </PdfThemeContext.Provider>
  );
}

// =========================================================================
// SECTION CONTENT COMPONENTS (SMART PACKABLE)
// =========================================================================

function DaysSectionContent({
  days,
  totalDays,
  hotelMealPlan,
  partTitle,
}: {
  days: DetailedItineraryDay[];
  totalDays: number;
  hotelMealPlan?: string;
  partTitle?: string;
}) {
  const theme = usePdfTheme();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-1">
        <div className="w-4 h-4 shrink-0" style={{ color: theme.primary }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h3
          className="text-[13px] leading-5 font-bold uppercase tracking-wider"
          style={{ color: theme.primary }}
        >
          {partTitle || "DETAILED DAY-WISE TOUR ITINERARY"}
        </h3>
      </div>

      <div className="space-y-2">
        {days.map((day, idx) => (
          <DayTimelineItem
            key={day.day}
            day={day}
            totalDays={totalDays}
            hotelMealPlan={hotelMealPlan}
            isLast={idx === days.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function HotelsSectionContent({
  hotels,
  startNight = 1,
  totalHotels,
}: {
  hotels: ItineraryHotel[];
  startNight?: number;
  totalHotels?: number;
}) {
  if (!hotels || hotels.length === 0) return null;

  const theme = usePdfTheme();
  const displayTotalHotels = totalHotels ?? hotels.length;
  let currentNight = startNight;

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 shrink-0" style={{ color: theme.primary }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
              <path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
              <path d="M3 18h18" />
            </svg>
          </div>
          <h3
            className="text-[13px] leading-5 font-bold uppercase tracking-wider"
            style={{ color: theme.primary }}
          >
            CONFIRMED ACCOMMODATION &amp; STAYS
          </h3>
        </div>
        <span className="text-[10.5px] text-slate-400 font-medium">
          {displayTotalHotels} Hotel{displayTotalHotels > 1 ? "s" : ""} Selected
        </span>
      </div>

      <div className="space-y-1.5">
        {hotels.map((hotel, hIdx) => {
          const hotelNights = Math.max(1, Number(hotel.nights) || 1);
          const nightLabels = Array.from({ length: hotelNights }, (_, nIdx) => {
            const nightNum = currentNight + nIdx;
            return `${nightNum}${getOrdinalSuffix(nightNum)}`;
          });
          currentNight += hotelNights;
          const hotelPhoto =
            hotel.imageUrl ||
            (hotel.amenities?.startsWith("http") ? hotel.amenities : null);

          return (
            <div
              key={hIdx}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {nightLabels.map((nl) => (
                    <span
                      key={nl}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-bold border"
                      style={{
                        backgroundColor: theme.lightBadgeBg,
                        color: theme.badgeText,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      {nl} Night
                    </span>
                  ))}
                  <span className="font-bold text-slate-900 text-[12px] ml-1">
                    Stay at {hotel.location || "Confirmed Destination"}
                  </span>
                </div>

                {(hotel.checkIn || hotel.checkOut) && (
                  <p className="text-[9.5px] text-slate-500 font-medium">
                    In: {formatPdfDateTime(hotel.checkIn, "14:00")} · Out:{" "}
                    {formatPdfDateTime(hotel.checkOut, "11:00")}
                  </p>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                      {hotel.hotelName}
                    </h4>
                    {hotel.starRating && (
                      <p className="text-[10px] text-amber-500 font-bold tracking-widest mt-0.5">
                        {renderStarRating(hotel.starRating)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div>
                      <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">
                        ROOM DETAILS
                      </p>
                      <p className="font-semibold text-slate-900 text-[10.5px]">
                        {hotel.rooms || 1} {hotel.roomCategory || "Deluxe Room"}
                      </p>
                      <p className="text-[9.5px] text-slate-500">
                        {hotel.rooms || 1} Room(s) · {hotel.nights || 1} Night(s)
                      </p>
                    </div>

                    <div>
                      <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">
                        MEAL PLAN
                      </p>
                      <p
                        className="font-bold uppercase text-[10.5px]"
                        style={{ color: theme.badgeText }}
                      >
                        {hotel.mealPlan || "CP (Breakfast Included)"}
                      </p>
                    </div>
                  </div>

                  {hotel.amenities && !hotel.amenities.startsWith("http") && (
                    <p className="text-[9.5px] text-slate-500 pt-0.5 border-t border-slate-100">
                      <span className="font-semibold text-slate-600">Inclusions: </span>
                      {hotel.amenities}
                    </p>
                  )}
                </div>

                {hotelPhoto && (
                  <div className="w-[44mm] h-[26mm] shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
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
  );
}

function TransportsSectionContent({
  transports,
}: {
  transports: ItineraryTransport[];
}) {
  if (!transports || transports.length === 0) return null;

  const theme = usePdfTheme();

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 shrink-0" style={{ color: theme.primary }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <h3
            className="text-[13px] leading-5 font-bold uppercase tracking-wider"
            style={{ color: theme.primary }}
          >
            TRANSPORTATION &amp; FLEET SPECIFICATIONS
          </h3>
        </div>
        <span className="text-[10.5px] text-slate-400 font-medium">Dedicated Vehicle</span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
        <div
          className="text-white font-semibold flex px-3 py-1.5 text-[10.5px]"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="w-8">#</div>
          <div className="w-32">Vehicle Category</div>
          <div className="flex-1">Vehicle Details &amp; Inclusions</div>
          <div className="w-28">Route / Scope</div>
          <div className="w-16 text-right">Units</div>
        </div>
        {transports.map((t, idx) => {
          const fromDateLabel = formatPdfDate(t.date);
          const toDateLabel = formatPdfDate(t.toDate);
          const hasDateRange = Boolean(fromDateLabel || toDateLabel || t.pickupTime);
          const hasInclusions = Boolean(t.inclusions && t.inclusions.length > 0);

          return (
            <div
              key={idx}
              className="flex px-3 py-1.5 border-b border-slate-150 last:border-0 bg-white items-start text-[11.5px]"
            >
              <div className="w-8 text-slate-400 font-medium">{idx + 1}</div>
              <div className="w-32 font-bold capitalize text-slate-900 pr-2">
                {t.vehicleType || "Private AC Vehicle"}
              </div>
              <div className="flex-1 text-slate-700 leading-tight space-y-0.5 pr-2">
                {hasDateRange && (
                  <div className="text-[10.5px] font-medium text-slate-500">
                    {fromDateLabel && `From: ${fromDateLabel}`}
                    {toDateLabel && `${fromDateLabel ? " → " : "To: "}${toDateLabel}`}
                    {t.pickupTime && `${fromDateLabel || toDateLabel ? " · " : ""}Pickup: ${t.pickupTime}`}
                  </div>
                )}
                {hasInclusions && (
                  <div className="text-[11px] font-medium text-emerald-700">
                    Included: {t.inclusions!.join(" • ")}
                  </div>
                )}
                {(t.notes || (!hasInclusions && !hasDateRange)) && (
                  <div className="whitespace-pre-line">
                    {t.notes || "Dedicated AC cab with chauffeur, fuel, toll taxes & parking"}
                  </div>
                )}
              </div>
              <div className="w-28 text-slate-600 font-medium">{t.route || "All Transfers"}</div>
              <div className="w-16 text-right font-bold text-slate-800">
                {t.vehiclesCount ? `${t.vehiclesCount} Unit(s)` : "1"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivitiesSectionContent({
  activities,
  quotationDate,
}: {
  activities: ItinerarySightseeing[];
  quotationDate?: string;
}) {
  if (!activities || activities.length === 0) return null;

  const theme = usePdfTheme();

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3
          className="text-[13px] leading-5 font-bold uppercase tracking-wider"
          style={{ color: theme.primary }}
        >
          ACTIVITIES, EXCURSIONS &amp; EXPERIENCES
        </h3>
        <span className="text-[10.5px] text-slate-400 font-medium">Confirmed Sightseeing</span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
        <div
          className="text-white font-semibold flex px-3 py-1.5 text-[10.5px]"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="w-8">#</div>
          <div className="flex-1">Activity / Attraction</div>
          <div className="w-36">Location</div>
          <div className="w-24">Date</div>
          <div className="w-16 text-right">Pax</div>
        </div>
        {activities.map((act, idx) => (
          <div
            key={idx}
            className="flex px-3 py-1.5 border-b border-slate-150 last:border-0 bg-white items-center text-[11.5px]"
          >
            <div className="w-8 text-slate-400 font-medium">{idx + 1}</div>
            <div className="flex-1 font-bold text-slate-900 capitalize">{act.title}</div>
            <div className="w-36 text-slate-600 capitalize">{act.city || "--"}</div>
            <div className="w-24 text-slate-500">{act.date || quotationDate}</div>
            <div className="w-16 text-right font-bold text-slate-800">{act.pax || 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InclusionsExclusionsContent({
  inclusions,
  exclusions,
}: {
  inclusions: string[];
  exclusions: string[];
}) {
  const theme = usePdfTheme();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3
          className="text-[13px] leading-5 font-bold uppercase tracking-wider"
          style={{ color: theme.primary }}
        >
          INCLUSIONS &amp; EXCLUSIONS
        </h3>
        <span className="text-[10.5px] text-slate-400 font-medium">Commercial Guidelines</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Inclusions Card */}
        <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 border-b border-emerald-200/80 pb-1">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </span>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-900">
              PACKAGE INCLUSIONS
            </p>
          </div>

          <ul className="space-y-1 text-[12px] text-slate-700">
            {inclusions.length > 0 ? (
              inclusions.map((inc, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5] mt-0.5" />
                  <span className="font-medium text-slate-800">{inc}</span>
                </li>
              ))
            ) : (
              <li className="text-[11px] text-slate-400 italic">No specific inclusions added</li>
            )}
          </ul>
        </div>

        {/* Exclusions Card */}
        <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 border-b border-rose-200/80 pb-1">
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <X className="w-2.5 h-2.5 text-white stroke-[3]" />
            </span>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-rose-900">
              PACKAGE EXCLUSIONS
            </p>
          </div>

          <ul className="space-y-1 text-[12px] text-slate-700">
            {exclusions.length > 0 ? (
              exclusions.map((exc, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.5] mt-0.5" />
                  <span className="font-medium text-slate-800">{exc}</span>
                </li>
              ))
            ) : (
              <li className="text-[11px] text-slate-400 italic">No specific exclusions added</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PoliciesContent({
  clientNotes,
}: {
  clientNotes?: string;
  showAccreditations?: boolean;
}) {
  if (!clientNotes) {
    return null;
  }

  const theme = usePdfTheme();

  return (
    <div className="space-y-2">
      <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-2.5 space-y-1">
        <div>
          <p
            className="text-[11px] font-bold uppercase mb-1"
            style={{ color: theme.badgeText }}
          >
            Special Agent Notes:
          </p>
          <p
            className="text-[12px] text-slate-700 whitespace-pre-line leading-relaxed bg-white p-2.5 rounded-lg border"
            style={{ borderColor: theme.cardBorder }}
          >
            {clientNotes}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentSectionContent({
  company,
  quotationDate,
  showMilestones = true,
}: {
  company: any;
  quotationDate?: string;
  showMilestones?: boolean;
}) {
  const theme = usePdfTheme();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3
          className="text-[13px] leading-5 font-bold uppercase tracking-wider"
          style={{ color: theme.primary }}
        >
          PAYMENT DETAILS &amp; BANK TRANSFER OPTIONS
        </h3>
        <span className="text-[10.5px] text-slate-400 font-medium">Secure Payment Gateway</span>
      </div>

      {/* Bank Card + QR Code */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 text-xs text-slate-700 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              BANK TRANSFER DETAILS
            </p>

            {company.accountHolder && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[11.5px]">
                <span className="text-slate-500 font-medium">Account Name:</span>
                <strong className="text-slate-900">{company.accountHolder}</strong>
              </div>
            )}
            {company.bankName && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[11.5px]">
                <span className="text-slate-500 font-medium">Bank Name:</span>
                <strong className="text-slate-900">{company.bankName}</strong>
              </div>
            )}
            {company.accountNumber && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[11.5px]">
                <span className="text-slate-500 font-medium">Account Number:</span>
                <strong className="font-mono text-slate-900 tracking-wider">
                  {company.accountNumber}
                </strong>
              </div>
            )}
            {company.ifsc && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[11.5px]">
                <span className="text-slate-500 font-medium">IFSC Code:</span>
                <strong className="font-mono text-slate-900 tracking-wider">
                  {company.ifsc}
                </strong>
              </div>
            )}
            {company.upiId && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[11.5px]">
                <span className="text-slate-500 font-medium">UPI ID:</span>
                <strong className="font-mono font-bold" style={{ color: theme.badgeText }}>
                  {company.upiId}
                </strong>
              </div>
            )}
            {company.phone && (
              <div className="flex justify-between text-[11.5px]">
                <span className="text-slate-500 font-medium">Phone / WhatsApp:</span>
                <strong className="font-mono text-slate-900">{company.phone}</strong>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-400 font-medium text-[10px]">Supported:</span>
              <PaytmBadge />
              <GpayBadge />
              <PhonePeBadge />
              <span className="text-[9.5px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                NEFT / RTGS
              </span>
            </div>
          </div>

          {/* Instant QR Code */}
          {(company.qrCode || company.upiId) && (
            <div className="flex flex-col items-center shrink-0 pl-3 border-l border-slate-200">
              <div className="p-1.5 border border-slate-300 rounded-lg bg-white shadow-2xs">
                {company.qrCode ? (
                  <img
                    src={resolveImageUrl(company.qrCode)}
                    alt="Payment QR Code"
                    className="w-[105px] h-[105px] object-contain rounded"
                    crossOrigin={getSafeCrossOrigin(company.qrCode)}
                  />
                ) : (
                  <UpiPaymentQr size={105} upiId={company.upiId} />
                )}
              </div>
              <span className="text-[9.5px] font-bold text-teal-800 mt-1">Scan &amp; Pay via UPI</span>
              <span className="text-[8.5px] text-slate-400">Zero Convenience Fee</span>
            </div>
          )}
        </div>
      </div>

      {/* AUTHORIZED SIGN-OFF & STAMP */}
      <div className="pt-1 flex items-end justify-between text-xs text-slate-600">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold text-slate-400">QUOTATION ISSUED BY</p>
          <p className="font-bold text-slate-900 text-[13px]">
            {(company.name || "Authorized Travel Partner").replace(/^\.+/, "").trim()}
          </p>
          <p className="text-[10.5px] text-slate-500">
            {[company.email, company.phone].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="text-center space-y-0.5">
          <div className="w-36 h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 bg-white">
            Authorized Sign &amp; Seal
          </div>
          <p className="text-[9px] text-slate-400">Official Travel Specialist Signature</p>
        </div>
      </div>

      {/* GOOGLE REVIEWS & CLIENT TESTIMONIALS (PRINTED ON LAST PAGE AFTER PAYMENT) */}
      <div className="pt-2 border-t border-slate-200 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              Verified Client Reviews &amp; Testimonials
            </span>
          </div>
          <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ★★★★★ 5.0 Rating · Google Reviews
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white flex items-center justify-center p-1">
          <ReviewsBanner
            bannerSrc={company.reviewsBanner}
            className="w-full h-auto max-h-[58mm] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

function ReviewsBanner({
  bannerSrc,
  className = "w-full h-auto object-contain",
}: {
  bannerSrc?: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  const resolvedUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("agency_reviews_banner_data");
      if (cached && cached.startsWith("data:image")) return cached;
    }
    return resolveImageUrl(bannerSrc || "/google-reviews-banner.png");
  }, [bannerSrc]);

  useEffect(() => {
    if (!resolvedUrl) {
      setDataUrl("");
      return;
    }
    if (resolvedUrl.startsWith("data:") || resolvedUrl.startsWith("blob:")) {
      setDataUrl(resolvedUrl);
      return;
    }

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
              localStorage.setItem("agency_reviews_banner_data", b64);
            } catch {}
            return;
          }
        }
      } catch (e) {}
      if (active) setDataUrl(resolvedUrl);
    };
    img.onerror = () => {
      if (active) setDataUrl(resolvedUrl);
    };
    img.src = resolvedUrl;

    return () => {
      active = false;
    };
  }, [resolvedUrl]);

  const effectiveSrc = dataUrl || resolvedUrl;
  if (!effectiveSrc) return null;

  return (
    <img
      src={effectiveSrc}
      alt="Google Reviews & Client Feedback"
      className={className}
      crossOrigin={getSafeCrossOrigin(effectiveSrc)}
    />
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
  isLast,
}: {
  day: DetailedItineraryDay;
  totalDays: number;
  hotelMealPlan?: string;
  isLast?: boolean;
}) {
  const theme = usePdfTheme();
  const photo = day.images?.[0];
  const cleanTitle =
    day.title
      .replace(/^(?:day\s*\d+\s*[:\-–—]*\s*)+/i, "")
      .replace(/^[:\-–—\s]+/, "")
      .trim() || "Tour & Sightseeing";
  const points = parseDayPoints(day.description, day.activities, day.title);
  const explicitHighlights = day.highlights && day.highlights.length > 0 ? day.highlights.join(", ") : "";

  return (
    <div className="flex items-stretch gap-2.5">
      <div className="flex flex-col items-center shrink-0 w-[28px] pt-0.5">
        <div
          className="w-[28px] h-[28px] text-[13px] font-bold rounded-full text-white flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white"
          style={{ backgroundColor: theme.primary }}
        >
          {day.day}
        </div>
        {!isLast && (
          <div
            className="w-[2px] flex-1 my-1.5"
            style={{ backgroundColor: theme.lineBg }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 bg-white border border-slate-200/90 shadow-2xs p-2.5 space-y-1.5 rounded-xl">
        <div className="border-b border-slate-100 pb-1">
          <h4 className="text-[13.5px] leading-snug font-bold text-slate-900 break-words">
            Day {day.day}: {cleanTitle}
          </h4>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <ul className="space-y-0.5">
              {points.map((point, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2">
                  <span
                    className="mt-[6.5px] w-[5.5px] h-[5.5px] rounded-full shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span className="text-[12px] leading-[19.5px] text-slate-800 break-words">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            {explicitHighlights && (
              <div className="flex items-start gap-1.5 text-[11.5px] leading-snug pt-1 border-t border-slate-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">
                  <strong className="text-slate-800 font-bold">Highlights: </strong>
                  <span>{explicitHighlights}</span>
                </p>
              </div>
            )}
          </div>

          {photo && (
            <div className="w-[46mm] h-[28mm] shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-slate-50">
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

function formatSocialHandle(val?: string) {
  if (!val) return "";
  const trimmed = val.trim();
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+|\/+$/g, "");
      if (path && path !== "profile.php") {
        return path;
      }
      return url.hostname.replace(/^www\./, "");
    }
  } catch {}
  return trimmed.replace(/^(https?:\/\/)?(www\.)?(instagram|facebook)\.com\/?/i, "").replace(/\/+$/, "");
}

function getSocialUrl(val?: string, network?: "instagram" | "facebook") {
  if (!val) return "#";
  const trimmed = val.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const clean = trimmed.replace(/^(https?:\/\/)?(www\.)?(instagram|facebook)\.com\/?/i, "").replace(/^@/, "").replace(/\/+$/, "");
  return network === "instagram" ? `https://instagram.com/${clean}` : `https://facebook.com/${clean}`;
}

function QuotationPageFooter({
  pageNum,
  totalPages,
  company,
}: {
  pageNum: number;
  totalPages: number;
  company: {
    name?: string;
    website?: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
  };
}) {
  const theme = usePdfTheme();
  const cleanName = (company?.name || "HOLIDAYS BINDAS").replace(/^\.+/, "").trim();
  const cleanWebsite = (company?.website || "").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const webUrl = company?.website
    ? company.website.startsWith("http")
      ? company.website
      : `https://${cleanWebsite}`
    : "";
  const phoneText = company?.phone
    ? company.phone.trim().toLowerCase().startsWith("ph")
      ? company.phone.trim()
      : `Ph: ${company.phone.trim()}`
    : "";
  const displayInsta = formatSocialHandle(company?.instagram);
  const displayFb = formatSocialHandle(company?.facebook);

  return (
    <>
      <div className="absolute bottom-9 left-0 right-0 text-center text-[9px] text-slate-400 font-normal select-none pointer-events-none">
        This quotation is valid until the date mentioned above. Prices and availability are subject to re-confirmation.
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-7 text-white flex items-center justify-between px-6 text-[9.5px] font-medium tracking-tight"
        style={{ backgroundColor: theme.footerBg }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {cleanName && <span className="font-bold tracking-wide uppercase shrink-0">{cleanName}</span>}
          {cleanWebsite && (
            <>
              <span className="text-white/40 select-none">|</span>
              <a
                href={webUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-white hover:underline cursor-pointer"
                title={webUrl}
              >
                {cleanWebsite}
              </a>
            </>
          )}
          {phoneText && (
            <>
              <span className="text-white/40 select-none">|</span>
              <span className="shrink-0">{phoneText}</span>
            </>
          )}
          {company?.instagram && (
            <>
              <span className="text-white/40 select-none">|</span>
              <a
                href={getSocialUrl(company.instagram, "instagram")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 shrink-0 text-white hover:underline cursor-pointer"
                title={`Instagram: ${company.instagram}`}
              >
                <InstagramSvg className="w-3.5 h-3.5 shrink-0 text-white" />
                <span>{displayInsta}</span>
              </a>
            </>
          )}
          {company?.facebook && (
            <>
              <span className="text-white/40 select-none">|</span>
              <a
                href={getSocialUrl(company.facebook, "facebook")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 shrink-0 text-white hover:underline cursor-pointer"
                title={`Facebook: ${company.facebook}`}
              >
                <FacebookSvg className="w-3.5 h-3.5 shrink-0 text-white" />
                <span>{displayFb}</span>
              </a>
            </>
          )}
        </div>
        <div className="font-bold tracking-wider shrink-0 pl-3">
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
  const [useCors, setUseCors] = useState(true);

  const cleanName = (name || "Agency").replace(/^\.+/, "").trim();

  // Resolve logo to full URL or data URL
  const resolvedUrl = useMemo(() => {
    if (logo && logo.trim()) {
      return resolveImageUrl(logo);
    }
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("agency_company_logo_data");
      if (cached && cached.trim()) return resolveImageUrl(cached);
      try {
        const raw = localStorage.getItem("agency_company_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.company_logo && parsed.company_logo.trim()) {
            return resolveImageUrl(parsed.company_logo);
          }
        }
      } catch {}
    }
    return "";
  }, [logo]);

  useEffect(() => {
    setLoadError(false);
    setUseCors(true);
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
      if (active) {
        setDataUrl(resolvedUrl);
        setUseCors(false);
      }
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
      crossOrigin={useCors && !effectiveSrc.startsWith("data:") ? "anonymous" : undefined}
      onError={() => {
        if (useCors) {
          // If crossOrigin check failed, retry standard image load before giving up
          setUseCors(false);
          if (effectiveSrc !== resolvedUrl && resolvedUrl) {
            setDataUrl(resolvedUrl);
          }
        } else if (effectiveSrc !== resolvedUrl && resolvedUrl) {
          setDataUrl(resolvedUrl);
        } else {
          setLoadError(true);
        }
      }}
    />
  );
}

function PdfFieldRow({
  label,
  value,
  strong = false,
  size = "normal",
  strongColor,
}: {
  label: string;
  value: string;
  strong?: boolean;
  size?: "normal" | "large";
  strongColor?: string;
}) {
  return (
    <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-x-2 items-start">
      <span className="text-slate-500 font-medium text-[9.5px] leading-4">{label}</span>
      <span
        style={strongColor && (strong || size === "large") ? { color: strongColor } : undefined}
        className={`text-right break-words ${
          size === "large"
            ? `text-[11.5px] font-black leading-snug ${!strongColor ? "text-[#0f2942]" : ""}`
            : `text-[9.5px] leading-4 ${
                strong ? `font-black ${!strongColor ? "text-[#0f2942]" : ""}` : "font-semibold text-slate-800"
              }`
        }`}
      >
        {value}
      </span>
    </div>
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
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start pb-2.5 border-b border-slate-200">
      <CompanyLogo
        logo={company.logo}
        name={cleanCompanyName}
        className="h-11 w-auto object-contain max-w-[130px] shrink-0"
      />

      <div className="min-w-0 space-y-1 text-xs text-slate-500">
        {!company.logo && (
          <h2 className="text-base font-black uppercase text-[#1e3a8a] leading-5">
            {cleanCompanyName}
          </h2>
        )}
        {company.website && (
          <p className="text-[11px] text-slate-500 leading-5 break-words">{company.website}</p>
        )}
        {company.address && (
          <p className="text-[11px] text-slate-500 leading-5 break-words">{company.address}</p>
        )}
        {company.phone && (
          <p className="text-[11px] text-slate-500 leading-5 break-words">{company.phone}</p>
        )}
        {company.email && (
          <p className="text-[11px] text-slate-500 leading-5 break-all">{company.email}</p>
        )}
      </div>

      <div className="text-right space-y-1 text-slate-600 shrink-0 w-[128px]">
        <p className="text-[11px] uppercase font-bold text-slate-400 leading-5">QUOTATION</p>
        <p className="font-bold text-slate-900 text-[11px] leading-5 break-words">
          Ref: <span className="font-medium text-slate-700">{quotationRef}</span>
        </p>
        <p className="font-bold text-slate-900 text-[11px] leading-5">
          Date: <span className="font-medium text-slate-700">{quotationDate}</span>
        </p>
        <p className="font-bold text-slate-900 text-[11px] leading-5">
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

function IataMemberBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1">
      <svg className="w-5 h-5 text-[#0f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L14.5 7.5L20 8.3L16 12.2L16.9 17.7L12 15.1L7.1 17.7L8 12.2L4 8.3L9.5 7.5L12 2Z" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tighter mt-1 leading-tight">
        IATA MEMBER
      </span>
    </div>
  );
}

function AnoMemberBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1">
      <svg className="w-5 h-5 text-[#0f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h3l2 2h3" />
        <path d="M11 9l2 2" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tighter mt-1 leading-tight">
        ANO MEMBER
      </span>
    </div>
  );
}

function TripAdvisorBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1">
      <svg className="w-5 h-5 text-[#0f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="7.5" cy="13" r="3.5" />
        <circle cx="16.5" cy="13" r="3.5" />
        <circle cx="7.5" cy="13" r="1.3" fill="currentColor" />
        <circle cx="16.5" cy="13" r="1.3" fill="currentColor" />
        <path d="M12 11V7.5" strokeLinecap="round" />
        <path d="M7.5 6C10 6 11 7 12 7.5C13 7 14 6 16.5 6" strokeLinecap="round" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-700 lowercase tracking-tight mt-1 leading-tight">
        tripadvisor
      </span>
    </div>
  );
}

function TaapMemberBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1">
      <svg className="w-5 h-5 text-[#0f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 19h20M2 17h20M4 17V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9M12 13h8a2 2 0 0 1 2 2v2" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tighter mt-1 leading-tight">
        TAAP MEMBER
      </span>
    </div>
  );
}

function AtoaiCarBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1">
      <svg className="w-5 h-5 text-[#0f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M7 7l2-3h6l2 3" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tighter mt-1 leading-tight">
        ATOAI MEMBER
      </span>
    </div>
  );
}

function AtoaiMountainBadge() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1">
      <svg className="w-5 h-5 text-[#0f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 15L11.5 9.5L14 13L15.5 11L18 15H8Z" />
      </svg>
      <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tighter mt-1 leading-tight">
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

function formatPdfDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatPdfDateTime(dateStr?: string, defaultTime = "14:00") {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formattedDate = formatPdfDate(dateStr);
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
