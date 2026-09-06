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
} from "lucide-react";
import { DetailedItineraryDay, ItineraryFlight, ItineraryHotel, ItineraryTransport, ItineraryService } from "@/lib/types";
import type { User } from "@/lib/types";

export interface ItineraryPdfData {
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

const PAGE = "w-[210mm] h-[297mm] bg-white overflow-hidden relative shrink-0";

export function ItineraryPdfDocument({ data, user }: ItineraryPdfDocumentProps) {
  const {
    clientName,
    tripTitle,
    destination,
    adults,
    children,
    theme,
    finalRate,
    heroImage,
    days,
    flights = [],
    transports = [],
    hotels = [],
    customServices = [],
    inclusions,
    exclusions,
    clientNotes,
    duration,
    dateRange,
  } = data;

  const price = parseFloat(finalRate || "0").toLocaleString("en-IN");
  const guestLabel = `${adults} Adult${parseInt(adults) !== 1 ? "s" : ""}${
    parseInt(children) > 0 ? ` · ${children} Child${parseInt(children) !== 1 ? "ren" : ""}` : ""
  }`;
  const issuedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="font-sans text-slate-900 antialiased">
      {/* COVER */}
      <div data-pdf-page className={PAGE}>
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin={getSafeCrossOrigin(heroImage)} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/95 via-[#0f2744]/85 to-[#1e3a5f]/75" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-600" />

        <div className="relative z-10 h-full flex flex-col p-10 sm:p-12">
          <div className="flex justify-between items-start">
            <BrandMark user={user} variant="light" />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-300/90">Premium Quotation</p>
              <p className="text-sm font-semibold text-white/90 mt-1">{issuedDate}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-8">
            <div className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Curated Journey</span>
            </div>
            <h1 className="text-[56px] font-black text-white leading-[1.02] tracking-tight max-w-[95%] drop-shadow-lg">
              {tripTitle || "Your Custom Journey"}
            </h1>
            <p className="text-xl text-blue-100/90 mt-4 font-medium max-w-xl">
              {destination || "Destination to be confirmed"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-sm">
            <CoverStat label="Duration" value={duration} />
            <CoverStat label="Travel Style" value={theme} border />
            <CoverStat label="Travelers" value={guestLabel} />
          </div>

          <div className="flex justify-between items-end mt-10 pt-8 border-t border-white/15">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/45 mb-2">Prepared exclusively for</p>
              <p className="text-4xl font-black text-white tracking-tight">{clientName || "Valued Client"}</p>
            </div>
            <div className="text-right text-white/80">
              <p className="font-bold text-white text-lg">{user?.company_name || "Travel Partner"}</p>
              {user?.company_phone && <p className="text-xs mt-1 opacity-80">{user.company_phone}</p>}
              {user?.company_website && <p className="text-xs opacity-60">{user.company_website}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* OVERVIEW */}
      <div data-pdf-page className={PAGE}>
        <PageHeader user={user} title="Trip Overview" subtitle={tripTitle || "Your itinerary"} accent="blue" />
        <div className="px-10 pb-10 flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoCard icon={<MapPin className="w-5 h-5" />} label="Destination" value={destination || "TBC"} variant="blue" />
            <InfoCard icon={<Calendar className="w-5 h-5" />} label="Travel Dates" value={dateRange} variant="violet" />
            <InfoCard icon={<Users className="w-5 h-5" />} label="Guests" value={guestLabel} variant="emerald" />
            <InfoCard icon={<Activity className="w-5 h-5" />} label="Experience" value={theme} variant="amber" />
          </div>
          <div className="relative flex-1 rounded-3xl overflow-hidden shadow-xl border border-slate-200 min-h-[120mm]">
            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin={getSafeCrossOrigin(heroImage)} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300 mb-2">Journey snapshot</p>
              <p className="text-2xl font-black">
                {days.length} Days · {duration}
              </p>
            </div>
          </div>
        </div>
        <PageFooter user={user} />
      </div>

      {hotels.filter(hotelHasData).length > 0 && (
        <div data-pdf-page className={PAGE}>
          <PageHeader user={user} title="Accommodation" subtitle="Hotels & room details" accent="blue" />
          <div className="px-10 py-4 space-y-4 flex-1">
            {hotels.filter(hotelHasData).map((hotel, i) => (
              <HotelRow key={i} hotel={hotel} index={i} />
            ))}
          </div>
          <PageFooter user={user} />
        </div>
      )}

      {transports.filter(transportHasData).length > 0 && (
        <div data-pdf-page className={PAGE}>
          <PageHeader user={user} title="Transport" subtitle="Transfers & vehicles" accent="emerald" />
          <div className="px-10 py-4 space-y-4 flex-1">
            {transports.filter(transportHasData).map((transport, i) => (
              <TransportRow key={i} transport={transport} index={i} />
            ))}
          </div>
          <PageFooter user={user} />
        </div>
      )}

      {flights.filter(flightHasData).length > 0 && (
        <div data-pdf-page className={PAGE}>
          <PageHeader user={user} title="Flights" subtitle="Air travel schedule" accent="orange" />
          <div className="px-10 py-4 space-y-4 flex-1">
            {flights.filter(flightHasData).map((flight, i) => (
              <FlightRow key={i} flight={flight} index={i} />
            ))}
          </div>
          <PageFooter user={user} />
        </div>
      )}

      {customServices && customServices.filter((s) => (s.title || "").trim()).length > 0 && (
        <div data-pdf-page className={PAGE}>
          <PageHeader user={user} title="Custom Bookings & Services" subtitle="Buses, trains, visas & additional entities" accent="blue" />
          <div className="px-10 py-4 space-y-4 flex-1">
            {customServices
              .filter((s) => (s.title || "").trim())
              .map((service, i) => (
                <CustomServiceRow key={i} service={service} index={i} />
              ))}
          </div>
          <PageFooter user={user} />
        </div>
      )}

      {days.map((day) => (
        <div key={day.day} data-pdf-page className={PAGE}>
          {day.images && day.images[0]?.trim() ? (
            <div className="relative h-[88mm] w-full">
              <img
                src={day.images[0]}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin={getSafeCrossOrigin(day.images[0])}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-slate-900/50" />
              <DayHero day={day.day} title={day.title} variant="image" />
            </div>
          ) : (
            <div className="relative h-[50mm] bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900">
              <DayHero day={day.day} title={day.title} variant="gradient" />
            </div>
          )}
          <div className="px-10 py-8 space-y-6 relative">
            <div className="absolute right-10 top-4 text-[120px] font-black text-slate-100 leading-none select-none pointer-events-none">
              {day.day}
            </div>
            {day.activities?.trim() && (
              <div className="relative rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Experiences</p>
                </div>
                <p className="text-base font-semibold text-slate-800 leading-relaxed">{day.activities}</p>
              </div>
            )}
            {day.description?.trim() && <HighlightsList description={day.description} />}
            {day.images && day.images.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {day.images
                  .slice(1, 3)
                  .filter(Boolean)
                  .map((img, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden h-40 shadow-md ring-1 ring-slate-100">
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
          <PageFooter user={user} />
        </div>
      ))}

      {/* SUMMARY */}
      <div data-pdf-page className={PAGE}>
        <PageHeader user={user} title="Investment" subtitle="Package summary & terms" accent="slate" />
        <div className="px-10 flex-1 flex flex-col pb-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <ListSection
              title="Inclusions"
              items={inclusions}
              icon={<CheckCircle2 className="w-7 h-7 text-emerald-500" />}
              accent="emerald"
            />
            <ListSection
              title="Exclusions"
              items={exclusions}
              icon={<XCircle className="w-7 h-7 text-rose-500" />}
              accent="rose"
            />
          </div>

          <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-blue-400 to-indigo-400" />
            <div className="relative px-10 py-12 text-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-300 mb-4">Total Investment</p>
              <p className="text-7xl font-black tracking-tight leading-none">₹{price}</p>
              <p className="text-slate-300 text-sm mt-4">{guestLabel}</p>
              <p className="text-[9px] text-slate-500 mt-3 uppercase tracking-widest">Inclusive of applicable taxes & fees</p>
            </div>
          </div>

          {clientNotes?.trim() && (
            <div className="rounded-2xl bg-amber-50 border-l-4 border-amber-400 p-5 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">Important notes</p>
              <p className="text-sm text-slate-700 leading-relaxed">{clientNotes}</p>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between">
            <BrandMark user={user} variant="dark" />
            <div className="text-right text-xs text-slate-500 space-y-1">
              {user?.company_phone && (
                <p className="flex items-center justify-end gap-1">
                  <Phone className="w-3 h-3" /> {user.company_phone}
                </p>
              )}
              {user?.email && (
                <p className="flex items-center justify-end gap-1">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>
              )}
              {user?.company_website && (
                <p className="flex items-center justify-end gap-1">
                  <Globe className="w-3 h-3" /> {user.company_website}
                </p>
              )}
            </div>
          </div>
        </div>
        <PageFooter user={user} />
      </div>
    </div>
  );
}

function BrandMark({ user, variant }: { user?: User | null; variant: "light" | "dark" }) {
  const isLight = variant === "light";
  return user?.company_logo ? (
    <img
      src={user.company_logo}
      alt=""
      className={`h-12 w-auto object-contain ${isLight ? "brightness-0 invert" : ""}`}
      crossOrigin={getSafeCrossOrigin(user.company_logo)}
    />
  ) : (
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
        isLight ? "bg-white/15 border border-white/25 text-white" : "bg-blue-600 text-white"
      }`}
    >
      {user?.company_name?.charAt(0) || "T"}
    </div>
  );
}

function CoverStat({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`p-5 text-center ${border ? "border-x border-white/15" : ""}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">{label}</p>
      <p className="text-sm font-bold text-white leading-snug">{value}</p>
    </div>
  );
}

function PageHeader({
  user,
  title,
  subtitle,
  accent,
}: {
  user?: User | null;
  title: string;
  subtitle: string;
  accent: "blue" | "orange" | "emerald" | "slate";
}) {
  const bar: Record<string, string> = {
    blue: "bg-blue-600",
    orange: "bg-orange-500",
    emerald: "bg-emerald-600",
    slate: "bg-slate-800",
  };
  return (
    <div className="flex">
      <div className={`w-1.5 ${bar[accent]}`} />
      <div className="flex-1 px-10 pt-9 pb-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-1">{title}</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{subtitle}</h2>
        </div>
        {user?.company_name && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.company_name}</p>
        )}
      </div>
    </div>
  );
}

function PageFooter({ user }: { user?: User | null }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-10 py-3 flex justify-between items-center text-[8px] text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100 bg-white/95">
      <span>{user?.company_name || "Travel Partner"}</span>
      <span>Confidential · {new Date().getFullYear()}</span>
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
    blue: "from-blue-50 to-white border-blue-100 text-blue-600",
    violet: "from-violet-50 to-white border-violet-100 text-violet-600",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-600",
    amber: "from-amber-50 to-white border-amber-100 text-amber-600",
  };
  return (
    <div className={`rounded-2xl border p-4 bg-gradient-to-br shadow-sm ${styles[variant]}`}>
      <div className="mb-2 opacity-90">{icon}</div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800 leading-snug">{value}</p>
    </div>
  );
}

function DayHero({ day, title, variant }: { day: number; title: string; variant: "image" | "gradient" }) {
  const isImage = variant === "image";
  return (
    <div className="absolute bottom-8 left-10 flex items-end gap-5">
      <div
        className={`w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center shadow-2xl ${
          isImage ? "bg-white text-slate-900" : "bg-white/15 backdrop-blur border border-white/30 text-white"
        }`}
      >
        <span className={`text-[9px] font-bold uppercase tracking-wider ${isImage ? "text-slate-400" : "text-white/70"}`}>
          Day
        </span>
        <span className="text-4xl font-black leading-none">{day}</span>
      </div>
      {title && (
        <h2
          className={`text-3xl font-black max-w-lg leading-tight pb-1 ${
            isImage ? "text-slate-900" : "text-white drop-shadow-md"
          }`}
        >
          {title}
        </h2>
      )}
    </div>
  );
}

function HighlightsList({ description }: { description: string }) {
  const points = description.split("\n").filter((l) => l.trim());
  return (
    <div className="relative">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1 h-5 bg-blue-600 rounded-full" />
        Day highlights
      </h3>
      <ul className="space-y-3">
        {points.map((point, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed pl-1">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            {point.replace(/^[•\-]\s*/, "").trim()}
          </li>
        ))}
      </ul>
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
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-black text-slate-800">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {filtered.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                accent === "emerald" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
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
    h.bedType.trim() ||
    h.mealPlan.trim()
  );
}

function transportHasData(t: ItineraryTransport) {
  return !!(t.date || t.vehicleType.trim() || t.route.trim() || t.pickupTime.trim() || t.dropoff.trim() || t.notes.trim());
}

function formatPdfDate(date: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getSafeCrossOrigin(url?: string): "anonymous" | undefined {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
    return undefined;
  }
  return "anonymous";
}

function CustomServiceRow({ service, index }: { service: ItineraryService; index: number }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white shadow-md overflow-hidden flex">
      <div className="w-16 bg-gradient-to-b from-indigo-600 to-indigo-700 flex flex-col items-center justify-center text-white shrink-0 p-2 text-center">
        <Layers className="w-5 h-5 mb-1 opacity-90" />
        <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full">
          {service.category || "Item"}
        </span>
      </div>
      <div className="flex-1 p-5 grid grid-cols-4 gap-4 items-center">
        <PdfCell label={service.category || "Service / Booking"} value={service.title || "—"} highlight />
        <PdfCell label="Details / Route" value={service.details || service.notes || "—"} className="col-span-2" />
        <PdfCell
          label="Date / Quantity"
          value={
            [service.date ? formatPdfDate(service.date) : "", service.quantity ? `${service.quantity}` : ""]
              .filter(Boolean)
              .join(" · ") || "—"
          }
        />
      </div>
    </div>
  );
}

function FlightRow({ flight, index }: { flight: ItineraryFlight; index: number }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white shadow-md overflow-hidden flex">
      <div className="w-14 bg-gradient-to-b from-orange-500 to-orange-600 flex flex-col items-center justify-center text-white shrink-0">
        <Plane className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-black">#{index + 1}</span>
      </div>
      <div className="flex-1 p-5 grid grid-cols-4 gap-4 items-center">
        <PdfCell label="Flight" value={flight.flightNo || "—"} highlight />
        <PdfCell label="Date" value={formatPdfDate(flight.date)} />
        <PdfCell label="Departure" value={flight.departure || "—"} />
        <PdfCell label="Arrival" value={flight.arrival || "—"} />
      </div>
    </div>
  );
}

function HotelRow({ hotel, index }: { hotel: ItineraryHotel; index: number }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-md overflow-hidden">
      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-teal-700 to-slate-800 text-white">
        <Hotel className="w-7 h-7 shrink-0 opacity-90" />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black truncate">{hotel.hotelName || `Hotel ${index + 1}`}</p>
          <p className="text-sm text-teal-100 truncate">{hotel.location || "—"}</p>
        </div>
        {hotel.starRating && (
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold shrink-0">
            {hotel.starRating}
          </span>
        )}
      </div>
      <div className="p-5 grid grid-cols-3 gap-4">
        <PdfCell label="Check-in" value={formatPdfDate(hotel.checkIn)} />
        <PdfCell label="Check-out" value={formatPdfDate(hotel.checkOut)} />
        <PdfCell label="Room" value={hotel.roomCategory || "—"} />
        <PdfCell label="Rooms / Nights" value={`${hotel.rooms || 1} Room${(hotel.rooms || 1) > 1 ? "s" : ""} · ${hotel.nights || 1} Night${(hotel.nights || 1) > 1 ? "s" : ""}`} />
        <PdfCell label="Meal plan" value={hotel.mealPlan || "—"} className="col-span-2" />
        {hotel.amenities && <PdfCell label="Amenities" value={hotel.amenities} className="col-span-3" />}
      </div>
    </div>
  );
}

function TransportRow({ transport, index }: { transport: ItineraryTransport; index: number }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden flex">
      <div className="w-14 bg-gradient-to-b from-emerald-500 to-emerald-700 flex flex-col items-center justify-center text-white shrink-0">
        <Car className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-black">#{index + 1}</span>
      </div>
      <div className="flex-1 p-5 grid grid-cols-3 gap-4">
        <PdfCell label="Date" value={formatPdfDate(transport.date)} />
        <PdfCell label="Vehicle" value={transport.vehicleType || "—"} highlight />
        <PdfCell label="Pickup" value={transport.pickupTime || "—"} />
        <PdfCell label="Route" value={transport.route || "—"} className="col-span-2" />
        <PdfCell label="Drop-off" value={transport.dropoff || "—"} />
        {transport.notes?.trim() ? <PdfCell label="Notes" value={transport.notes} className="col-span-3" /> : null}
      </div>
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
      <p className={`text-sm leading-snug ${highlight ? "font-black text-slate-900" : "font-semibold text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}
