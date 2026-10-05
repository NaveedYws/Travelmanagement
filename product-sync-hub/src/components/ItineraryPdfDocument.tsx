import React from "react";
import {
  Hotel,
  Car,
  Activity,
  Plane,
  CheckCircle2,
  XCircle,
  Phone,
  Globe,
  Mail,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Layers,
  Compass,
  ShieldCheck,
  Clock,
  Award,
  Star,
  Coffee,
  Check,
  ArrowRight,
  Bookmark,
  BadgeCheck,
  Luggage,
  Utensils,
  Map,
} from "lucide-react";
import {
  DetailedItineraryDay,
  ItineraryFlight,
  ItineraryHotel,
  ItineraryTransport,
  ItineraryService,
} from "@/lib/types";
import type { User } from "@/lib/types";

export interface ItineraryPdfData {
  quotationRef?: string;
  quotationDate?: string;
  clientName: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: string;
  children: string;
  theme: string;
  colorTheme?: string;
  templateStyle?: "editorial" | "executive" | "modern";
  finalRate: string;
  heroImage: string;
  days: DetailedItineraryDay[];
  flights: ItineraryFlight[];
  hotels: ItineraryHotel[];
  transports: ItineraryTransport[];
  customServices?: ItineraryService[];
  inclusions: string[];
  exclusions: string[];
  clientNotes: string;
  duration: string;
  dateRange: string;
}

interface ItineraryPdfDocumentProps {
  data: ItineraryPdfData;
  user?: User | null;
}

const PAGE = "w-[210mm] h-[297mm] bg-white overflow-hidden relative shrink-0 shadow-2xl mb-8 last:mb-0 select-none print:shadow-none print:mb-0";

export const THEME_PALETTES: Record<string, {
  name: string;
  primary: string;
  primaryBg: string;
  primaryBorder: string;
  primaryLight: string;
  gradient: string;
  ribbon: string;
  tagBg: string;
  tagText: string;
  accentColor: "teal" | "blue" | "emerald" | "amber" | "purple";
}> = {
  teal: {
    name: "Teal Modern",
    primary: "#0f766e",
    primaryBg: "bg-teal-700",
    primaryBorder: "border-teal-300",
    primaryLight: "bg-teal-50/70",
    gradient: "from-teal-700 via-teal-600 to-emerald-600",
    ribbon: "from-amber-400 via-yellow-300 to-teal-400",
    tagBg: "bg-teal-100/80",
    tagText: "text-teal-900",
    accentColor: "teal",
  },
  blue: {
    name: "Royal Azure",
    primary: "#1d4ed8",
    primaryBg: "bg-blue-700",
    primaryBorder: "border-blue-300",
    primaryLight: "bg-blue-50/70",
    gradient: "from-blue-700 via-blue-600 to-indigo-600",
    ribbon: "from-amber-400 via-yellow-300 to-blue-400",
    tagBg: "bg-blue-100/80",
    tagText: "text-blue-900",
    accentColor: "blue",
  },
  emerald: {
    name: "Emerald Pine",
    primary: "#047857",
    primaryBg: "bg-emerald-700",
    primaryBorder: "border-emerald-300",
    primaryLight: "bg-emerald-50/70",
    gradient: "from-emerald-700 via-emerald-600 to-teal-600",
    ribbon: "from-amber-400 via-yellow-300 to-emerald-400",
    tagBg: "bg-emerald-100/80",
    tagText: "text-emerald-900",
    accentColor: "emerald",
  },
  indigo: {
    name: "Deep Sapphire",
    primary: "#4338ca",
    primaryBg: "bg-indigo-700",
    primaryBorder: "border-indigo-300",
    primaryLight: "bg-indigo-50/70",
    gradient: "from-indigo-700 via-indigo-600 to-purple-600",
    ribbon: "from-amber-400 via-yellow-300 to-indigo-400",
    tagBg: "bg-indigo-100/80",
    tagText: "text-indigo-900",
    accentColor: "purple",
  },
  rose: {
    name: "Ruby Rose",
    primary: "#be123c",
    primaryBg: "bg-rose-700",
    primaryBorder: "border-rose-300",
    primaryLight: "bg-rose-50/70",
    gradient: "from-rose-700 via-rose-600 to-pink-600",
    ribbon: "from-amber-400 via-yellow-300 to-rose-400",
    tagBg: "bg-rose-100/80",
    tagText: "text-rose-900",
    accentColor: "amber",
  },
  amber: {
    name: "Sunset Gold",
    primary: "#b45309",
    primaryBg: "bg-amber-700",
    primaryBorder: "border-amber-300",
    primaryLight: "bg-amber-50/70",
    gradient: "from-amber-700 via-amber-600 to-orange-600",
    ribbon: "from-yellow-400 via-amber-300 to-orange-400",
    tagBg: "bg-amber-100/80",
    tagText: "text-amber-900",
    accentColor: "amber",
  },
  slate: {
    name: "Platinum Slate",
    primary: "#334155",
    primaryBg: "bg-slate-800",
    primaryBorder: "border-slate-300",
    primaryLight: "bg-slate-100/70",
    gradient: "from-slate-800 via-slate-700 to-slate-900",
    ribbon: "from-amber-400 via-yellow-300 to-slate-400",
    tagBg: "bg-slate-200/80",
    tagText: "text-slate-900",
    accentColor: "teal",
  },
};

export function ItineraryPdfDocument({ data, user }: ItineraryPdfDocumentProps) {
  const {
    quotationRef = "QT-PROPOSAL",
    quotationDate,
    clientName,
    tripTitle,
    destination,
    adults,
    children,
    theme,
    colorTheme = "teal",
    finalRate,
    heroImage,
    days = [],
    flights = [],
    transports = [],
    hotels = [],
    customServices = [],
    inclusions = [],
    exclusions = [],
    clientNotes,
    duration,
    dateRange,
  } = data;

  const currentTheme = THEME_PALETTES[colorTheme] || THEME_PALETTES.teal;
  const price = parseFloat(finalRate || "0").toLocaleString("en-IN");
  const guestLabel = `${adults} Adult${parseInt(adults) !== 1 ? "s" : ""}${
    parseInt(children) > 0 ? ` · ${children} Child${parseInt(children) !== 1 ? "ren" : ""}` : ""
  }`;
  const issuedDate =
    quotationDate ||
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const validHotels = hotels.filter(hotelHasData);
  const validTransports = transports.filter(transportHasData);
  const validFlights = flights.filter(flightHasData);
  const validServices = customServices.filter((s) => (s.title || "").trim());

  // High quality travel destination background
  const DEFAULT_TRAVEL_BG =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600";
  const activeTravelBg =
    heroImage && !heroImage.includes("photo-1488646953014-85cb44e25828")
      ? heroImage
      : days.find((d) => d.images && d.images[0]?.trim())?.images[0] || DEFAULT_TRAVEL_BG;

  // Running page numbers
  let pageCounter = 1;
  const coverPageNum = pageCounter++;
  const overviewPageNum = pageCounter++;
  const hotelPageNum = validHotels.length > 0 ? pageCounter++ : null;
  const transportPageNum = validTransports.length > 0 ? pageCounter++ : null;
  const flightPageNum = validFlights.length > 0 ? pageCounter++ : null;
  const servicesPageNum = validServices.length > 0 ? pageCounter++ : null;
  const dayPageStart = pageCounter;
  pageCounter += days.length;
  const summaryPageNum = pageCounter;

  return (
    <div className="font-sans text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. COVER PAGE: LUXURY EDITORIAL STYLE                                     */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        {/* Full-bleed high-res background image */}
        <img
          src={activeTravelBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin={getSafeCrossOrigin(activeTravelBg)}
        />

        {/* High-Contrast Multi-Stop Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030914] via-[#051324]/85 to-[#061426]/60" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#040c18]/40 to-[#030812]/90" />

        {/* Top Metallic Accent Ribbon */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${currentTheme.ribbon} shadow-md`} />

        <div className="relative z-10 h-full flex flex-col justify-between p-10 sm:p-12 text-white">
          {/* Top Bar: Agency Brand & Quotation Badge */}
          <div className="flex justify-between items-start">
            <BrandMark user={user} variant="light" />

            <div className="text-right space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-300/40 text-amber-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em]">Verified Quotation</span>
              </div>
              <p className="text-xs font-mono font-bold text-white/90">Ref: #{quotationRef}</p>
              <p className="text-[11px] text-white/70 font-medium">{issuedDate}</p>
            </div>
          </div>

          {/* Center Title Showcase Card with Frosted Backdrop for 100% Readability */}
          <div className="my-auto py-4">
            <div className="max-w-2xl bg-slate-950/40 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                  {destination ? `${destination.toUpperCase()} TOUR PACKAGE` : "EXCLUSIVE TRAVEL ITINERARY"}
                </span>
              </div>

              <h1 className="text-5xl font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                {tripTitle || (destination ? `${destination} Holiday Package` : "Customized Travel Quotation")}
              </h1>

              <div className="flex items-center gap-3 text-amber-300 font-bold text-base flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-300" />
                  {duration}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-300" />
                  {guestLabel}
                </span>
                <span>•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs uppercase font-extrabold tracking-wider">
                  {theme || "Custom Tour"}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-normal pt-1 border-t border-white/10">
                Detailed itinerary proposal including curated accommodations, dedicated chauffeur mobility, daily sightseeing schedule, and transparent all-inclusive package pricing.
              </p>
            </div>
          </div>

          {/* Floating Key Metrics Ribbon */}
          <div className="grid grid-cols-4 gap-0 rounded-2xl overflow-hidden border border-white/25 bg-white/10 backdrop-blur-md shadow-2xl text-white">
            <CoverStat icon={<Calendar className="w-4 h-4 text-teal-300" />} label="Duration" value={duration} />
            <CoverStat icon={<Compass className="w-4 h-4 text-amber-300" />} label="Holiday Type" value={theme || "Holiday"} border />
            <CoverStat icon={<Users className="w-4 h-4 text-blue-300" />} label="Total Guests" value={guestLabel} border />
            <CoverStat icon={<Award className="w-4 h-4 text-yellow-300" />} label="Total Investment" value={`₹${price}`} />
          </div>

          {/* Bottom VIP Traveler Card */}
          <div className="flex justify-between items-end pt-5 border-t border-white/20">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-300 mb-1 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" />
                Prepared Exclusively For
              </p>
              <p className="text-3xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                {clientName || "Valued Traveler"}
              </p>
            </div>

            <div className="text-right text-xs text-white/90 space-y-1">
              <p className="font-black text-white text-base tracking-tight">
                {user?.company_name || "Authorized Travel Specialist"}
              </p>
              {user?.company_phone && (
                <p className="flex items-center justify-end gap-1.5 text-[11px] text-teal-200 font-semibold">
                  <Phone className="w-3 h-3 text-teal-300" /> Helpline: {user.company_phone}
                </p>
              )}
              {user?.email && (
                <p className="flex items-center justify-end gap-1.5 text-[11px] text-white/80">
                  <Mail className="w-3 h-3 text-slate-300" /> {user.email}
                </p>
              )}
              {user?.company_website && (
                <p className="flex items-center justify-end gap-1.5 text-[11px] text-white/70 font-semibold">
                  <Globe className="w-3 h-3 text-slate-300" /> {user.company_website}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OVERVIEW PAGE: TRIP SNAPSHOT & VISUAL JOURNEY ROUTE                     */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <RunningHeader
          user={user}
          section="Holiday Overview"
          title="Tour Snapshot & Daily Route"
          quotationRef={quotationRef}
          theme={currentTheme}
        />

        <div className="px-10 py-6 flex-1 flex flex-col justify-between space-y-5">
          {/* Quick Snapshot 4-Card Grid */}
          <div className="grid grid-cols-4 gap-3">
            <InfoCard icon={<MapPin className="w-4 h-4" />} label="Destination" value={destination || "Scenic Holiday"} variant="blue" />
            <InfoCard icon={<Calendar className="w-4 h-4" />} label="Travel Dates" value={dateRange} variant="violet" />
            <InfoCard icon={<Users className="w-4 h-4" />} label="Total Guests" value={guestLabel} variant="emerald" />
            <InfoCard icon={<Compass className="w-4 h-4" />} label="Holiday Type" value={theme || "Holiday Package"} variant="amber" />
          </div>

          {/* Large Hero Showcase Image with Journey Badge */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 min-h-[95mm] flex-1">
            <img
              src={activeTravelBg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin={getSafeCrossOrigin(activeTravelBg)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040e1d]/95 via-slate-900/40 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 text-white flex justify-between items-end">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>Curated Tour Snapshot</span>
                </div>
                <p className="text-3xl font-black tracking-tight leading-tight">
                  {tripTitle || (destination ? `${destination} Holiday Package` : "Confirmed Travel Itinerary")}
                </p>
                <p className="text-teal-200 text-sm font-semibold mt-1">
                  {days.length} Days Itinerary · {duration}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Total Investment</p>
                <p className="text-4xl font-black text-amber-300">₹{price}</p>
              </div>
            </div>
          </div>

          {/* Visual Route Timeline Map */}
          {days.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 flex items-center gap-1.5">
                  <Map className="w-4 h-4 text-teal-600" />
                  Journey Route & Daily Sequence
                </p>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {days.length} Stops Total
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-hidden pt-1 flex-wrap">
                {days.map((d, i) => (
                  <div key={d.day} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs hover:border-teal-300 transition-colors">
                      <span className="w-5 h-5 rounded-md bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center">
                        {d.day}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                        {d.destination || d.title || `Day ${d.day}`}
                      </span>
                    </div>
                    {i < days.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 Pillars of Confidence Strip */}
          <div className="grid grid-cols-4 gap-3 pt-1">
            <PillarCard icon={<Hotel className="w-4 h-4 text-teal-600" />} title="Curated Stays" desc="Handpicked verified hotels" />
            <PillarCard icon={<Car className="w-4 h-4 text-emerald-600" />} title="Private Transfers" desc="Dedicated vehicle & chauffeur" />
            <PillarCard icon={<Compass className="w-4 h-4 text-blue-600" />} title="Sightseeing Included" desc="All planned attractions" />
            <PillarCard icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} title="On-Trip Support" desc="24/7 dedicated helpline" />
          </div>
        </div>

        <RunningFooter user={user} pageNumber={overviewPageNum} />
      </div>

      {/* ========================================================================= */}
      {/* 3. ACCOMMODATION PAGE (HOTELS)                                            */}
      {/* ========================================================================= */}
      {validHotels.length > 0 && (
        <div data-pdf-page className={PAGE}>
          <RunningHeader
            user={user}
            section="Accommodation"
            title="Curated Stays & Luxury Hotels"
            quotationRef={quotationRef}
            theme={currentTheme}
          />

          <div className="px-10 py-5 space-y-4 flex-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Confirmed Accommodations ({validHotels.length} Properties)
              </span>
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Verified Clean & Sanitized Stays
              </span>
            </div>

            {validHotels.map((hotel, i) => (
              <HotelCard key={i} hotel={hotel} index={i} theme={currentTheme} />
            ))}
          </div>

          <RunningFooter user={user} pageNumber={hotelPageNum || undefined} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TRANSFERS & MOBILITY PAGE                                              */}
      {/* ========================================================================= */}
      {validTransports.length > 0 && (
        <div data-pdf-page className={PAGE}>
          <RunningHeader
            user={user}
            section="Transfers & Mobility"
            title="Private Chauffeur & Vehicles"
            quotationRef={quotationRef}
            theme={currentTheme}
          />

          <div className="px-10 py-5 space-y-4 flex-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Dedicated Chauffeur & Sightseeing Vehicles
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                100% Private Fleet
              </span>
            </div>

            {validTransports.map((transport, i) => (
              <TransportCard key={i} transport={transport} index={i} theme={currentTheme} />
            ))}
          </div>

          <RunningFooter user={user} pageNumber={transportPageNum || undefined} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FLIGHT SCHEDULE PAGE                                                  */}
      {/* ========================================================================= */}
      {validFlights.length > 0 && (
        <div data-pdf-page className={PAGE}>
          <RunningHeader
            user={user}
            section="Flight Itinerary"
            title="Confirmed Air Travel Schedule"
            quotationRef={quotationRef}
            theme={currentTheme}
          />

          <div className="px-10 py-5 space-y-4 flex-1">
            {validFlights.map((flight, i) => (
              <FlightTicketCard key={i} flight={flight} index={i} />
            ))}
          </div>

          <RunningFooter user={user} pageNumber={flightPageNum || undefined} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CUSTOM SERVICES (BUS, TRAIN, FERRY, VISA, EXCURSIONS)                  */}
      {/* ========================================================================= */}
      {validServices.length > 0 && (
        <div data-pdf-page className={PAGE}>
          <RunningHeader
            user={user}
            section="Additional Bookings"
            title="Custom Services & Special Entities"
            quotationRef={quotationRef}
            theme={currentTheme}
          />

          <div className="px-10 py-5 space-y-4 flex-1">
            {validServices.map((service, i) => (
              <CustomServiceCard key={i} service={service} index={i} />
            ))}
          </div>

          <RunningFooter user={user} pageNumber={servicesPageNum || undefined} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DAY BY DAY ITINERARY PAGES: EDITORIAL MAGAZINE DESIGN                  */}
      {/* ========================================================================= */}
      {days.map((day, dayIndex) => {
        const hasDayHeroImage = day.images && day.images[0]?.trim();
        const extraImages = day.images && day.images.length > 1 ? day.images.slice(1, 3).filter(Boolean) : [];
        const currentPageNum = dayPageStart + dayIndex;

        return (
          <div key={day.day} data-pdf-page className={PAGE}>
            <RunningHeader
              user={user}
              section={`Daily Schedule · Day ${day.day}`}
              title={day.destination ? `${day.destination}` : `Day ${day.day}`}
              quotationRef={quotationRef}
              theme={currentTheme}
            />

            {/* Day Hero Banner */}
            {hasDayHeroImage ? (
              <div className="relative h-[80mm] w-full overflow-hidden border-b border-slate-200">
                <img
                  src={day.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  crossOrigin={getSafeCrossOrigin(day.images[0])}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#051121]/95 via-slate-900/40 to-slate-900/30" />
                <DayHeroBanner day={day.day} title={day.title} destination={day.destination} variant="image" />
              </div>
            ) : (
              <div className="relative h-[48mm] w-full bg-gradient-to-br from-slate-900 via-teal-950 to-slate-800 overflow-hidden border-b border-slate-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.25),transparent)]" />
                <DayHeroBanner day={day.day} title={day.title} destination={day.destination} variant="gradient" />
              </div>
            )}

            {/* Day Content Body with High-Contrast Typography & Structured Cards */}
            <div className="px-10 py-6 space-y-4 flex-1 relative flex flex-col justify-between">
              {/* Background Watermark Day Number */}
              <div className="absolute right-10 top-2 text-[120px] font-black text-slate-100/70 leading-none select-none pointer-events-none -z-10">
                {String(day.day).padStart(2, "0")}
              </div>

              <div className="space-y-4">
                {/* Experiences & Activities Highlight Card */}
                {day.activities?.trim() && (
                  <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/80 to-white p-4 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-teal-900">
                        Sightseeing Highlights & Key Activities
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed pl-7">
                      {day.activities}
                    </p>
                  </div>
                )}

                {/* Day Highlights Section (Chips / Grid) */}
                {day.highlights && day.highlights.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      Key Features
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {day.highlights.filter(Boolean).map((h, hIdx) => (
                        <div
                          key={hIdx}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Day Description Body: Clean, High-Contrast & Highly Readable */}
                {day.description?.trim() && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-teal-600" />
                      Detailed Day Itinerary
                    </p>
                    <div className="text-[13.5px] text-slate-800 leading-[1.65] font-normal whitespace-pre-line bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      {day.description}
                    </div>
                  </div>
                )}

                {/* Additional Photos Gallery */}
                {extraImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {extraImages.map((img, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden h-32 shadow-sm border border-slate-200">
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                          crossOrigin={getSafeCrossOrigin(img)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Services Strip Footer */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between text-xs text-slate-700 font-semibold shadow-2xs">
                <div className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-teal-600" />
                  <span>Stay: <strong className="text-slate-900">{day.destination || "Confirmed Accommodation"}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>Mobility: <strong className="text-slate-900">Private Chauffeur Included</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Meals: <strong className="text-slate-900">Breakfast Included</strong></span>
                </div>
              </div>
            </div>

            <RunningFooter user={user} pageNumber={currentPageNum} />
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* 8. SUMMARY, INVESTMENT & TERMS PAGE                                       */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <RunningHeader
          user={user}
          section="Package Summary"
          title="Investment, Inclusions & Terms"
          quotationRef={quotationRef}
          theme={currentTheme}
        />

        <div className="px-10 py-6 flex-1 flex flex-col justify-between space-y-5">
          {/* Inclusions & Exclusions Side by Side */}
          <div className="grid grid-cols-2 gap-5">
            <ListSection
              title="Package Inclusions"
              items={inclusions}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              accent="emerald"
            />
            <ListSection
              title="Package Exclusions"
              items={exclusions}
              icon={<XCircle className="w-5 h-5 text-rose-500" />}
              accent="rose"
            />
          </div>

          {/* Total Investment Showcase Card (High Impact Luxury Badge) */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Deep Midnight Blue Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#06111f] via-[#091a33] to-[#0e274a]" />
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${currentTheme.ribbon} shadow-md`} />

            <div className="relative px-8 py-7 text-center text-white space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-[0.25em]">
                <Award className="w-3.5 h-3.5" />
                <span>Transparent All-Inclusive Pricing</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-300">Total Net Investment</p>
                <p className="text-6xl font-black tracking-tight text-white mt-0.5">₹{price}</p>
              </div>

              <div className="flex items-center justify-center gap-3 text-slate-300 text-xs font-semibold">
                <span>{guestLabel}</span>
                <span>•</span>
                <span>All Hotels, Private Transport & Sightseeing Included</span>
                <span>•</span>
                <span className="text-emerald-300">GST Included</span>
              </div>
            </div>
          </div>

          {/* Client Notes & Important Remarks */}
          {clientNotes?.trim() && (
            <div className="rounded-2xl bg-amber-50/90 border-l-4 border-amber-500 p-4 space-y-1 shadow-2xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Important Remarks & Booking Policies
              </p>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">{clientNotes}</p>
            </div>
          )}

          {/* Agency Signature & Verification Seal Bar */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark user={user} variant="dark" />
              <div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {user?.company_name || "Authorized Travel Specialist"}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Verified Quotation Document · Valid for 7 days</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-700 space-y-1">
              {user?.company_phone && (
                <p className="flex items-center justify-end gap-1.5 font-bold text-slate-900">
                  <Phone className="w-3.5 h-3.5 text-teal-600" /> {user.company_phone}
                </p>
              )}
              {user?.email && (
                <p className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                </p>
              )}
              {user?.company_website && (
                <p className="flex items-center justify-end gap-1.5 text-[11px] text-teal-700 font-bold">
                  <Globe className="w-3.5 h-3.5 text-teal-600" /> {user.company_website}
                </p>
              )}
            </div>
          </div>
        </div>

        <RunningFooter user={user} pageNumber={summaryPageNum} />
      </div>
    </div>
  );
}

// =========================================================================
// HELPER COMPONENTS & CARDS
// =========================================================================

function BrandMark({ user, variant }: { user?: User | null; variant: "light" | "dark" }) {
  const isLight = variant === "light";
  return user?.company_logo ? (
    <img
      src={user.company_logo}
      alt=""
      className={`h-11 w-auto object-contain ${isLight ? "brightness-0 invert drop-shadow-md" : ""}`}
      crossOrigin={getSafeCrossOrigin(user.company_logo)}
    />
  ) : (
    <div
      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${
        isLight
          ? "bg-white/20 backdrop-blur-md border border-white/30 text-white"
          : "bg-teal-700 text-white"
      }`}
    >
      {user?.company_name?.charAt(0) || "T"}
    </div>
  );
}

function RunningHeader({
  user,
  section,
  title,
  quotationRef,
  theme,
}: {
  user?: User | null;
  section: string;
  title: string;
  quotationRef?: string;
  theme: typeof THEME_PALETTES["teal"];
}) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white shadow-2xs">
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
      <div className="px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xs">
            {user?.company_name?.charAt(0) || "T"}
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">{section}</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{title}</h2>
          </div>
        </div>
        <div className="text-right text-[10px]">
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Ref: #{quotationRef || "QT-PROPOSAL"}
          </span>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">
            {user?.company_name || "Travel Partner"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RunningFooter({ user, pageNumber }: { user?: User | null; pageNumber?: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-10 py-2.5 flex justify-between items-center text-[8px] text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100 bg-white/95">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-700">{user?.company_name || "Travel Partner"}</span>
        <span>•</span>
        <span>Confidential Travel Proposal</span>
      </div>
      <div className="flex items-center gap-3">
        {user?.company_phone && <span>Helpline: {user.company_phone}</span>}
        {user?.company_website && <span>{user.company_website}</span>}
        {pageNumber && (
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
            Page {pageNumber}
          </span>
        )}
      </div>
    </div>
  );
}

function CoverStat({
  icon,
  label,
  value,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  border?: boolean;
  theme?: any;
}) {
  return (
    <div className={`p-4 text-center ${border ? "border-x border-white/15" : ""}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/60 mb-0.5">{label}</p>
      <p className="text-xs font-extrabold text-white leading-snug truncate px-1">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: "blue" | "violet" | "emerald" | "amber";
}) {
  const styles = {
    blue: "from-blue-50 to-white border-blue-200 text-blue-700",
    violet: "from-indigo-50 to-white border-indigo-200 text-indigo-700",
    emerald: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
    amber: "from-amber-50 to-white border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-3.5 bg-gradient-to-br shadow-2xs ${styles[variant]}`}>
      <div className="mb-1.5 opacity-90">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <p className="text-xs font-black text-slate-900 leading-snug truncate">{value}</p>
    </div>
  );
}

function PillarCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-black text-slate-900">{title}</p>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
    </div>
  );
}

function HotelCard({
  hotel,
  index,
  theme,
}: {
  hotel: ItineraryHotel;
  index: number;
  theme: typeof THEME_PALETTES["teal"];
}) {
  const starNum = parseInt(hotel.starRating || "3") || 3;
  const starsString = "★".repeat(Math.min(5, Math.max(1, starNum)));

  const amenitiesList = (hotel.amenities || "")
    .split(/[,•\n]/)
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme.gradient} text-white`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black truncate">{hotel.hotelName || `Stay Option ${index + 1}`}</p>
            <p className="text-xs text-white/90 truncate flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{hotel.location || "Prime City Location"}</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-amber-300 tracking-widest text-xs font-black drop-shadow-2xs">{starsString}</div>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold text-white uppercase border border-white/30">
            {hotel.starRating || "Standard"}
          </span>
        </div>
      </div>

      {/* Info Grid with Crisp Borders */}
      <div className="p-4 grid grid-cols-4 gap-3 bg-slate-50/60 border-b border-slate-100">
        <PdfCell label="Check-in Date" value={formatPdfDate(hotel.checkIn)} />
        <PdfCell label="Check-out Date" value={formatPdfDate(hotel.checkOut)} />
        <PdfCell
          label="Stay Duration"
          value={`${hotel.rooms || 1} Room${(hotel.rooms || 1) > 1 ? "s" : ""} · ${hotel.nights || 1} Night${
            (hotel.nights || 1) > 1 ? "s" : ""
          }`}
          highlight
        />
        <PdfCell label="Room Category" value={hotel.roomCategory || "Deluxe Room"} />
      </div>

      <div className="px-4 py-3 flex items-center justify-between text-xs bg-white">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Coffee className="w-4 h-4 text-teal-600" />
          <span>Meal Plan: <strong className="text-teal-700">{hotel.mealPlan || "Room Only (EP)"}</strong></span>
        </div>

        {amenitiesList.length > 0 && (
          <div className="flex items-center gap-1.5">
            {amenitiesList.slice(0, 3).map((amenity, aIdx) => (
              <span
                key={aIdx}
                className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-800 flex items-center gap-1"
              >
                <Check className="w-2.5 h-2.5 text-teal-600" /> {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransportCard({
  transport,
  index,
  theme,
}: {
  transport: ItineraryTransport;
  index: number;
  theme: typeof THEME_PALETTES["teal"];
}) {
  const inclusions = transport.inclusions || [
    "Driver Allowance",
    "Tolls & State Taxes",
    "Fuel Charges",
    "Parking Fees",
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex">
      {/* Side Icon Column */}
      <div className={`w-16 bg-gradient-to-b ${theme.gradient} flex flex-col items-center justify-center text-white shrink-0 p-2 text-center`}>
        <Car className="w-6 h-6 mb-1 opacity-90" />
        <span className="text-[9px] font-black uppercase tracking-wider">#{index + 1}</span>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Dedicated Chauffeur Vehicle</span>
            <p className="text-base font-black text-slate-900">{transport.vehicleType || "Private Vehicle Mobility"}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800">{formatPdfDate(transport.date)}</span>
            {transport.pickupTime && (
              <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-teal-600" /> Pickup: {transport.pickupTime}
              </p>
            )}
          </div>
        </div>

        {/* Route Visual Line */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{transport.route || "Sightseeing / Transfer Route"}</span>
          </div>
          {transport.dropoff && (
            <div className="text-[11px] text-slate-600 font-medium truncate">
              Drop: {transport.dropoff}
            </div>
          )}
        </div>

        {/* Inclusions Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {inclusions.slice(0, 4).map((inc, iIdx) => (
            <span
              key={iIdx}
              className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1"
            >
              <Check className="w-2.5 h-2.5 text-emerald-600" /> {inc}
            </span>
          ))}
          {transport.notes?.trim() && (
            <span className="text-[10px] text-slate-500 italic ml-auto truncate max-w-xs font-medium">
              Note: {transport.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FlightTicketCard({ flight, index }: { flight: ItineraryFlight; index: number }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden flex">
      <div className="w-16 bg-gradient-to-b from-blue-700 to-indigo-800 flex flex-col items-center justify-center text-white shrink-0 p-2 text-center">
        <Plane className="w-6 h-6 mb-1 opacity-90" />
        <span className="text-[9px] font-black uppercase tracking-wider">Flight #{index + 1}</span>
      </div>

      <div className="flex-1 p-4 grid grid-cols-4 gap-3 items-center">
        <PdfCell label="Airline / Flight" value={flight.flightNo || flight.airline || "Scheduled Flight"} highlight />
        <PdfCell label="Travel Date" value={formatPdfDate(flight.date)} />
        <PdfCell label="Route" value={`${flight.departure || "Origin"} ➔ ${flight.arrival || "Dest"}`} highlight />
        <PdfCell label="Baggage" value={flight.baggage || "15 kg Check-in"} />
      </div>
    </div>
  );
}

function CustomServiceCard({ service, index }: { service: ItineraryService; index: number }) {
  return (
    <div className="rounded-2xl border border-purple-200 bg-white shadow-sm overflow-hidden flex">
      <div className="w-16 bg-gradient-to-b from-purple-700 to-indigo-800 flex flex-col items-center justify-center text-white shrink-0 p-2 text-center">
        <Layers className="w-6 h-6 mb-1 opacity-90" />
        <span className="text-[8px] font-black uppercase tracking-wider truncate max-w-full">
          {service.category || "Service"}
        </span>
      </div>

      <div className="flex-1 p-4 grid grid-cols-4 gap-3 items-center">
        <PdfCell label={service.category || "Service Name"} value={service.title || "—"} highlight />
        <PdfCell label="Details / Remarks" value={service.details || service.notes || "—"} className="col-span-2" />
        <PdfCell
          label="Date / Quantity"
          value={
            [service.date ? formatPdfDate(service.date) : "", service.quantity ? `Qty: ${service.quantity}` : ""]
              .filter(Boolean)
              .join(" · ") || "—"
          }
        />
      </div>
    </div>
  );
}

function DayHeroBanner({
  day,
  title,
  destination,
  variant,
}: {
  day: number;
  title: string;
  destination?: string;
  variant: "image" | "gradient";
}) {
  const isImage = variant === "image";
  return (
    <div className="absolute bottom-5 left-10 right-10 flex items-end justify-between">
      <div className="flex items-end gap-3.5">
        {/* Floating Day Badge */}
        <div
          className={`w-[66px] h-[66px] rounded-2xl flex flex-col items-center justify-center shadow-xl shrink-0 ${
            isImage
              ? "bg-white text-slate-900 border border-white/60"
              : "bg-white/20 backdrop-blur-md border border-white/30 text-white"
          }`}
        >
          <span className={`text-[9px] font-black uppercase tracking-wider ${isImage ? "text-teal-700" : "text-teal-200"}`}>
            DAY
          </span>
          <span className="text-3xl font-black leading-none">{String(day).padStart(2, "0")}</span>
        </div>

        <div className="pb-0.5 space-y-0.5">
          {destination && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/25 backdrop-blur-md border border-teal-300/40 text-teal-100 text-[10px] font-bold">
              <MapPin className="w-3 h-3 text-amber-300" />
              <span>{destination}</span>
            </div>
          )}
          <h2
            className={`text-2xl font-black tracking-tight max-w-xl leading-tight ${
              isImage ? "text-white drop-shadow-md" : "text-white drop-shadow-md"
            }`}
          >
            {title || `Day ${day} Itinerary`}
          </h2>
        </div>
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  icon,
  accent,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  accent: "emerald" | "rose";
}) {
  const filtered = items.filter((i) => i.trim());
  const bg = accent === "emerald" ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200";
  return (
    <div className={`rounded-2xl border p-4 ${bg} space-y-3 shadow-2xs`}>
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        {icon}
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
          {filtered.length} items
        </span>
      </div>
      <ul className="space-y-2">
        {filtered.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-800 leading-snug font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                accent === "emerald" ? "bg-emerald-600" : "bg-rose-600"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PdfCell({
  label,
  value,
  className,
  highlight,
}: {
  label: string;
  value: string;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div className={className}>
      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p
        className={`text-xs leading-snug truncate ${
          highlight ? "font-black text-slate-900" : "font-semibold text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function flightHasData(f: ItineraryFlight) {
  return !!(f.flightNo.trim() || f.date || f.departure.trim() || f.arrival.trim());
}

function hotelHasData(h: ItineraryHotel) {
  return !!(
    h.hotelName.trim() ||
    h.location.trim() ||
    h.checkIn ||
    h.checkOut ||
    h.roomCategory.trim() ||
    h.mealPlan.trim()
  );
}

function transportHasData(t: ItineraryTransport) {
  return !!(
    t.date ||
    t.vehicleType.trim() ||
    t.route.trim() ||
    t.pickupTime.trim() ||
    t.dropoff.trim() ||
    t.notes.trim()
  );
}

function formatPdfDate(date: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSafeCrossOrigin(url?: string): "anonymous" | undefined {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
    return undefined;
  }
  return "anonymous";
}
