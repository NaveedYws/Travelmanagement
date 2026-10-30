import React, { useState, useEffect } from "react";
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

export function getCompanyProfile(user?: User | null) {
  let localData: any = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("agency_company_profile");
      if (raw) localData = JSON.parse(raw);
    } catch {}
  }

  return {
    name: user?.company_name || localData.company_name || "",
    logo: user?.company_logo || localData.company_logo || "",
    phone: user?.company_phone || localData.company_phone || "",
    email: user?.company_email || localData.company_email || user?.email || "",
    address: user?.company_address || localData.company_address || "",
    website: user?.company_website || localData.company_website || "",
    bankName: user?.bank_name || localData.bank_name || "",
    accountHolder: user?.bank_account_name || localData.bank_account_name || "",
    accountNumber: user?.bank_account_no || localData.bank_account_no || "",
    ifsc: user?.bank_ifsc || localData.bank_ifsc || "",
    upiId: user?.bank_upi_id || localData.bank_upi_id || "",
    instagram: localData.company_instagram || "",
    facebook: localData.company_facebook || "",
  };
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

  // Filter actual items added by user
  const activeDays = days.filter((d) => (d.title || d.description || "").trim());
  const activeHotels = hotels.filter((h) => (h.hotelName || "").trim());
  const activeTransports = transports.filter((t) => (t.vehicleType || t.route || t.notes || "").trim());
  const activeActivities = (sightseeings || []).filter((s) => (s.title || "").trim());
  const activeInclusions = (inclusions || []).filter((i) => i.trim());
  const activeExclusions = (exclusions || []).filter((e) => e.trim());

  const numAdults = parseInt(adults) || 1;
  const numChildren = parseInt(children) || 0;
  const guestCount = `${numAdults} Adult${numAdults > 1 ? "s" : ""}${
    numChildren > 0 ? ` · ${numChildren} Child${numChildren > 1 ? "ren" : ""}` : ""
  }`;

  const numFinalPrice = parseFloat(finalRate || "0");
  const formattedPrice = numFinalPrice > 0 ? numFinalPrice.toLocaleString("en-IN") : "0";

  // Days pagination: Day 1 is on Page 2 with Quotation summary.
  // Remaining days are grouped 2 per page.
  const remainingDays = activeDays.slice(1);
  const dayPairs: DetailedItineraryDay[][] = [];
  for (let i = 0; i < remainingDays.length; i += 2) {
    dayPairs.push(remainingDays.slice(i, i + 2));
  }

  // Determine which extra sections have data
  const hasAccommodationOrServices =
    activeHotels.length > 0 || activeTransports.length > 0 || activeActivities.length > 0 || activeInclusions.length > 0;

  const hasPaymentDetails =
    Boolean(company.accountNumber || company.upiId || company.accountHolder || company.ifsc);

  const hasGuestPhotos = guestPhotos.length > 0 || (heroImage && !heroImage.includes("placeholder"));

  // Calculate dynamic total pages
  let totalPages = 1; // Page 1: Cover
  totalPages += 1; // Page 2: Summary + Day 1
  totalPages += dayPairs.length; // Remaining day pages
  if (hasAccommodationOrServices) totalPages += 1; // Page: Accommodations & Services
  if (hasPaymentDetails) totalPages += 1; // Page: Payment & Bank
  if (hasGuestPhotos) totalPages += 1; // Page: Guest Pictures

  let currentPage = 1;

  const coverBg =
    heroImage ||
    activeDays.find((d) => d.images && d.images[0]?.trim())?.images?.[0] ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600";

  return (
    <div className="font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white bg-slate-100 flex flex-col items-center">
      {/* ========================================================================= */}
      {/* PAGE 1: COVER PAGE (With Scenic Background Image & Profile Branding)       */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        {/* Scenic Travel Background Image Layer */}
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
              className="h-20 max-w-[240px] w-auto object-contain mb-3 drop-shadow-xs"
            />

            <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-[#1e3a8a] mt-1 drop-shadow-xs">
              {company.name || "EXCLUSIVE TRAVEL QUOTATION"}
            </h1>
          </div>

          {/* Quotation Info & Client Name Showcase Card */}
          <div className="my-auto py-5 relative z-10 max-w-lg mx-auto w-full">
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/90 shadow-xl text-center space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                QUOTATION
              </p>
              <p className="text-xs text-slate-600 font-medium">
                No: {quotationRef} &nbsp;|&nbsp; Date: {quotationDate} &nbsp;|&nbsp; Valid: {validUntilDate}
              </p>

              <div className="pt-6 border-t border-slate-200/70 mt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  PREPARED FOR
                </p>
                <h2 className="text-3xl font-black text-[#0f2942] tracking-tight mt-1">
                  {clientName}
                </h2>
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
      {/* PAGE 2: TOTAL PRICE, CLIENT DETAILS & DAY 1                               */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <div className="p-10 pb-20 space-y-4">
          <QuotationHeaderMini
            company={company}
            quotationRef={quotationRef}
            quotationDate={quotationDate}
            validUntilDate={validUntilDate}
          />

          {/* TOTAL QUOTATION PRICE CARD (Showing Exact Pricing) */}
          <div className="bg-[#f4f7fb] border border-slate-200/80 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
              TOTAL QUOTATION PRICE
            </h3>
            <div className="space-y-1 text-xs">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-semibold text-slate-900">
                    -Rs. {discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {gstAmount > 0 && (
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>GST ({gstRate}%)</span>
                  <span className="font-semibold text-slate-900">
                    Rs. {gstAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Amount payable</p>
                <p className="text-[10px] text-slate-400">
                  {gstAmount > 0 ? `Including GST (${gstRate}%)` : "All inclusive package price"}
                </p>
              </div>
              <p className="text-2xl font-black text-[#1e3a8a] tracking-tight leading-none">
                Rs. {formattedPrice}
              </p>
            </div>
          </div>

          {/* 2-Column: PREPARED FOR & PACKAGE DETAILS */}
          <div className="grid grid-cols-2 gap-6 pt-1 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                PREPARED FOR
              </p>
              <p className="font-bold text-slate-900 text-sm">{clientName}</p>
              {clientPhone && <p className="text-slate-600 mt-0.5">Ph: {clientPhone}</p>}
              {clientEmail && <p className="text-slate-500 text-[11px] mt-0.5">{clientEmail}</p>}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                PACKAGE DETAILS
              </p>
              <div className="space-y-0.5 text-slate-800">
                <p>
                  <strong className="text-slate-600 font-medium">Package:</strong>{" "}
                  <span className="font-bold">
                    {tripTitle || (destination ? `${destination} Tour Package` : "Confirmed Travel Package")}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-600 font-medium">Duration:</strong>{" "}
                  <span className="font-bold">{duration}</span>
                </p>
                <p>
                  <strong className="text-slate-600 font-medium">Guests:</strong>{" "}
                  <span className="font-bold">{guestCount}</span>
                </p>
              </div>
            </div>
          </div>

          {/* DAY-WISE ITINERARY (Day 1) */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] mb-3">
              DAY-WISE ITINERARY
            </h3>

            {activeDays.length > 0 ? (
              <DaySectionItem day={activeDays[0]} isFirst />
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
      {/* PAGES 3..N: REMAINING DAYS (2 DAYS PER PAGE - EXACT USER DAYS)             */}
      {/* ========================================================================= */}
      {dayPairs.map((pair, pIdx) => {
        const isLastDayPage = pIdx === dayPairs.length - 1;
        return (
          <div key={pIdx} data-pdf-page className={PAGE}>
            <div className="p-10 pb-20 space-y-6">
              {pair.map((day) => (
                <DaySectionItem key={day.day} day={day} />
              ))}

              {isLastDayPage && hasAccommodationOrServices && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                    ACCOMMODATION &amp; SERVICES
                  </h3>
                </div>
              )}
            </div>

            <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* PAGE: ACCOMMODATIONS, TRANSPORT & ACTIVITIES                              */}
      {/* ========================================================================= */}
      {hasAccommodationOrServices && (
        <div data-pdf-page className={PAGE}>
          <div className="p-10 pb-20 space-y-5">
            {/* Hotels List (Only Rendered if User Added Hotels) */}
            {activeHotels.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                  ACCOMMODATION
                </h3>
                {activeHotels.map((hotel, hIdx) => {
                  const nightLabels = [`${hIdx + 1}${getOrdinalSuffix(hIdx + 1)}`];
                  const hotelPhoto =
                    hotel.amenities?.startsWith("http") ? hotel.amenities : null;

                  return (
                    <div
                      key={hIdx}
                      className="space-y-2 pb-3 border-b border-slate-150 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {nightLabels.map((nl) => (
                          <span
                            key={nl}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold"
                          >
                            {nl}
                          </span>
                        ))}
                        <span className="font-bold text-slate-900 ml-1">
                          Nights at {hotel.location || "Confirmed City"}
                        </span>
                      </div>

                      {(hotel.checkIn || hotel.checkOut) && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Check-in: {formatPdfDateTime(hotel.checkIn, "14:00")} &nbsp;|&nbsp; Check-out:{" "}
                          {formatPdfDateTime(hotel.checkOut, "11:00")}
                        </p>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{hotel.hotelName}</h4>
                            {hotel.starRating && (
                              <p className="text-xs text-amber-500 font-bold tracking-widest mt-0.5">
                                {renderStarRating(hotel.starRating)}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                ROOMS
                              </p>
                              <p className="font-semibold text-slate-900">
                                {hotel.rooms || 1} {hotel.roomCategory || "standard"}
                              </p>
                              <p className="text-[11px] text-slate-600">
                                {hotel.rooms || 1} Room(s) · {hotel.nights || 1} Night(s)
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                MEAL PLAN
                              </p>
                              <p className="font-bold text-slate-900 uppercase">
                                {hotel.mealPlan || "Room Only"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {hotelPhoto && (
                          <div className="w-44 h-28 shrink-0 overflow-hidden rounded-sm border border-slate-200">
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
            )}

            {/* TRANSPORT Table (Only Rendered if User Added Transport) */}
            {activeTransports.length > 0 && (
              <div className="space-y-2 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                  TRANSPORT
                </h3>
                <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
                  <div className="bg-[#1e3a8a] text-white font-semibold flex px-3 py-1.5 text-[11px]">
                    <div className="w-8">#</div>
                    <div className="w-32">Vehicle Type</div>
                    <div className="flex-1">Vehicle Info / Notes</div>
                    <div className="w-32">Route &amp; Dates</div>
                    <div className="w-20 text-right">Qty</div>
                  </div>
                  {activeTransports.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex px-3 py-2 border-b border-slate-150 last:border-0 bg-white items-center"
                    >
                      <div className="w-8 text-slate-500 font-medium">{idx + 1}</div>
                      <div className="w-32 font-medium capitalize text-slate-800">
                        {t.vehicleType || "Private Vehicle"}
                      </div>
                      <div className="flex-1 text-slate-700 whitespace-pre-line text-[11px] leading-snug">
                        {t.notes || "Dedicated Chauffeur"}
                      </div>
                      <div className="w-32 text-slate-500 font-medium">{t.route || "--"}</div>
                      <div className="w-20 text-right font-medium text-slate-800">
                        {t.vehiclesCount ? `${t.vehiclesCount} Unit(s)` : "1"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVITIES & EXCURSIONS Table (Only Rendered if User Added Sightseeings) */}
            {activeActivities.length > 0 && (
              <div className="space-y-2 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                  ACTIVITIES &amp; EXCURSIONS
                </h3>
                <div className="border border-slate-200 rounded-sm overflow-hidden text-xs">
                  <div className="bg-[#1e3a8a] text-white font-semibold flex px-3 py-1.5 text-[11px]">
                    <div className="w-8">#</div>
                    <div className="flex-1">Activity</div>
                    <div className="w-48">Location</div>
                    <div className="w-32">Date</div>
                    <div className="w-16 text-right">Pax</div>
                  </div>
                  {activeActivities.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex px-3 py-2 border-b border-slate-150 last:border-0 bg-white items-center"
                    >
                      <div className="w-8 text-slate-500 font-medium">{idx + 1}</div>
                      <div className="flex-1 font-semibold text-slate-900 capitalize">{act.title}</div>
                      <div className="w-48 text-slate-600 capitalize">{act.city || "--"}</div>
                      <div className="w-32 text-slate-500">{act.date || quotationDate}</div>
                      <div className="w-16 text-right font-medium text-slate-800">{act.pax || 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            {(activeInclusions.length > 0 || activeExclusions.length > 0) && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {activeInclusions.length > 0 && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                      INCLUSIONS
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {activeInclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeExclusions.length > 0 && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-2">
                      EXCLUSIONS
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {activeExclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE: PAYMENT DETAILS (Showing User's Actual Bank & UPI Settings)          */}
      {/* ========================================================================= */}
      {hasPaymentDetails && (
        <div data-pdf-page className={PAGE}>
          <div className="p-10 pb-20 space-y-6">
            {/* PAYMENT DETAILS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                PAYMENT DETAILS
              </h3>

              <div className="flex items-start justify-between gap-6 bg-white pt-1">
                <div className="space-y-1.5 text-xs text-slate-700">
                  {company.accountHolder && (
                    <p>
                      <span className="text-slate-500 font-medium">Account Holder:</span>{" "}
                      <strong className="text-slate-900">{company.accountHolder}</strong>
                    </p>
                  )}
                  {company.bankName && (
                    <p>
                      <span className="text-slate-500 font-medium">Bank Name:</span>{" "}
                      <strong className="text-slate-900">{company.bankName}</strong>
                    </p>
                  )}
                  {company.accountNumber && (
                    <p>
                      <span className="text-slate-500 font-medium">Account Number:</span>{" "}
                      <strong className="font-mono text-slate-900">{company.accountNumber}</strong>
                    </p>
                  )}
                  {company.ifsc && (
                    <p>
                      <span className="text-slate-500 font-medium">IFSC Code:</span>{" "}
                      <strong className="font-mono text-slate-900">{company.ifsc}</strong>
                    </p>
                  )}
                  {company.upiId && (
                    <p>
                      <span className="text-slate-500 font-medium">UPI ID:</span>{" "}
                      <strong className="font-mono text-slate-900">{company.upiId}</strong>
                    </p>
                  )}
                  {company.phone && (
                    <p>
                      <span className="text-slate-500 font-medium">UPI Phone:</span>{" "}
                      <strong className="font-mono text-slate-900">{company.phone}</strong>
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-3">
                    <span className="text-slate-400 font-medium text-[11px]">Supports:</span>
                    <PaytmBadge />
                    <GpayBadge />
                    <PhonePeBadge />
                  </div>
                </div>

                {/* QR Code Generated with User's UPI ID */}
                {company.upiId && (
                  <div className="flex flex-col items-center shrink-0">
                    <div className="p-2 border border-slate-300 rounded-lg bg-white shadow-2xs">
                      <UpiPaymentQr size={135} upiId={company.upiId} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium mt-1">Scan &amp; Pay via UPI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Client Notes */}
            {clientNotes && (
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
                  TERMS &amp; SPECIAL NOTES
                </h4>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {clientNotes}
                </p>
              </div>
            )}
          </div>

          <QuotationPageFooter pageNum={currentPage++} totalPages={totalPages} company={company} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE: GUEST PICTURES / DESTINATION SHOWCASE                               */}
      {/* ========================================================================= */}
      {hasGuestPhotos && (
        <div data-pdf-page className={PAGE}>
          <div className="h-full flex flex-col justify-between items-center p-10 pb-20 text-center">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight pt-2">
              Our Guest pictures
            </h2>

            {/* Large Center Guest Photo */}
            <div className="my-auto max-w-[170mm] max-h-[195mm] overflow-hidden rounded-sm border border-slate-200 shadow-md">
              <img
                src={guestPhotos[0] || heroImage}
                alt="Our Guests"
                className="w-full h-full object-cover max-h-[195mm]"
                crossOrigin={getSafeCrossOrigin(guestPhotos[0] || heroImage)}
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
// HELPER COMPONENTS & LOGOS
// =========================================================================

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
      <div className="absolute bottom-8 left-0 right-0 text-center text-[9.5px] text-slate-400 font-normal">
        This quotation is valid until the date mentioned above. Prices are subject to availability.
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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [logo]);

  const cleanName = (name || "Agency").replace(/^\./, "").trim();

  // If no logo or if it failed to load, render a crisp agency monogram badge
  if (!logo || loadError) {
    const isSmall = className.includes("h-10") || className.includes("w-8") || className.includes("max-w-[120px]");
    return (
      <div
        className={`${
          isSmall
            ? "w-9 h-9 rounded-xl text-sm"
            : "w-16 h-16 rounded-2xl text-2xl mb-3 shadow-md border-2 border-white/80"
        } bg-[#1e3a8a] text-white flex items-center justify-center font-black shrink-0`}
      >
        {cleanName.charAt(0).toUpperCase() || "A"}
      </div>
    );
  }

  // Resolve URL (handles relative path, /uploads/..., etc.)
  let resolvedUrl = logo;
  if (!resolvedUrl.startsWith("data:") && !resolvedUrl.startsWith("blob:") && !resolvedUrl.startsWith("http")) {
    const rawApi = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();
    const base = rawApi.replace(/\/+$/, "");
    const clean = resolvedUrl.startsWith("/") ? resolvedUrl : `/${resolvedUrl}`;
    resolvedUrl = `${base}${clean}`;
  }

  return (
    <img
      src={resolvedUrl}
      alt={cleanName}
      className={className}
      onError={() => {
        // Fallback to monogram gracefully so no broken icon is shown
        setLoadError(true);
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
  return (
    <div className="flex items-start justify-between pb-3 border-b border-slate-200">
      <div className="flex items-start gap-3">
        <CompanyLogo
          logo={company.logo}
          name={company.name}
          className="h-10 w-auto object-contain mt-0.5 max-w-[120px]"
        />

        <div className="space-y-0.5 text-xs text-slate-500">
          <h2 className="text-base font-black tracking-wide uppercase text-[#1e3a8a] leading-none">
            {company.name || "TRAVEL QUOTATION"}
          </h2>
          {company.website && <p className="text-[11px] text-slate-500 leading-tight">{company.website}</p>}
          {company.address && <p className="text-[11px] text-slate-500 leading-tight">{company.address}</p>}
          {(company.phone || company.email) && (
            <p className="text-[11px] text-slate-500 leading-tight">
              {[company.phone, company.email].filter(Boolean).join(" | ")}
            </p>
          )}
        </div>
      </div>

      <div className="text-right text-xs space-y-0.5 text-slate-600">
        <p className="text-xs uppercase font-semibold tracking-wider text-slate-400">QUOTATION</p>
        <p className="font-bold text-slate-900">
          No: <span className="font-medium text-slate-700">{quotationRef}</span>
        </p>
        <p className="font-bold text-slate-900">
          Date: <span className="font-medium text-slate-700">{quotationDate}</span>
        </p>
        <p className="font-bold text-slate-900">
          Valid: <span className="font-medium text-slate-700">{validUntilDate}</span>
        </p>
      </div>
    </div>
  );
}

function DaySectionItem({
  day,
  isFirst,
}: {
  day: DetailedItineraryDay;
  isFirst?: boolean;
}) {
  const photo = day.images?.[0];
  const locationText = day.destination
    ? day.destination.startsWith("Location:")
      ? day.destination
      : `Location: ${day.destination}`
    : "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-0.5 rounded-full bg-[#1e3a8a] text-white font-bold text-[10px] tracking-wider uppercase">
          DAY {day.day}
        </span>
        <h4 className="text-sm font-bold text-slate-900">{day.title}</h4>
      </div>

      {locationText && <p className="text-[11px] text-slate-500 font-medium">{locationText}</p>}

      {day.description && (
        <p className="text-[11px] text-slate-700 leading-relaxed font-normal whitespace-pre-line">
          {day.description}
        </p>
      )}

      {photo && (
        <div
          className={`w-full overflow-hidden rounded-none shadow-xs mt-1.5 ${
            isFirst ? "h-[56mm]" : "h-[50mm]"
          }`}
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
  );
}

function getOrdinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// -------------------------------------------------------------
// Vector Badges (MOT, IATA, IATO, TAAI, ADTOI, ATOAI)
// -------------------------------------------------------------

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

function UpiPaymentQr({ size = 135, upiId }: { size?: number; upiId: string }) {
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
