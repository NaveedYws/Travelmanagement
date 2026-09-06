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

const PAGE = "w-[210mm] h-[297mm] bg-white overflow-hidden relative shrink-0 shadow-2xl mb-8 last:mb-0 select-none";

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

  // Real, breathtaking travel destination background
  const DEFAULT_TRAVEL_BG = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600";
  const activeTravelBg =
    heroImage && !heroImage.includes("photo-1488646953014-85cb44e25828")
      ? heroImage
      : days.find((d) => d.images && d.images[0]?.trim())?.images[0] || DEFAULT_TRAVEL_BG;

  // Page counter calculation for accurate running footers
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
      {/* 1. COVER PAGE: LUXURY MAGAZINE EDITORIAL STYLE                           */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        {/* Hero Background Image (Breathtaking Travel Destination) */}
        <img
          src={activeTravelBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin={getSafeCrossOrigin(activeTravelBg)}
        />

        {/* High-End Vignette & Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050c18] via-[#081729]/80 to-[#071324]/55" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#060e1a]/40 to-[#050b14]/90" />

        {/* Top Gold & Teal Luxury Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-teal-400 shadow-sm" />

        <div className="relative z-10 h-full flex flex-col justify-between p-10 sm:p-12">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            <BrandMark user={user} variant="light" />
            <div className="text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 backdrop-blur-md border border-amber-400/30 text-amber-300">
                <Sparkles className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-[0.25em]">Travel Quotation</span>
              </div>
              <p className="text-xs font-mono font-semibold text-white/80">Ref: #{quotationRef}</p>
              <p className="text-[11px] text-white/60">{issuedDate}</p>
            </div>
          </div>

          {/* Center Title & Journey Hook */}
          <div className="py-6 my-auto space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 backdrop-blur-md border border-teal-300/40 text-teal-200 shadow-lg">
              <Plane className="w-3.5 h-3.5 text-teal-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Official Travel Quotation & Itinerary
              </span>
            </div>

            <h1 className="text-[52px] font-black text-white leading-[1.05] tracking-tight drop-shadow-xl">
              {tripTitle || (destination ? `${destination} Holiday Package` : "Customized Travel Quotation")}
            </h1>

            <div className="flex items-center gap-2 text-amber-300 text-lg font-bold">
              <MapPin className="w-5 h-5 shrink-0" />
              <span className="tracking-wide">{destination ? `${destination} Tour Package` : "Confirmed Travel Itinerary"}</span>
            </div>

            <p className="text-sm text-slate-100/90 leading-relaxed font-normal pt-1">
              Complete tour quotation with verified hotel accommodations, private chauffeur transfers, daily sightseeing itinerary, and transparent package pricing.
            </p>
          </div>

          {/* Floating Frosted Glass Metrics Bar */}
          <div className="grid grid-cols-4 gap-0 rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl text-white">
            <CoverStat icon={<Calendar className="w-4 h-4 text-teal-300" />} label="Duration" value={duration} />
            <CoverStat icon={<Compass className="w-4 h-4 text-amber-300" />} label="Holiday Type" value={theme || "Custom Tour"} border />
            <CoverStat icon={<Users className="w-4 h-4 text-blue-300" />} label="Total Guests" value={guestLabel} border />
            <CoverStat icon={<Award className="w-4 h-4 text-yellow-300" />} label="Package Cost" value={`₹${price}`} />
          </div>

          {/* Bottom VIP Client Callout */}
          <div className="flex justify-between items-end pt-6 border-t border-white/15">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-300/90 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Quotation Prepared For
              </p>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {clientName || "Valued Guest"}
              </p>
            </div>

            <div className="text-right text-xs text-white/80 space-y-1">
              <p className="font-black text-white text-base tracking-tight">{user?.company_name || "Authorized Travel Specialist"}</p>
              {user?.company_phone && (
                <p className="flex items-center justify-end gap-1 text-[11px] text-teal-200 font-semibold">
                  <Phone className="w-3 h-3" /> Helpline: {user.company_phone}
                </p>
              )}
              {user?.email && (
                <p className="flex items-center justify-end gap-1 text-[11px] text-white/70">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>
              )}
              {user?.company_website && (
                <p className="flex items-center justify-end gap-1 text-[11px] text-white/60 font-semibold">
                  <Globe className="w-3 h-3" /> {user.company_website}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OVERVIEW PAGE: TRIP SNAPSHOT & AT A GLANCE                             */}
      {/* ========================================================================= */}
      <div data-pdf-page className={PAGE}>
        <RunningHeader
          user={user}
          section="Holiday Overview"
          title="Tour Snapshot & Daily Route"
          quotationRef={quotationRef}
          accentColor="teal"
        />

        <div className="px-10 py-6 flex-1 flex flex-col justify-between space-y-6">
          {/* Quick Snapshot 4-Grid */}
          <div className="grid grid-cols-4 gap-3.5">
            <InfoCard icon={<MapPin className="w-4 h-4" />} label="Destination" value={destination || "Scenic Destination"} variant="blue" />
            <InfoCard icon={<Calendar className="w-4 h-4" />} label="Travel Dates" value={dateRange} variant="violet" />
            <InfoCard icon={<Users className="w-4 h-4" />} label="Total Guests" value={guestLabel} variant="emerald" />
            <InfoCard icon={<Compass className="w-4 h-4" />} label="Holiday Type" value={theme || "Holiday Package"} variant="amber" />
          </div>

          {/* Large Hero Showcase Image with Journey Badge */}
          <div className="relative flex-1 rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 min-h-[110mm]">
            <img
              src={activeTravelBg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin={getSafeCrossOrigin(activeTravelBg)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e19]/90 via-slate-900/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 text-white flex justify-between items-end">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>Curated Holiday Snapshot</span>
                </div>
                <p className="text-3xl font-black tracking-tight">{tripTitle || (destination ? `${destination} Holiday Package` : "Customized Tour Itinerary")}</p>
                <p className="text-teal-200 text-sm font-medium mt-1">
                  {days.length} Days Itinerary · {duration}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Total Package Cost</p>
                <p className="text-3xl font-black text-amber-300">₹{price}</p>
              </div>
            </div>
          </div>

          {/* Route Highlights Strip */}
          {days.length > 0 && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-teal-800 mb-2 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                Journey Route & Daily Flow
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
                {days.map((d, i) => (
                  <div key={d.day} className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 font-bold text-[11px] shadow-2xs">
                      Day {d.day}: {d.destination || d.title || `Day ${d.day}`}
                    </span>
                    {i < days.length - 1 && <ArrowRight className="w-3 h-3 text-teal-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
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
            accentColor="teal"
          />

          <div className="px-10 py-5 space-y-4 flex-1">
            {validHotels.map((hotel, i) => (
              <HotelCard key={i} hotel={hotel} index={i} />
            ))}
          </div>

          <RunningFooter user={user} pageNumber={hotelPageNum || undefined} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TRANSFERS & TRANSPORT PAGE                                             */}
      {/* ========================================================================= */}
      {validTransports.length > 0 && (
        <div data-pdf-page className={PAGE}>
          <RunningHeader
            user={user}
            section="Transfers & Mobility"
            title="Private Chauffeur & Vehicles"
            quotationRef={quotationRef}
            accentColor="emerald"
          />

          <div className="px-10 py-5 space-y-4 flex-1">
            {validTransports.map((transport, i) => (
              <TransportCard key={i} transport={transport} index={i} />
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
            accentColor="blue"
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
            accentColor="purple"
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
      {/* 7. DAY BY DAY ITINERARY PAGES                                             */}
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
              accentColor="teal"
            />

            {/* Day Hero Banner */}
            {hasDayHeroImage ? (
              <div className="relative h-[84mm] w-full overflow-hidden">
                <img
                  src={day.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  crossOrigin={getSafeCrossOrigin(day.images[0])}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-slate-900/30 to-slate-900/60" />
                <DayHeroBanner day={day.day} title={day.title} destination={day.destination} variant="image" />
              </div>
            ) : (
              <div className="relative h-[48mm] w-full bg-gradient-to-br from-slate-900 via-teal-950 to-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.2),transparent)]" />
                <DayHeroBanner day={day.day} title={day.title} destination={day.destination} variant="gradient" />
              </div>
            )}

            {/* Day Content Body */}
            <div className="px-10 py-6 space-y-5 flex-1 relative">
              {/* Background Watermark Day Number */}
              <div className="absolute right-10 top-2 text-[130px] font-black text-slate-100/80 leading-none select-none pointer-events-none -z-10">
                {String(day.day).padStart(2, "0")}
              </div>

              {/* Experiences & Activities Callout */}
              {day.activities?.trim() && (
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/70 to-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-teal-800">
                      Curated Experiences & Sightseeing
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed pl-7">{day.activities}</p>
                </div>
              )}

              {/* Day Highlights Section (Chips / Grid) */}
              {day.highlights && day.highlights.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Day Highlights
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {day.highlights.filter(Boolean).map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Day Description Body */}
              {day.description?.trim() && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Day Details & Schedule</p>
                  <div className="text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    {day.description}
                  </div>
                </div>
              )}

              {/* Additional Photos Gallery */}
              {extraImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {extraImages.map((img, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden h-36 shadow-md border border-slate-200">
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
          accentColor="amber"
        />

        <div className="px-10 py-6 flex-1 flex flex-col justify-between space-y-6">
          {/* Inclusions & Exclusions Side by Side */}
          <div className="grid grid-cols-2 gap-6">
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

          {/* Luxury Total Investment Showcase Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Dark Midnight Luxury Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#06111f] via-[#0a1e38] to-[#122e50]" />
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-sm" />

            <div className="relative px-8 py-8 text-center text-white space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-[0.25em]">
                <Award className="w-3.5 h-3.5" />
                <span>Transparent Final Quotation</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-300">Total Investment</p>
                <p className="text-6xl font-black tracking-tight text-white mt-1">₹{price}</p>
              </div>

              <div className="flex items-center justify-center gap-3 text-slate-300 text-xs font-medium">
                <span>{guestLabel}</span>
                <span>•</span>
                <span>Inclusive of all specified services & applicable GST</span>
              </div>
            </div>
          </div>

          {/* Client Notes & Important Terms */}
          {clientNotes?.trim() && (
            <div className="rounded-2xl bg-amber-50/80 border-l-4 border-amber-400 p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Important Remarks & Validity
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">{clientNotes}</p>
            </div>
          )}

          {/* Agency Signature & Verification Seal Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark user={user} variant="dark" />
              <div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {user?.company_name || "Authorized Travel Specialist"}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">Verified Travel Quotation · Valid for 7 days</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 space-y-1">
              {user?.company_phone && (
                <p className="flex items-center justify-end gap-1 font-semibold text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-teal-600" /> {user.company_phone}
                </p>
              )}
              {user?.email && (
                <p className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                </p>
              )}
              {user?.company_website && (
                <p className="flex items-center justify-end gap-1 text-[11px] text-teal-700 font-semibold">
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
  accentColor = "teal",
}: {
  user?: User | null;
  section: string;
  title: string;
  quotationRef?: string;
  accentColor?: "teal" | "blue" | "emerald" | "amber" | "purple";
}) {
  const accentBars = {
    teal: "from-teal-600 via-teal-500 to-emerald-600",
    blue: "from-blue-600 via-indigo-600 to-teal-600",
    emerald: "from-emerald-600 via-teal-600 to-emerald-500",
    amber: "from-amber-500 via-orange-500 to-yellow-500",
    purple: "from-purple-600 via-indigo-600 to-pink-600",
  };

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white">
      <div className={`h-1 bg-gradient-to-r ${accentBars[accentColor]}`} />
      <div className="px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xs">
            {user?.company_name?.charAt(0) || "T"}
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-slate-400">{section}</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{title}</h2>
          </div>
        </div>
        <div className="text-right text-[10px]">
          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Ref: #{quotationRef || "QT-PROPOSAL"}
          </span>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">
            {user?.company_name || "Travel Partner"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RunningFooter({ user, pageNumber }: { user?: User | null; pageNumber?: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-10 py-3 flex justify-between items-center text-[8px] text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100 bg-white/95">
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
}) {
  return (
    <div className={`p-4 text-center ${border ? "border-x border-white/15" : ""}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50 mb-0.5">{label}</p>
      <p className="text-xs font-bold text-white leading-snug truncate px-1">{value}</p>
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
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
    violet: "from-indigo-50 to-white border-indigo-100 text-indigo-700",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-3.5 bg-gradient-to-br shadow-xs ${styles[variant]}`}>
      <div className="mb-1.5 opacity-90">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-bold text-slate-800 leading-snug truncate">{value}</p>
    </div>
  );
}

function HotelCard({ hotel, index }: { hotel: ItineraryHotel; index: number }) {
  const starNum = parseInt(hotel.starRating || "3") || 3;
  const starsString = "★".repeat(Math.min(5, Math.max(1, starNum)));

  const amenitiesList = (hotel.amenities || "")
    .split(/[,•\n]/)
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black truncate">{hotel.hotelName || `Luxury Stay ${index + 1}`}</p>
            <p className="text-xs text-teal-200/90 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
              <span>{hotel.location || "Prime Location"}</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-amber-400 tracking-widest text-xs font-black">{starsString}</div>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white uppercase">
            {hotel.starRating || "Standard"}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-4 grid grid-cols-4 gap-3 bg-slate-50/50 border-b border-slate-100">
        <PdfCell label="Check-in" value={formatPdfDate(hotel.checkIn)} />
        <PdfCell label="Check-out" value={formatPdfDate(hotel.checkOut)} />
        <PdfCell
          label="Stay Duration"
          value={`${hotel.rooms || 1} Room${(hotel.rooms || 1) > 1 ? "s" : ""} · ${hotel.nights || 1} Night${
            (hotel.nights || 1) > 1 ? "s" : ""
          }`}
          highlight
        />
        <PdfCell label="Room Category" value={hotel.roomCategory || "Deluxe Room"} />
      </div>

      <div className="px-4 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
          <Coffee className="w-3.5 h-3.5 text-teal-600" />
          <span>Meal Plan: {hotel.mealPlan || "Room Only"}</span>
        </div>

        {amenitiesList.length > 0 && (
          <div className="flex items-center gap-1.5">
            {amenitiesList.slice(0, 3).map((amenity, aIdx) => (
              <span
                key={aIdx}
                className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-100 text-[10px] font-semibold text-teal-800 flex items-center gap-1"
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

function TransportCard({ transport, index }: { transport: ItineraryTransport; index: number }) {
  const inclusions = transport.inclusions || [
    "Driver Allowance",
    "Tolls & State Taxes",
    "Fuel Charges",
    "Parking Fees",
  ];

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden flex">
      {/* Side Icon Column */}
      <div className="w-16 bg-gradient-to-b from-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white shrink-0 p-2 text-center">
        <Car className="w-6 h-6 mb-1 opacity-90" />
        <span className="text-[9px] font-black uppercase tracking-wider">#{index + 1}</span>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Chauffeur Service</span>
            <p className="text-base font-black text-slate-900">{transport.vehicleType || "Private Vehicle Transfer"}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700">{formatPdfDate(transport.date)}</span>
            {transport.pickupTime && (
              <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Pickup: {transport.pickupTime}
              </p>
            )}
          </div>
        </div>

        {/* Route Visual Line */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{transport.route || "Sightseeing / Transfer Route"}</span>
          </div>
          {transport.dropoff && (
            <div className="text-[11px] text-slate-500 font-normal truncate">
              Drop: {transport.dropoff}
            </div>
          )}
        </div>

        {/* Inclusions Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {inclusions.slice(0, 4).map((inc, iIdx) => (
            <span
              key={iIdx}
              className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-800 border border-emerald-100 flex items-center gap-1"
            >
              <Check className="w-2.5 h-2.5 text-emerald-600" /> {inc}
            </span>
          ))}
          {transport.notes?.trim() && (
            <span className="text-[10px] text-slate-400 italic ml-auto truncate max-w-xs">
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
    <div className="rounded-2xl border border-blue-100 bg-white shadow-md overflow-hidden flex">
      <div className="w-16 bg-gradient-to-b from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white shrink-0 p-2 text-center">
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
    <div className="rounded-2xl border border-purple-100 bg-white shadow-md overflow-hidden flex">
      <div className="w-16 bg-gradient-to-b from-purple-600 to-indigo-700 flex flex-col items-center justify-center text-white shrink-0 p-2 text-center">
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
    <div className="absolute bottom-6 left-10 right-10 flex items-end justify-between">
      <div className="flex items-end gap-4">
        {/* Floating Day Badge */}
        <div
          className={`w-[68px] h-[68px] rounded-2xl flex flex-col items-center justify-center shadow-2xl shrink-0 ${
            isImage
              ? "bg-white text-slate-900 border border-slate-100"
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
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 backdrop-blur border border-teal-300/40 text-teal-100 text-[10px] font-bold">
              <MapPin className="w-3 h-3" />
              <span>{destination}</span>
            </div>
          )}
          <h2
            className={`text-2xl font-black tracking-tight max-w-xl leading-tight ${
              isImage ? "text-slate-900 drop-shadow-sm" : "text-white drop-shadow-md"
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
  const bg = accent === "emerald" ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100";
  return (
    <div className={`rounded-2xl border p-4 ${bg} space-y-3`}>
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
        {icon}
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <span className="ml-auto text-[10px] font-bold text-slate-400">({filtered.length} items)</span>
      </div>
      <ul className="space-y-2">
        {filtered.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                accent === "emerald" ? "bg-emerald-500" : "bg-rose-500"
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
