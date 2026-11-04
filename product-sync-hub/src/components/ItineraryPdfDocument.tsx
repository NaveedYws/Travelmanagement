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
  theme: string;
  colorTheme?: string;
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
}

interface ItineraryPdfDocumentProps {
  data: ItineraryPdfData;
  user?: User | null;
}

const PAGE =
  "w-[210mm] min-w-[210mm] max-w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] box-border bg-white overflow-hidden relative shrink-0 shadow-2xl mb-8 last:mb-0 select-none print:shadow-none print:mb-0 text-slate-800 font-sans leading-normal";

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

  const rawLogo = cachedLogoData || user?.company_logo || localData.company_logo || "";
  const rawQr = cachedQrData || user?.bank_qr || localData.bank_qr || "";
  const rawReviews = cachedReviewsData || user?.reviews_banner || localData.reviews_banner || "/google-reviews-banner.png";

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
    compact: boolean;
  };
  hotels?: {
    list: ItineraryHotel[];
    compact: boolean;
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
function estimateDayHeight(day: DetailedItineraryDay, compact: boolean): number {
  const points = parseDayPoints(day.description, day.activities, day.title);
  const bulletCount = points.length;
  const contentH = Math.max(bulletCount * (compact ? 4.5 : 5.4), compact ? 28 : 34);
  return 13 + contentH + (day.highlights && day.highlights.length > 0 ? 5.5 : 0);
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
  // A4 page is 297mm. User wants only ~10% empty space at the bottom (~28mm buffer above footer).
  const MAX_PAGE_HEIGHT = 268; // mm of usable vertical space per page (leaves only ~10% bottom space)
  const TOP_CARD_HEIGHT = 56; // mm used on Page 1 by the Company Detail & Executive Summary Card + margins
  const PAGE_1_USABLE_HEIGHT = MAX_PAGE_HEIGHT - TOP_CARD_HEIGHT; // ~212mm available on Page 1 for itinerary
  const MIN_SPACE_THRESHOLD = 28; // ~10% of page height. Continue sections on same page unless less than 10% remains!
  const pages: ContentPagePlan[] = [];

  const getHotelsHeight = (count: number, compact: boolean) =>
    count > 0 ? 8 + count * (compact ? 28 : 34) : 0;

  const transportsHeight =
    activeTransports.length > 0 ? 14 + activeTransports.length * 6.5 : 0;

  const activitiesHeight =
    activeActivities.length > 0 ? 14 + activeActivities.length * 6.5 : 0;

  const incCount = Math.max(effectiveInclusions.length, effectiveExclusions.length);
  const incExcHeight =
    effectiveInclusions.length > 0 || effectiveExclusions.length > 0
      ? 16 + Math.min(incCount, 8) * 3.5
      : 0;

  const getPoliciesHeight = () => (clientNotes ? 24 : 0);
  const paymentHeight = hasPaymentDetails ? 70 : 0;

  let unplacedDays = [...activeDays];
  let unplacedHotels = [...activeHotels];
  let transportsPlaced = activeTransports.length === 0;
  let activitiesPlaced = activeActivities.length === 0;
  let incExcPlaced = effectiveInclusions.length === 0 && effectiveExclusions.length === 0;
  let policiesPlaced = false;
  let paymentPlaced = !hasPaymentDetails;

  let dayPartIndex = 1;
  const willNeedMultipleDayParts = activeDays.length > 4;

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

    // STEP 1: PLACE ITINERARY DAYS (Pack as many days as fit down to the 10% bottom margin!)
    if (unplacedDays.length > 0) {
      let daysToTake = unplacedDays.length;
      let isCompact = isFirstPage ? daysToTake >= 4 : daysToTake >= 5;
      let dHeight =
        12 +
        unplacedDays
          .slice(0, daysToTake)
          .reduce((sum, d) => sum + estimateDayHeight(d, isCompact), 0);

      while (daysToTake > 1 && dHeight > spaceLeft) {
        daysToTake--;
        isCompact = isFirstPage ? daysToTake >= 4 : daysToTake >= 5;
        dHeight =
          12 +
          unplacedDays
            .slice(0, daysToTake)
            .reduce((sum, d) => sum + estimateDayHeight(d, isCompact), 0);
      }

      const taken = unplacedDays.splice(0, daysToTake);
      const partTitle = willNeedMultipleDayParts
        ? `DETAILED DAY-WISE TOUR ITINERARY (PART ${dayPartIndex++})`
        : "DETAILED DAY-WISE TOUR ITINERARY";

      page.days = {
        list: taken,
        partTitle,
        compact: isCompact,
      };
      spaceLeft -= dHeight;

      // If more itinerary days still remain for subsequent pages, finish this page cleanly.
      if (unplacedDays.length > 0) {
        pages.push(page);
        continue;
      }
    } else if (isFirstPage && unplacedHotels.length === 0 && transportsPlaced && activitiesPlaced && incExcPlaced && policiesPlaced && paymentPlaced) {
      pages.push(page);
      continue;
    }

    // 10% REMAINING SPACE RULE: If less than ~10% space remains, move to the next page
    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 2: PLACE HOTELS (Continue on same page if space permits!)
    if (unplacedHotels.length > 0) {
      const isCompactHotel = spaceLeft < 130 || unplacedHotels.length > 2;
      const hHeight = getHotelsHeight(unplacedHotels.length, isCompactHotel);

      if (hHeight <= spaceLeft - 6) {
        page.hotels = {
          list: unplacedHotels,
          compact: isCompactHotel,
        };
        spaceLeft -= hHeight;
        unplacedHotels = [];
      } else if (page.days) {
        // If this page already has days and hotels don't all fit:
        // Try fitting as many hotels as possible, or if none fit move to next page
        let countThatFit = 0;
        for (let i = unplacedHotels.length - 1; i >= 1; i--) {
          if (getHotelsHeight(i, true) <= spaceLeft - 6) {
            countThatFit = i;
            break;
          }
        }
        if (countThatFit > 0) {
          const taken = unplacedHotels.splice(0, countThatFit);
          page.hotels = {
            list: taken,
            compact: true,
          };
          spaceLeft -= getHotelsHeight(countThatFit, true);
        } else {
          pages.push(page);
          continue;
        }
      } else {
        // Fresh page for hotels: take as many as fit
        let countThatFit = 0;
        for (let i = unplacedHotels.length; i >= 1; i--) {
          if (getHotelsHeight(i, true) <= spaceLeft - 6) {
            countThatFit = i;
            break;
          }
        }
        if (countThatFit > 0) {
          const taken = unplacedHotels.splice(0, countThatFit);
          page.hotels = {
            list: taken,
            compact: true,
          };
          spaceLeft -= getHotelsHeight(countThatFit, true);
        }
      }
    }

    // 10% REMAINING SPACE RULE: If less than ~10% space remains, move to the next page
    if (spaceLeft < MIN_SPACE_THRESHOLD) {
      pages.push(page);
      continue;
    }

    // STEP 3: PLACE TRANSPORTS & ACTIVITIES
    if (!transportsPlaced && activeTransports.length > 0) {
      if (transportsHeight <= spaceLeft - 6) {
        page.transports = { list: activeTransports };
        spaceLeft -= transportsHeight;
        transportsPlaced = true;
      }
    }

    if (!activitiesPlaced && activeActivities.length > 0) {
      if (activitiesHeight <= spaceLeft - 6) {
        page.activities = { list: activeActivities };
        spaceLeft -= activitiesHeight;
        activitiesPlaced = true;
      }
    }

    // STEP 4: PLACE INCLUSIONS / EXCLUSIONS
    if (!incExcPlaced && incExcHeight > 0) {
      if (incExcHeight <= spaceLeft - 6) {
        page.inclusionsExclusions = {
          inclusions: effectiveInclusions,
          exclusions: effectiveExclusions,
        };
        spaceLeft -= incExcHeight;
        incExcPlaced = true;
      } else if (page.days || page.hotels) {
        pages.push(page);
        continue;
      }
    } else {
      incExcPlaced = true;
    }

    // STEP 5: PLACE POLICIES & PAYMENT (COMMERCIAL SECTION)
    if (unplacedHotels.length === 0) {
      const polHeight = getPoliciesHeight();

      if (!policiesPlaced) {
        if (polHeight === 0) {
          policiesPlaced = true;
        } else if (polHeight <= spaceLeft - 6) {
          page.policies = {
            clientNotes,
            showAccreditations: false,
          };
          spaceLeft -= polHeight;
          policiesPlaced = true;
        } else if (page.days || page.hotels || page.inclusionsExclusions) {
          pages.push(page);
          continue;
        }
      }

      if (policiesPlaced && !paymentPlaced && hasPaymentDetails) {
        if (paymentHeight <= spaceLeft - 6) {
          page.payment = {
            showMilestones: spaceLeft >= paymentHeight + 8,
          };
          spaceLeft -= paymentHeight;
          paymentPlaced = true;
        } else if (page.days || page.hotels || page.policies) {
          pages.push(page);
          continue;
        }
      }
    }

    // Safeguard: Ensure at least one section is consumed per page to avoid infinite loop
    if (Object.keys(page).length === 0) {
      if (unplacedHotels.length > 0) {
        page.hotels = { list: unplacedHotels, compact: true };
        unplacedHotels = [];
      } else if (!transportsPlaced && activeTransports.length > 0) {
        page.transports = { list: activeTransports };
        transportsPlaced = true;
      } else if (!activitiesPlaced && activeActivities.length > 0) {
        page.activities = { list: activeActivities };
        activitiesPlaced = true;
      } else if (!incExcPlaced) {
        page.inclusionsExclusions = {
          inclusions: effectiveInclusions,
          exclusions: effectiveExclusions,
        };
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
  const guestCount = `${numAdults} Adult${numAdults > 1 ? "s" : ""}${
    numChildren > 0 ? ` · ${numChildren} Child${numChildren > 1 ? "ren" : ""}` : ""
  }`;

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

  return (
    <div className="font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white bg-slate-100 flex flex-col items-center">
      {/* ========================================================================= */}
      {/* PAGE 1: EXECUTIVE SUMMARY + ITINERARY (MATCHING USER SCREENSHOT)          */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <div className="p-4 sm:p-5 pb-[24mm] space-y-3">
          {/* --- 1. COMPANY DETAIL & EXECUTIVE SUMMARY CARD --- */}
          <div className="rounded-2xl border border-slate-300/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5">
            {/* Top Row: Company Info + Quotation Info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-start justify-center shrink-0 pt-0.5">
                  <CompanyLogo
                    logo={company.logo}
                    name={cleanCompanyName}
                    className="h-12 sm:h-14 w-auto max-w-[92px] object-contain shrink-0 mb-0"
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
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#0f2942] text-white text-[8.5px] font-bold uppercase leading-none">
                    EXECUTIVE TRIP SUMMARY &amp; INVESTMENT
                  </span>
                </div>

                <div className="bg-[#eff6ff] border border-blue-200/70 rounded-xl p-2.5 flex flex-col justify-between flex-1 min-h-[88px] min-w-0">
                  <p className="font-bold text-[10px] text-[#0f2942] uppercase leading-tight break-words">
                    TRIP: {duration} {destination || tripTitle}
                  </p>

                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end pt-1.5 border-t border-blue-200/60 mt-1.5">
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold text-slate-700 leading-tight">About/Details:</p>
                      <p className="text-[9px] text-slate-600 font-medium leading-tight break-words">
                        {tripTitle || (destination ? `${destination} Tour` : "Confirmed Package")}
                      </p>
                    </div>
                    <p className="text-[20px] sm:text-[22px] font-black text-[#0f2942] leading-none shrink-0 pl-2 border-l border-slate-300">
                      ₹{formattedPrice}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: TRAVELER & PACKAGE SPECIFICATIONS */}
              <div className="flex flex-col min-w-0">
                <div className="mb-1">
                  <p className="text-[9.5px] font-bold uppercase text-[#0f2942] leading-none py-0.5">
                    TRAVELER &amp; PACKAGE SPECIFICATIONS
                  </p>
                </div>

                <div className="bg-[#eff6ff] border border-blue-200/70 rounded-xl p-2.5 space-y-1 flex-1 min-h-[88px] min-w-0 text-[9.5px]">
                  <PdfFieldRow label="Client Name:" value={customerDisplayName} />
                  <PdfFieldRow
                    label="Package:"
                    value={tripTitle || (destination ? `${destination} Tour` : "Confirmed Package")}
                  />
                  <PdfFieldRow label="Duration:" value={duration} />
                  <PdfFieldRow label="Traveler:" value={guestCount} />
                  <PdfFieldRow
                    label="Destination:"
                    value={destination || "Confirmed Destination"}
                    strong
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- 2. DETAILED DAY-WISE TOUR ITINERARY (PART 1) --- */}
          {firstPagePlan?.days && (
            <DaysSectionContent
              days={firstPagePlan.days.list}
              totalDays={activeDays.length}
              hotelMealPlan={activeHotels[0]?.mealPlan}
              partTitle={firstPagePlan.days.partTitle}
              compact={firstPagePlan.days.compact}
              hasOtherSections={Boolean(
                firstPagePlan.hotels ||
                firstPagePlan.transports ||
                firstPagePlan.activities ||
                firstPagePlan.inclusionsExclusions ||
                firstPagePlan.policies ||
                firstPagePlan.payment
              )}
              isFirstPage={true}
            />
          )}

          {firstPagePlan?.hotels && (
            <HotelsSectionContent
              hotels={firstPagePlan.hotels.list}
              compact={firstPagePlan.hotels.compact}
            />
          )}

          {firstPagePlan?.transports && (
            <TransportsSectionContent transports={firstPagePlan.transports.list} />
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
      {/* SUBSEQUENT PAGES: DYNAMIC SMART-PACKED SECTIONS (DAYS, STAYS, POLICIES, PAY) */}
      {/* ========================================================================= */}
      {contentPages.slice(1).map((page, idx) => {
        const pageNum = idx + 2;
        return (
          <div key={idx} data-pdf-page className={PAGE}>
            <div className="p-5 pb-[24mm] space-y-2">
              {page.days && (
                <DaysSectionContent
                  days={page.days.list}
                  totalDays={activeDays.length}
                  hotelMealPlan={activeHotels[0]?.mealPlan}
                  partTitle={page.days.partTitle}
                  compact={page.days.compact}
                  hasOtherSections={Boolean(
                    page.hotels ||
                    page.transports ||
                    page.activities ||
                    page.inclusionsExclusions ||
                    page.policies ||
                    page.payment
                  )}
                />
              )}

              {page.hotels && (
                <HotelsSectionContent
                  hotels={page.hotels.list}
                  compact={page.hotels.compact}
                />
              )}

              {page.transports && (
                <TransportsSectionContent transports={page.transports.list} />
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
  compact = false,
  hasOtherSections = false,
  isFirstPage = false,
}: {
  days: DetailedItineraryDay[];
  totalDays: number;
  hotelMealPlan?: string;
  partTitle?: string;
  compact?: boolean;
  hasOtherSections?: boolean;
  isFirstPage?: boolean;
}) {
  const count = days.length;
  // If this page contains ONLY days and has empty room, scale up typography and spacing
  const tier: "spacious" | "normal" | "comfortable" | "compact" =
    hasOtherSections || compact || count >= 6
      ? "compact"
      : isFirstPage
      ? count <= 2
        ? "normal"
        : "comfortable"
      : count <= 3
      ? "spacious"
      : count === 4
      ? "normal"
      : "comfortable";

  const headerTitleClass =
    tier === "spacious"
      ? "text-[15.5px] leading-6 font-bold uppercase tracking-wider text-[#1e3a8a]"
      : tier === "normal"
      ? "text-[14.5px] leading-[23px] font-bold uppercase tracking-wider text-[#1e3a8a]"
      : tier === "comfortable"
      ? "text-[14px] leading-[22px] font-bold uppercase tracking-wider text-[#1e3a8a]"
      : "text-[13.5px] leading-5 font-bold uppercase tracking-wider text-[#1e3a8a]";

  const headerIconClass =
    tier === "spacious"
      ? "w-5 h-5 text-sky-600 shrink-0"
      : tier === "normal"
      ? "w-[19px] h-[19px] text-sky-600 shrink-0"
      : tier === "comfortable"
      ? "w-[18px] h-[18px] text-sky-600 shrink-0"
      : "w-4 h-4 text-sky-600 shrink-0";

  const listSpacingClass =
    tier === "spacious"
      ? "space-y-3"
      : tier === "normal"
      ? "space-y-2.5"
      : tier === "comfortable"
      ? "space-y-2"
      : "space-y-1.5";

  return (
    <div className={tier === "spacious" ? "space-y-1.5" : "space-y-1"}>
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-1">
        <div className={headerIconClass}>
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
        <h3 className={headerTitleClass}>
          {partTitle || "DETAILED DAY-WISE TOUR ITINERARY"}
        </h3>
      </div>

      <div className={listSpacingClass}>
        {days.map((day, idx) => (
          <DayTimelineItem
            key={day.day}
            day={day}
            totalDays={totalDays}
            hotelMealPlan={hotelMealPlan}
            isLast={idx === days.length - 1}
            tier={tier}
          />
        ))}
      </div>
    </div>
  );
}

function HotelsSectionContent({
  hotels,
  compact = false,
}: {
  hotels: ItineraryHotel[];
  compact?: boolean;
}) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
          CONFIRMED ACCOMMODATION &amp; STAYS
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          {hotels.length} Hotel{hotels.length > 1 ? "s" : ""} Selected
        </span>
      </div>

      <div className={compact ? "space-y-1" : "space-y-1.5"}>
        {hotels.map((hotel, hIdx) => {
          const nightLabels = [`${hIdx + 1}${getOrdinalSuffix(hIdx + 1)}`];
          const hotelPhoto =
            hotel.imageUrl ||
            (hotel.amenities?.startsWith("http") ? hotel.amenities : null);

          return (
            <div
              key={hIdx}
              className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs ${
                compact ? "p-2 space-y-0.5" : "p-2.5 space-y-1.5"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-0.5">
                <div className="flex items-center gap-1.5">
                  {nightLabels.map((nl) => (
                    <span
                      key={nl}
                      className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[9px] font-bold border border-teal-100"
                    >
                      {nl} Night
                    </span>
                  ))}
                  <span className="font-bold text-slate-900 text-[11px] ml-1">
                    Stay at {hotel.location || "Confirmed Destination"}
                  </span>
                </div>

                {(hotel.checkIn || hotel.checkOut) && (
                  <p className="text-[9px] text-slate-500 font-medium">
                    In: {formatPdfDateTime(hotel.checkIn, "14:00")} · Out:{" "}
                    {formatPdfDateTime(hotel.checkOut, "11:00")}
                  </p>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-900 leading-snug">
                      {hotel.hotelName}
                    </h4>
                    {hotel.starRating && (
                      <p className="text-[9.5px] text-amber-500 font-bold tracking-widest mt-0.5">
                        {renderStarRating(hotel.starRating)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        ROOM DETAILS
                      </p>
                      <p className="font-semibold text-slate-900 text-[9.5px]">
                        {hotel.rooms || 1} {hotel.roomCategory || "Deluxe Room"}
                      </p>
                      <p className="text-[8.5px] text-slate-500">
                        {hotel.rooms || 1} Room(s) · {hotel.nights || 1} Night(s)
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        MEAL PLAN
                      </p>
                      <p className="font-bold text-teal-800 uppercase text-[9.5px]">
                        {hotel.mealPlan || "CP (Breakfast Included)"}
                      </p>
                    </div>
                  </div>

                  {hotel.amenities && !hotel.amenities.startsWith("http") && (
                    <p className="text-[8.5px] text-slate-500 pt-0.5 border-t border-slate-100">
                      <span className="font-semibold text-slate-600">Inclusions: </span>
                      {hotel.amenities}
                    </p>
                  )}
                </div>

                {hotelPhoto && (
                  <div
                    className={`${
                      compact ? "w-[40mm] h-[24mm]" : "w-[46mm] h-[28mm]"
                    } shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-2xs`}
                  >
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

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
          TRANSPORTATION &amp; FLEET SPECIFICATIONS
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Dedicated Vehicle</span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
        <div className="bg-[#1e3a8a] text-white font-semibold flex px-3 py-1.5 text-[10px]">
          <div className="w-8">#</div>
          <div className="w-32">Vehicle Category</div>
          <div className="flex-1">Vehicle Details &amp; Inclusions</div>
          <div className="w-28">Route / Scope</div>
          <div className="w-16 text-right">Units</div>
        </div>
        {transports.map((t, idx) => (
          <div
            key={idx}
            className="flex px-3 py-1.5 border-b border-slate-150 last:border-0 bg-white items-center text-[10.5px]"
          >
            <div className="w-8 text-slate-400 font-medium">{idx + 1}</div>
            <div className="w-32 font-bold capitalize text-slate-900">
              {t.vehicleType || "Private AC Vehicle"}
            </div>
            <div className="flex-1 text-slate-700 whitespace-pre-line leading-tight">
              {t.notes || "Dedicated AC cab with chauffeur, fuel, toll taxes & parking"}
            </div>
            <div className="w-28 text-slate-600 font-medium">{t.route || "All Transfers"}</div>
            <div className="w-16 text-right font-bold text-slate-800">
              {t.vehiclesCount ? `${t.vehiclesCount} Unit(s)` : "1"}
            </div>
          </div>
        ))}
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

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
          ACTIVITIES, EXCURSIONS &amp; EXPERIENCES
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Confirmed Sightseeing</span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
        <div className="bg-[#1e3a8a] text-white font-semibold flex px-3 py-1.5 text-[10px]">
          <div className="w-8">#</div>
          <div className="flex-1">Activity / Attraction</div>
          <div className="w-36">Location</div>
          <div className="w-24">Date</div>
          <div className="w-16 text-right">Pax</div>
        </div>
        {activities.map((act, idx) => (
          <div
            key={idx}
            className="flex px-3 py-1.5 border-b border-slate-150 last:border-0 bg-white items-center text-[10.5px]"
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
          INCLUSIONS &amp; EXCLUSIONS
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Commercial Guidelines</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Inclusions Card */}
        <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 border-b border-emerald-200/80 pb-1">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-900">
              PACKAGE INCLUSIONS
            </p>
          </div>

          <ul className="space-y-1 text-[10px] text-slate-700">
            {inclusions.length > 0 ? (
              inclusions.map((inc, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[2.5] mt-0.5" />
                  <span className="font-medium text-slate-800">{inc}</span>
                </li>
              ))
            ) : (
              <li className="text-[9.5px] text-slate-400 italic">No specific inclusions added</li>
            )}
          </ul>
        </div>

        {/* Exclusions Card */}
        <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 border-b border-rose-200/80 pb-1">
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <X className="w-2.5 h-2.5 text-white stroke-[3]" />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-rose-900">
              PACKAGE EXCLUSIONS
            </p>
          </div>

          <ul className="space-y-1 text-[10px] text-slate-700">
            {exclusions.length > 0 ? (
              exclusions.map((exc, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-snug">
                  <X className="w-3 h-3 text-rose-500 shrink-0 stroke-[2.5] mt-0.5" />
                  <span className="font-medium text-slate-800">{exc}</span>
                </li>
              ))
            ) : (
              <li className="text-[9.5px] text-slate-400 italic">No specific exclusions added</li>
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

  return (
    <div className="space-y-2">
      <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-2.5 space-y-1">
        <div>
          <p className="text-[9.5px] font-bold uppercase text-teal-800 mb-0.5">Special Agent Notes:</p>
          <p className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed bg-white p-2 rounded-lg border border-teal-200">
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
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
          PAYMENT DETAILS &amp; BANK TRANSFER OPTIONS
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Secure Payment Gateway</span>
      </div>

      {/* Bank Card + QR Code */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 text-xs text-slate-700 flex-1">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              BANK TRANSFER DETAILS
            </p>

            {company.accountHolder && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[10.5px]">
                <span className="text-slate-500 font-medium">Account Name:</span>
                <strong className="text-slate-900">{company.accountHolder}</strong>
              </div>
            )}
            {company.bankName && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[10.5px]">
                <span className="text-slate-500 font-medium">Bank Name:</span>
                <strong className="text-slate-900">{company.bankName}</strong>
              </div>
            )}
            {company.accountNumber && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[10.5px]">
                <span className="text-slate-500 font-medium">Account Number:</span>
                <strong className="font-mono text-slate-900 tracking-wider">
                  {company.accountNumber}
                </strong>
              </div>
            )}
            {company.ifsc && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[10.5px]">
                <span className="text-slate-500 font-medium">IFSC Code:</span>
                <strong className="font-mono text-slate-900 tracking-wider">
                  {company.ifsc}
                </strong>
              </div>
            )}
            {company.upiId && (
              <div className="flex justify-between border-b border-slate-100 pb-1 text-[10.5px]">
                <span className="text-slate-500 font-medium">UPI ID:</span>
                <strong className="font-mono text-teal-800 font-bold">{company.upiId}</strong>
              </div>
            )}
            {company.phone && (
              <div className="flex justify-between text-[10.5px]">
                <span className="text-slate-500 font-medium">Phone / WhatsApp:</span>
                <strong className="font-mono text-slate-900">{company.phone}</strong>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-400 font-medium text-[9.5px]">Supported:</span>
              <PaytmBadge />
              <GpayBadge />
              <PhonePeBadge />
              <span className="text-[9px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
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
              <span className="text-[9px] font-bold text-teal-800 mt-1">Scan &amp; Pay via UPI</span>
              <span className="text-[8px] text-slate-400">Zero Convenience Fee</span>
            </div>
          )}
        </div>
      </div>

      {/* AUTHORIZED SIGN-OFF & STAMP */}
      <div className="pt-1 flex items-end justify-between text-xs text-slate-600">
        <div className="space-y-0.5">
          <p className="text-[9.5px] uppercase font-bold text-slate-400">QUOTATION ISSUED BY</p>
          <p className="font-bold text-slate-900 text-[13px]">
            {(company.name || "Authorized Travel Partner").replace(/^\.+/, "").trim()}
          </p>
          <p className="text-[10px] text-slate-500">
            {[company.email, company.phone].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="text-center space-y-0.5">
          <div className="w-36 h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9.5px] text-slate-400 bg-white">
            Authorized Sign &amp; Seal
          </div>
          <p className="text-[8.5px] text-slate-400">Official Travel Specialist Signature</p>
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Verified Client Reviews &amp; Testimonials
            </span>
          </div>
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
  totalDays,
  hotelMealPlan,
  isLast,
  tier = "comfortable",
}: {
  day: DetailedItineraryDay;
  totalDays: number;
  hotelMealPlan?: string;
  isLast?: boolean;
  tier?: "spacious" | "normal" | "comfortable" | "compact";
}) {
  const photo = day.images?.[0];
  const cleanTitle = day.title.replace(/^Day\s*\d+\s*[:\-]\s*/i, "").trim() || "Tour & Sightseeing";
  const points = parseDayPoints(day.description, day.activities, day.title);
  const explicitHighlights = day.highlights && day.highlights.length > 0 ? day.highlights.join(", ") : "";

  const badgeWidthCol =
    tier === "spacious"
      ? "w-[34px]"
      : tier === "normal"
      ? "w-[32px]"
      : tier === "comfortable"
      ? "w-[30px]"
      : "w-[26px]";

  const badgeCircle =
    tier === "spacious"
      ? "w-[34px] h-[34px] text-[15px] font-black"
      : tier === "normal"
      ? "w-[32px] h-[32px] text-[14.5px] font-bold"
      : tier === "comfortable"
      ? "w-[30px] h-[30px] text-[14px] font-bold"
      : "w-[26px] h-[26px] text-[13px] font-bold";

  const cardPadding =
    tier === "spacious"
      ? "p-3.5 space-y-2 rounded-xl"
      : tier === "normal"
      ? "p-3 space-y-1.5 rounded-xl"
      : tier === "comfortable"
      ? "p-2.5 space-y-1.5 rounded-xl"
      : "p-2 space-y-1 rounded-lg";

  const titleClass =
    tier === "spacious"
      ? "text-[16px] leading-6 font-black text-slate-900 break-words"
      : tier === "normal"
      ? "text-[15px] leading-[23px] font-bold text-slate-900 break-words"
      : tier === "comfortable"
      ? "text-[14.5px] leading-[22px] font-bold text-slate-900 break-words"
      : "text-[13.5px] leading-snug font-bold text-slate-900 break-words";

  const listGap =
    tier === "spacious"
      ? "space-y-1.5"
      : tier === "normal"
      ? "space-y-1"
      : tier === "comfortable"
      ? "space-y-1"
      : "space-y-0.5";

  const bulletDot =
    tier === "spacious"
      ? "mt-[8px] w-[7px] h-[7px] rounded-full bg-[#0284c7] shrink-0"
      : tier === "normal"
      ? "mt-[7.5px] w-[6.5px] h-[6.5px] rounded-full bg-[#0284c7] shrink-0"
      : tier === "comfortable"
      ? "mt-[7px] w-[6px] h-[6px] rounded-full bg-[#0284c7] shrink-0"
      : "mt-[6px] w-[5.5px] h-[5.5px] rounded-full bg-[#0284c7] shrink-0";

  const bulletText =
    tier === "spacious"
      ? "text-[13.8px] leading-[23px] text-slate-800 break-words font-medium"
      : tier === "normal"
      ? "text-[13.2px] leading-[22px] text-slate-800 break-words font-medium"
      : tier === "comfortable"
      ? "text-[12.8px] leading-[21px] text-slate-800 break-words"
      : "text-[12px] leading-[19px] text-slate-800 break-words";

  const highlightsClass =
    tier === "spacious"
      ? "text-[12.5px] leading-snug pt-1.5"
      : tier === "normal"
      ? "text-[12.2px] leading-snug pt-1"
      : tier === "comfortable"
      ? "text-[12px] leading-snug pt-1"
      : "text-[11.2px] leading-snug pt-0.5";

  const highlightsIcon =
    tier === "spacious" || tier === "normal"
      ? "w-4 h-4 text-amber-500 shrink-0 mt-0.5"
      : tier === "comfortable"
      ? "w-[15px] h-[15px] text-amber-500 shrink-0 mt-0.5"
      : "w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5";

  const photoSize =
    tier === "spacious"
      ? "w-[54mm] h-[35mm]"
      : tier === "normal"
      ? "w-[50mm] h-[32mm]"
      : tier === "comfortable"
      ? "w-[48mm] h-[30mm]"
      : "w-[44mm] h-[26mm]";

  return (
    <div className={`flex items-stretch ${tier === "spacious" ? "gap-3" : "gap-2.5"}`}>
      <div className={`flex flex-col items-center shrink-0 ${badgeWidthCol} pt-0.5`}>
        <div
          className={`${badgeCircle} rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white`}
        >
          {day.day}
        </div>
        {!isLast && <div className="w-[2px] flex-1 bg-sky-200 my-1.5" />}
      </div>

      <div className={`flex-1 min-w-0 bg-white border border-slate-200/90 shadow-2xs ${cardPadding}`}>
        <div className="border-b border-slate-100 pb-1">
          <h4 className={titleClass}>
            Day {day.day}: {cleanTitle}
          </h4>
        </div>

        <div className={`flex items-start ${tier === "spacious" ? "gap-3.5" : "gap-3"}`}>
          <div className="flex-1 min-w-0 space-y-1.5">
            <ul className={listGap}>
              {points.map((point, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2">
                  <span className={bulletDot} />
                  <span className={bulletText}>{point}</span>
                </li>
              ))}
            </ul>

            {explicitHighlights && (
              <div className={`flex items-start gap-1.5 ${highlightsClass} border-t border-slate-100`}>
                <Sparkles className={highlightsIcon} />
                <p className="text-slate-600">
                  <strong className="text-slate-800 font-bold">Highlights: </strong>
                  <span>{explicitHighlights}</span>
                </p>
              </div>
            )}
          </div>

          {photo && (
            <div
              className={`${photoSize} shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-slate-50`}
            >
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
    name?: string;
    website?: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
  };
}) {
  const cleanName = (company?.name || "HOLIDAYS BINDAS").replace(/^\.+/, "").trim();

  return (
    <>
      <div className="absolute bottom-9 left-0 right-0 text-center text-[9px] text-slate-400 font-normal select-none pointer-events-none">
        This quotation is valid until the date mentioned above. Prices and availability are subject to re-confirmation.
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#0b5c53] text-white flex items-center justify-between px-6 text-[9.5px] font-medium tracking-tight">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wide uppercase">{cleanName}</span>
          <span className="text-white/40">|</span>
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

function PdfFieldRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-x-2 items-start">
      <span className="text-slate-500 font-medium text-[9.5px] leading-4">{label}</span>
      <span
        className={`text-right text-[9.5px] leading-4 break-words ${
          strong ? "font-black text-[#0f2942]" : "font-semibold text-slate-800"
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
