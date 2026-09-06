import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Trash2,
  Hotel,
  Car,
  Plane,
  Download,
  CheckCircle2,
  XCircle,
  Save,
  User as UserIcon,
  Eye,
  X,
  Menu,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Compass,
  Share2,
  Mail,
  MessageCircle,
  ShieldCheck,
  Edit2,
  Upload,
  Check,
  Sparkles,
  Settings,
  Camera,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import {
  DetailedItineraryDay,
  ItineraryFlight,
  ItineraryHotel,
  ItineraryTransport,
  ItinerarySightseeing,
  ItineraryTrain,
  ItineraryService,
} from "@/lib/types";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ItineraryPdfDocument, ItineraryPdfData } from "./ItineraryPdfDocument";
import { cn } from "@/lib/utils";

const COLOR_THEMES = [
  { id: "teal", name: "Teal Modern", color: "#0f766e", ring: "ring-teal-500", bg: "bg-teal-600" },
  { id: "blue", name: "Royal Blue", color: "#1d4ed8", ring: "ring-blue-500", bg: "bg-blue-600" },
  { id: "indigo", name: "Deep Indigo", color: "#4338ca", ring: "ring-indigo-500", bg: "bg-indigo-600" },
  { id: "emerald", name: "Emerald Pine", color: "#047857", ring: "ring-emerald-500", bg: "bg-emerald-600" },
  { id: "rose", name: "Ruby Rose", color: "#be123c", ring: "ring-rose-500", bg: "bg-rose-600" },
  { id: "amber", name: "Sunset Gold", color: "#b45309", ring: "ring-amber-500", bg: "bg-amber-600" },
  { id: "slate", name: "Corporate Slate", color: "#334155", ring: "ring-slate-500", bg: "bg-slate-700" },
];

export interface ItineraryMakerProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function ItineraryMaker({ trigger, className }: ItineraryMakerProps = {}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Metadata
  const [quotationRef] = useState(() => `QT-${Math.floor(10000 + Math.random() * 90000)}`);
  const [quotationDate] = useState(() =>
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  );

  // Rate Display Mode Switch: "subtotal" (only show subtotal) vs "full" (full customized rate: hotel, transport, flight, airfare)
  const [rateDisplayMode, setRateDisplayMode] = useState<"subtotal" | "full">("subtotal");

  // Section collapse states
  const [sectionsOpen, setSectionsOpen] = useState({
    customer: true,
    package: true,
    itinerary: true,
    hotels: true,
    transport: true,
    sightseeing: false,
    flights: false,
    trains: false,
    services: false,
    policies: false,
    settings: true,
  });

  const toggleSection = (sec: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // 1. Customer Details (Blank clean start)
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [roomsCount, setRoomsCount] = useState("1");
  const [isEditingPax, setIsEditingPax] = useState(false);

  // 2. Package Overview (Blank clean start)
  const [packageType, setPackageType] = useState<"Full Package" | "Customized">("Full Package");
  const [tripTitle, setTripTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [theme, setTheme] = useState("");
  const [heroImage, setHeroImage] = useState("");

  // 3. Itinerary Days (Blank clean start)
  const [days, setDays] = useState<DetailedItineraryDay[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [newDayNumber, setNewDayNumber] = useState(1);
  const [newDayDestination, setNewDayDestination] = useState("");
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDescription, setNewDayDescription] = useState("");
  const [newDayImageUrl, setNewDayImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 4. Hotels (Blank clean start)
  const [hotels, setHotels] = useState<ItineraryHotel[]>([]);
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null);
  const [hotelForm, setHotelForm] = useState<ItineraryHotel>({
    hotelName: "",
    location: "",
    checkIn: "",
    checkOut: "",
    roomCategory: "Deluxe Room",
    mealPlan: "CP (Breakfast Included)",
    starRating: "3 Star",
    nights: 1,
    rooms: 1,
    ratePerNight: 0,
    price: 0,
    amenities: "",
  });

  // 5. Transports (Blank clean start)
  const [transports, setTransports] = useState<ItineraryTransport[]>([]);
  const [editingTransportIndex, setEditingTransportIndex] = useState<number | null>(null);
  const [transportForm, setTransportForm] = useState<ItineraryTransport>({
    date: "",
    vehicleType: "",
    route: "",
    pickupTime: "10:00 AM",
    dropoff: "",
    notes: "",
    vehiclesCount: 1,
    price: 0,
    inclusions: ["Driver Allowance", "Tolls & State Taxes", "Fuel Charges", "Parking Fees"],
  });

  // 6. Sightseeing / Activities (Blank clean start)
  const [sightseeings, setSightseeings] = useState<ItinerarySightseeing[]>([]);
  const [newSightseeing, setNewSightseeing] = useState<ItinerarySightseeing>({
    title: "",
    city: "",
    pax: 2,
    price: 0,
    notes: "",
  });

  // 7. Flights (Blank clean start)
  const [flights, setFlights] = useState<ItineraryFlight[]>([]);
  const [newFlight, setNewFlight] = useState<ItineraryFlight>({
    airline: "",
    flightNo: "",
    date: "",
    departure: "",
    arrival: "",
    pnr: "",
    baggage: "15 kg Check-in",
    price: 0,
  });

  // 8. Trains
  const [trains, setTrains] = useState<ItineraryTrain[]>([]);
  const [newTrain, setNewTrain] = useState<ItineraryTrain>({
    trainName: "",
    trainNo: "",
    route: "",
    date: "",
    travelClass: "2A",
    price: 0,
  });

  // 9. Custom Bookings & Services (Bus, Train, Ferry, Visa, Custom Entities)
  const [otherServices, setOtherServices] = useState<ItineraryService[]>([]);
  const [editingCustomIndex, setEditingCustomIndex] = useState<number | null>(null);
  const [customEntityForm, setCustomEntityForm] = useState<ItineraryService>({
    category: "Bus",
    title: "",
    details: "",
    quantity: "1",
    date: "",
    price: 0,
    notes: "",
  });

  // 10. Inclusions & Exclusions
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [clientNotes, setClientNotes] = useState("");

  // 11. Quotation Settings & Policies (WITHOUT AGENT PRICE)
  const [selectedTheme, setSelectedTheme] = useState<string>("teal");
  const [gstRate, setGstRate] = useState<number>(5); // 5% GST
  const [tcsRate, setTcsRate] = useState<number>(0); // 0%
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // States for save & generate
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState("");
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const wasDarkRef = useRef(false);

  // Auto-fit preview zoom based on device screen width
  useEffect(() => {
    if (showPreview) {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) {
          setPreviewZoom(55);
        } else if (window.innerWidth < 1024) {
          setPreviewZoom(75);
        } else {
          setPreviewZoom(85);
        }
      }
    }
  }, [showPreview]);

  useEffect(() => {
    document.body.style.overflow = isOpen || showPreview ? "hidden" : "unset";

    // "Create Itinerary" is strictly displayed in pure light mode
    if (isOpen || showPreview) {
      if (document.documentElement.classList.contains("dark")) {
        wasDarkRef.current = true;
        document.documentElement.classList.remove("dark");
      }
    } else {
      if (wasDarkRef.current) {
        document.documentElement.classList.add("dark");
        wasDarkRef.current = false;
      }
    }

    return () => {
      document.body.style.overflow = "unset";
      if (wasDarkRef.current) {
        document.documentElement.classList.add("dark");
        wasDarkRef.current = false;
      }
    };
  }, [isOpen, showPreview]);

  // Duration
  const duration = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return `${nights} Nights / ${nights + 1} Days`;
    }
    return days.length ? `${days.length} Days` : "Dates not set";
  }, [startDate, endDate, days.length]);

  const dateRange = useMemo(() => {
    if (startDate && endDate) {
      const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return `${fmt(startDate)} – ${fmt(endDate)}`;
    }
    return "Dates to be confirmed";
  }, [startDate, endDate]);

  // Calculations (WITHOUT AGENT PRICE - Direct transparent calculation from services + tax)
  const hotelsTotal = useMemo(() => hotels.reduce((sum, h) => sum + (Number(h.price) || 0), 0), [hotels]);
  const transportsTotal = useMemo(() => transports.reduce((sum, t) => sum + (Number(t.price) || 0), 0), [transports]);
  const sightseeingsTotal = useMemo(() => sightseeings.reduce((sum, s) => sum + (Number(s.price) || 0), 0), [sightseeings]);
  const flightsTotal = useMemo(() => flights.reduce((sum, f) => sum + (Number(f.price) || 0), 0), [flights]);
  const trainsTotal = useMemo(() => trains.reduce((sum, t) => sum + (Number(t.price) || 0), 0), [trains]);
  const otherTotal = useMemo(() => otherServices.reduce((sum, o) => sum + (Number(o.price) || 0), 0), [otherServices]);

  const subTotal = useMemo(
    () => hotelsTotal + transportsTotal + sightseeingsTotal + flightsTotal + trainsTotal + otherTotal,
    [hotelsTotal, transportsTotal, sightseeingsTotal, flightsTotal, trainsTotal, otherTotal]
  );

  const gstAmount = useMemo(() => Math.round((subTotal * gstRate) / 100), [subTotal, gstRate]);
  const tcsAmount = useMemo(() => Math.round((subTotal * tcsRate) / 100), [subTotal, tcsRate]);

  // Final Quotation Total
  const finalQuotationTotal = useMemo(() => {
    const tot = subTotal + gstAmount + tcsAmount - (Number(discountAmount) || 0);
    return Math.max(0, tot);
  }, [subTotal, gstAmount, tcsAmount, discountAmount]);

  // Breakdown metrics for top summary bar matching screenshot
  const numAdults = Math.max(1, parseInt(adults) || 1);
  const numChildren = parseInt(children) || 0;
  const adultProportion = numAdults / (numAdults + numChildren * 0.7 || 1);
  const adultMetric = useMemo(() => {
    if (finalQuotationTotal === 0) return 0;
    const share = Math.round(finalQuotationTotal * adultProportion);
    return share;
  }, [finalQuotationTotal, adultProportion]);

  const childMetric = useMemo(() => {
    if (finalQuotationTotal === 0 || numChildren === 0) return 0;
    return finalQuotationTotal - adultMetric;
  }, [finalQuotationTotal, adultMetric, numChildren]);

  // Day handlers
  const handleSaveDay = () => {
    if (!newDayTitle.trim()) {
      toast.error("Please enter a day title");
      return;
    }

    if (editingDayIndex !== null) {
      const updated = [...days];
      updated[editingDayIndex] = {
        ...updated[editingDayIndex],
        day: newDayNumber,
        destination: newDayDestination,
        title: newDayTitle,
        activities: newDayTitle,
        description: newDayDescription,
        images: newDayImageUrl ? [newDayImageUrl] : updated[editingDayIndex].images,
      };
      setDays(updated);
      setEditingDayIndex(null);
      toast.success(`Day ${newDayNumber} updated`);
    } else {
      const newDay: DetailedItineraryDay = {
        day: days.length + 1,
        destination: newDayDestination,
        title: newDayTitle,
        activities: newDayTitle,
        description: newDayDescription,
        images: newDayImageUrl ? [newDayImageUrl] : [],
      };
      setDays([...days, newDay]);
      toast.success(`Day ${newDay.day} added`);
    }

    setNewDayTitle("");
    setNewDayDescription("");
    setNewDayImageUrl("");
    setNewDayDestination("");
    setNewDayNumber(days.length + 2);
  };

  const handleEditDay = (idx: number) => {
    const d = days[idx];
    setEditingDayIndex(idx);
    setNewDayNumber(d.day);
    setNewDayDestination(d.destination || destination || "");
    setNewDayTitle(d.title);
    setNewDayDescription(d.description);
    setNewDayImageUrl(d.images[0] || "");
    setSectionsOpen((p) => ({ ...p, itinerary: true }));
  };

  const handleRemoveDay = (idx: number) => {
    const updated = days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
    setDays(updated);
    toast.info("Day removed");
  };

  // Helper to read file as optimized Base64 Data URL purely in the frontend (never calls backend upload)
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.88));
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Image Upload helper (Pure frontend: converts directly to Data URL for instant display & PDF generation)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setNewDayImageUrl(dataUrl);
      toast.success("Photo loaded for itinerary day");
    } catch (err) {
      console.error("Error reading image:", err);
      toast.error("Failed to process image file");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  // Hotel calculation helpers & handlers
  const calculateHotelNights = (inDate?: string, outDate?: string): number => {
    if (!inDate || !outDate) return 1;
    const d1 = new Date(inDate);
    const d2 = new Date(outDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const handleHotelDateChange = (field: 'checkIn' | 'checkOut', value: string) => {
    const updatedIn = field === 'checkIn' ? value : hotelForm.checkIn;
    const updatedOut = field === 'checkOut' ? value : hotelForm.checkOut;
    const n = calculateHotelNights(updatedIn, updatedOut);
    const r = hotelForm.rooms || 1;
    const rate = hotelForm.ratePerNight || 0;
    const newPrice = rate > 0 ? rate * n * r : hotelForm.price;

    setHotelForm({
      ...hotelForm,
      [field]: value,
      nights: n,
      price: newPrice,
    });
  };

  const handleHotelNightsChange = (nights: number) => {
    const validN = Math.max(1, nights);
    const r = hotelForm.rooms || 1;
    const rate = hotelForm.ratePerNight || 0;
    const newPrice = rate > 0 ? rate * validN * r : hotelForm.price;

    setHotelForm({
      ...hotelForm,
      nights: validN,
      price: newPrice,
    });
  };

  const handleHotelRoomsChange = (rooms: number) => {
    const validR = Math.max(1, rooms);
    const n = hotelForm.nights || 1;
    const rate = hotelForm.ratePerNight || 0;
    const newPrice = rate > 0 ? rate * n * validR : hotelForm.price;

    setHotelForm({
      ...hotelForm,
      rooms: validR,
      price: newPrice,
    });
  };

  const handleHotelRateChange = (rate: number) => {
    const n = hotelForm.nights || 1;
    const r = hotelForm.rooms || 1;
    const newPrice = Math.max(0, rate * n * r);

    setHotelForm({
      ...hotelForm,
      ratePerNight: rate,
      price: newPrice,
    });
  };

  const handleHotelTotalCostChange = (total: number) => {
    const n = hotelForm.nights || 1;
    const r = hotelForm.rooms || 1;
    const newRate = total > 0 && n * r > 0 ? Math.round(total / (n * r)) : hotelForm.ratePerNight;

    setHotelForm({
      ...hotelForm,
      price: total,
      ratePerNight: newRate,
    });
  };

  // Hotel handlers
  const handleSaveHotel = () => {
    if (!hotelForm.hotelName.trim()) {
      toast.error("Please enter Hotel Name");
      return;
    }
    const n = hotelForm.nights || calculateHotelNights(hotelForm.checkIn, hotelForm.checkOut);
    const r = hotelForm.rooms || 1;
    const rate = hotelForm.ratePerNight || 0;
    const finalPrice = hotelForm.price !== undefined && hotelForm.price > 0 ? hotelForm.price : (rate * n * r);

    const savedHotel: ItineraryHotel = {
      ...hotelForm,
      nights: n,
      rooms: r,
      ratePerNight: rate,
      price: finalPrice,
    };

    if (editingHotelIndex !== null) {
      const updated = [...hotels];
      updated[editingHotelIndex] = savedHotel;
      setHotels(updated);
      setEditingHotelIndex(null);
      toast.success("Hotel updated");
    } else {
      setHotels([...hotels, { ...savedHotel, id: `h-${Date.now()}` }]);
      toast.success("Hotel added");
    }
    setHotelForm({
      hotelName: "",
      location: destination || "",
      checkIn: startDate || "",
      checkOut: endDate || "",
      roomCategory: "Deluxe Room",
      mealPlan: "CP (Breakfast Included)",
      starRating: "3 Star",
      nights: 1,
      rooms: 1,
      ratePerNight: 0,
      price: 0,
      amenities: "",
    });
  };

  const handleEditHotel = (idx: number) => {
    setEditingHotelIndex(idx);
    const h = hotels[idx];
    const n = h.nights || calculateHotelNights(h.checkIn, h.checkOut);
    const r = h.rooms || 1;
    const rate = h.ratePerNight || (h.price ? Math.round(h.price / (n * r)) : 0);
    setHotelForm({
      ...h,
      nights: n,
      rooms: r,
      ratePerNight: rate,
      price: h.price || (rate * n * r),
    });
    setSectionsOpen((p) => ({ ...p, hotels: true }));
  };

  const handleRemoveHotel = (idx: number) => {
    setHotels(hotels.filter((_, i) => i !== idx));
  };

  // Transport handlers
  const handleSaveTransport = () => {
    if (!transportForm.vehicleType.trim()) {
      toast.error("Please specify Vehicle Type");
      return;
    }
    if (editingTransportIndex !== null) {
      const updated = [...transports];
      updated[editingTransportIndex] = { ...transportForm };
      setTransports(updated);
      setEditingTransportIndex(null);
      toast.success("Transport updated");
    } else {
      setTransports([...transports, { ...transportForm, id: `t-${Date.now()}` }]);
      toast.success("Transport added");
    }
    setTransportForm({
      date: startDate || "",
      vehicleType: "",
      route: "",
      pickupTime: "10:00 AM",
      dropoff: "",
      notes: "",
      vehiclesCount: 1,
      price: 0,
      inclusions: ["Driver Allowance", "Tolls & State Taxes", "Fuel Charges", "Parking Fees"],
    });
  };

  const handleEditTransport = (idx: number) => {
    setEditingTransportIndex(idx);
    setTransportForm(transports[idx]);
    setSectionsOpen((p) => ({ ...p, transport: true }));
  };

  const handleRemoveTransport = (idx: number) => {
    setTransports(transports.filter((_, i) => i !== idx));
  };

  // PDF Data Bundle
  const pdfData: ItineraryPdfData = useMemo(
    () => ({
      quotationRef,
      quotationDate,
      clientName,
      tripTitle,
      destination,
      startDate,
      endDate,
      adults,
      children,
      theme,
      finalRate: String(finalQuotationTotal),
      heroImage: heroImage || (days.find((d) => d.images && d.images[0]?.trim())?.images[0]) || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600",
      days,
      flights,
      hotels,
      transports,
      customServices: otherServices,
      inclusions,
      exclusions,
      clientNotes,
      duration,
      dateRange,
    }),
    [
      clientName,
      tripTitle,
      destination,
      startDate,
      endDate,
      adults,
      children,
      theme,
      finalQuotationTotal,
      heroImage,
      days,
      flights,
      hotels,
      transports,
      otherServices,
      inclusions,
      exclusions,
      clientNotes,
      duration,
      dateRange,
    ]
  );

  // Save Quotation / Draft to API
  const handleSave = async () => {
    if (!clientName || !tripTitle) {
      toast.error("Please fill in Client Name and Trip Title");
      return;
    }
    setIsSaving(true);
    try {
      await api.post("/api/itineraries/create.php", {
        client_name: clientName,
        trip_title: tripTitle,
        destination,
        start_date: startDate || null,
        end_date: endDate || null,
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        theme,
        final_rate: finalQuotationTotal,
        days,
        hotels,
        transports,
        flights,
        sightseeings,
        other_services: otherServices,
        inclusions: inclusions.filter((i) => i.trim()),
        exclusions: exclusions.filter((e) => e.trim()),
        client_notes: clientNotes,
      });
      setIsSaved(true);
      toast.success("Draft quotation saved successfully!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF - Optimized for speed, reliability and crisp resolution
  const generatePDF = async (): Promise<string | null> => {
    if (!pdfRef.current) return null;
    setIsGenerating(true);
    setGeneratingProgress("Preparing document…");
    const toastId = toast.loading("Generating Quotation PDF…");

    try {
      // 1. Fast image pre-check (racing decode with short timeout to prevent broken URLs from hanging)
      const allImgs = Array.from(pdfRef.current.querySelectorAll("img"));
      await Promise.all(
        allImgs.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve(true);
          return Promise.race([
            img.decode ? img.decode().then(() => true).catch(() => true) : Promise.resolve(true),
            new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
              setTimeout(() => resolve(true), 400);
            }),
          ]);
        })
      );

      const pages = Array.from(pdfRef.current.querySelectorAll("[data-pdf-page]")) as HTMLElement[];
      if (!pages.length) throw new Error("No pages found in itinerary document.");

      const totalPages = pages.length;
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });

      // 2. High-speed concurrent rendering (render in chunks of 3 for multi-core parallelism)
      const BATCH_SIZE = 3;
      const renderedCanvases: { index: number; dataUrl: string }[] = [];

      for (let batchStart = 0; batchStart < totalPages; batchStart += BATCH_SIZE) {
        const currentBatch = pages.slice(batchStart, batchStart + BATCH_SIZE);
        setGeneratingProgress(`Rendering pages ${batchStart + 1}–${Math.min(batchStart + BATCH_SIZE, totalPages)} of ${totalPages}…`);

        const batchResults = await Promise.all(
          currentBatch.map(async (page, offset) => {
            const pageIndex = batchStart + offset;
            const canvas = await html2canvas(page, {
              scale: 1.6, // High-DPI 160 DPI output: razor-sharp typography, ~50% faster than 2.2
              useCORS: true,
              logging: false,
              backgroundColor: "#ffffff",
              width: page.offsetWidth || 794,
              height: page.offsetHeight || 1123,
              windowWidth: 794,
              removeContainer: true,
              imageTimeout: 2000,
            });

            return {
              index: pageIndex,
              dataUrl: canvas.toDataURL("image/jpeg", 0.88),
            };
          })
        );
        renderedCanvases.push(...batchResults);
      }

      setGeneratingProgress("Assembling PDF…");

      // 3. Assemble PDF in exact page order
      renderedCanvases.sort((a, b) => a.index - b.index);
      for (let i = 0; i < renderedCanvases.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(renderedCanvases[i].dataUrl, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }

      const filename = `${(clientName || "Quotation").replace(/\s+/g, "_")}_${(tripTitle || "Itinerary").slice(0, 30).replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);
      toast.success("Quotation PDF downloaded!", { id: toastId });
      return filename;
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
      return null;
    } finally {
      setIsGenerating(false);
      setGeneratingProgress("");
    }
  };

  // Share message composer for WhatsApp respecting rateDisplayMode
  const getShareText = () => {
    const itemizedRates =
      rateDisplayMode === "full"
        ? `\n📊 *Rate Breakdown:*
🏨 Hotels: ₹${hotelsTotal.toLocaleString("en-IN")}
🚗 Transport: ₹${transportsTotal.toLocaleString("en-IN")}${
            flightsTotal > 0 ? `\n✈️ Flight/Airfare: ₹${flightsTotal.toLocaleString("en-IN")}` : ""
          }${sightseeingsTotal > 0 ? `\n🎯 Sightseeing: ₹${sightseeingsTotal.toLocaleString("en-IN")}` : ""}${otherServices.length > 0 ? otherServices.map(s => `\n🏷️ ${s.category ? `[${s.category}] ` : ""}${s.title}: ₹${(Number(s.price) || 0).toLocaleString("en-IN")}`).join("") : ""}`
        : "";

    return `*Quotation for ${tripTitle || "Travel Package"}*
👤 *Client:* ${clientName || "Valued Client"}
📍 *Destination:* ${destination || "Not specified"}
🗓️ *Duration:* ${duration} (${dateRange})
👥 *Pax:* ${adults} Adults${parseInt(children) > 0 ? `, ${children} Child` : ""}${itemizedRates}

💰 *Quotation Total:* ₹${finalQuotationTotal.toLocaleString("en-IN")}
(Inclusive of all specified services & applicable GST)

Thank you for choosing ${user?.company_name || "us"}!`;
  };

  const handleWhatsAppShare = async () => {
    const filename = await generatePDF();

    const baseText = getShareText();
    const pdfNote = filename 
      ? `\n\n📄 *I have attached your customized Quotation PDF (${filename}) above.*`
      : "";
    const text = encodeURIComponent(baseText + pdfNote);
    const phone = clientPhone.replace(/\D/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    
    window.open(url, "_blank");
    toast.success(
      phone 
        ? `Quotation PDF downloaded! WhatsApp chat opened with ${clientName || "client"} (${phone}). Simply attach the downloaded PDF file.` 
        : "Quotation PDF downloaded! WhatsApp opened. Please attach the downloaded PDF file to your chat."
    );
  };

  const triggerElement = trigger ? (
    <div onClick={() => setIsOpen(true)} className={cn("inline-flex", className)}>
      {trigger}
    </div>
  ) : (
    <Button
      onClick={() => setIsOpen(true)}
      className={cn("bg-teal-700 hover:bg-teal-800 text-white gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl shadow-md shadow-teal-900/10 font-medium transition-all", className)}
    >
      <FileText className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
      <span>Create Itinerary</span>
    </Button>
  );

  return (
    <>
      {triggerElement}

      {isOpen && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col w-screen max-w-[100vw] h-[100dvh] overflow-hidden force-light">
        {/* --- 1. TOP HEADER & NAVBAR MATCHING SCREENSHOT --- */}
        <header className="shrink-0 bg-white border-b border-slate-200 shadow-sm z-30">
          <div className="h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
            {/* Left brand & title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">Create Quotation</h1>
                  <span className={cn(
                    "hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border",
                    isSaved
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {isSaved ? "Saved" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Ref: #{quotationRef}</span>
                  <span>•</span>
                  <span>Date: {quotationDate}</span>
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 h-9"
              >
                <Eye className="w-4 h-4 text-teal-600" />
                <span>Preview PDF</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsAppShare}
                disabled={isGenerating}
                className="rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 gap-1.5 h-9 font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{generatingProgress || "Generating PDF…"}</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
                    <span>WhatsApp</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white gap-1.5 h-9 px-4 font-semibold shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? "Saving…" : "Save Draft"}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 ml-1"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Actions Toggle */}
            <div className="flex lg:hidden items-center gap-1.5">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-teal-700 hover:bg-teal-800 text-white h-9 px-3 rounded-lg text-xs"
              >
                {isSaving ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-600"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-100 px-4 py-3 bg-white space-y-2 animate-in slide-in-from-top-1">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="w-full gap-1.5">
                  <Eye className="w-4 h-4 text-teal-600" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={generatePDF} disabled={isGenerating} className="w-full gap-1.5">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4 text-blue-600" />}
                  <span>{isGenerating ? "Exporting…" : "Export PDF"}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleWhatsAppShare} disabled={isGenerating} className="w-full col-span-2 gap-1.5 text-emerald-700 bg-emerald-50/50">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <MessageCircle className="w-4 h-4" />}
                  <span>{isGenerating ? "Generating PDF…" : "WhatsApp"}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="w-full text-slate-500">
                Close Studio
              </Button>
            </div>
          )}
        </header>

        {/* --- 2. MAIN SCROLLABLE CONTENT AREA --- */}
        <ScrollArea className="flex-1 w-full">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
            {/* --- TOP SUMMARY BAR (QUOTATION TOTAL) EXACT MATCH TO SCREENSHOT --- */}
            <Card className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quotation Total</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    ₹{finalQuotationTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Inclusive of all services, transfers & applicable taxes</p>
              </div>

              {/* Metric stats badges on right */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[90px]">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Adult</p>
                  <p className="text-sm font-bold text-slate-800">₹{adultMetric.toLocaleString("en-IN")}</p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[90px]">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Child</p>
                  <p className="text-sm font-bold text-slate-800">₹{childMetric.toLocaleString("en-IN")}</p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[80px]">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Infant</p>
                  <p className="text-sm font-bold text-slate-800">₹0</p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-teal-50/60 border border-teal-100 text-center min-w-[80px]">
                  <p className="text-[10px] uppercase font-bold text-teal-600">GST</p>
                  <p className="text-sm font-bold text-teal-800">{gstRate}%</p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-teal-50/60 border border-teal-100 text-center min-w-[80px]">
                  <p className="text-[10px] uppercase font-bold text-teal-600">TCS</p>
                  <p className="text-sm font-bold text-teal-800">{tcsRate}%</p>
                </div>
              </div>
            </Card>

            {/* --- CARD 1: CUSTOMER DETAILS --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("customer")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Customer Details</h2>
                    <p className="text-xs text-slate-400">Client and Pax information</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.customer ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.customer && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Select Customer</Label>
                    <Input
                      placeholder="Search existing customer or enter details below..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-10 rounded-xl bg-slate-50/50 border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Full Name</Label>
                      <Input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Email Address</Label>
                      <Input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Phone / WhatsApp</Label>
                      <Input
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">City / Address</Label>
                      <Input
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="e.g. Mumbai, India"
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Pax Details Box */}
                  <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Pax Details</h3>
                        <p className="text-xs text-slate-500">Detailed Pax breakdown for quotation</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPax(!isEditingPax)}
                        className="text-xs text-sky-700 hover:text-sky-800 hover:bg-sky-100/60 font-semibold h-8"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        {isEditingPax ? "Done" : "Edit Pax"}
                      </Button>
                    </div>

                    {isEditingPax ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Adults (12+ yrs)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={adults}
                            onChange={(e) => setAdults(e.target.value)}
                            className="h-9 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Children (2-11 yrs)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={children}
                            onChange={(e) => setChildren(e.target.value)}
                            className="h-9 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Infants (&lt;2 yrs)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={infants}
                            onChange={(e) => setInfants(e.target.value)}
                            className="h-9 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Rooms Required</Label>
                          <Input
                            type="number"
                            min="1"
                            value={roomsCount}
                            onChange={(e) => setRoomsCount(e.target.value)}
                            className="h-9 bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Adults</span>
                          <span className="text-sm font-bold text-slate-800">{adults} Adults</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Children</span>
                          <span className="text-sm font-bold text-slate-800">{children} Children</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Infants</span>
                          <span className="text-sm font-bold text-slate-800">{infants} Infants</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Rooms</span>
                          <span className="text-sm font-bold text-slate-800">{roomsCount} Room</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- CARD 2: PACKAGE OVERVIEW --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("package")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Package Overview</h2>
                    <p className="text-xs text-slate-400">Duration, destination, and package type</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.package ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.package && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-5">
                  {/* Segmented control: Full Package vs Customized */}
                  <div className="flex p-1 rounded-xl bg-slate-100 w-fit">
                    {(["Full Package", "Customized"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPackageType(type)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                          packageType === type ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Package / Trip Title</Label>
                      <Input
                        value={tripTitle}
                        onChange={(e) => setTripTitle(e.target.value)}
                        placeholder="e.g. 5 Days Kashmir Paradise Tour"
                        className="h-10 rounded-xl border-slate-200 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Primary Destination</Label>
                      <Input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Kashmir / Dubai / Kerala"
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Travel Style / Theme</Label>
                      <Input
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="Luxury / Honeymoon / Family / Adventure"
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 w-fit">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>Calculated Duration: {duration} ({dateRange})</span>
                  </div>

                  {/* Quotation Cover Photo (Travel Background) */}
                  <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-teal-600" />
                          <span>Quotation Cover Photo (Travel Wallpaper)</span>
                        </Label>
                        <p className="text-[11px] text-slate-500">
                          Select a travel destination wallpaper or enter your custom image URL
                        </p>
                      </div>
                      {heroImage && (
                        <button
                          type="button"
                          onClick={() => setHeroImage("")}
                          className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
                        >
                          Reset Default
                        </button>
                      )}
                    </div>

                    {/* Quick 1-Click Travel Wallpaper Presets */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        {
                          id: "beach",
                          name: "Tropical Beach",
                          icon: "🏖️",
                          url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600",
                        },
                        {
                          id: "maldives",
                          name: "Luxury Resort",
                          icon: "🏝️",
                          url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=1600",
                        },
                        {
                          id: "mountains",
                          name: "Hills & Mountains",
                          icon: "🏔️",
                          url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1600",
                        },
                        {
                          id: "dubai",
                          name: "Dubai Skyline",
                          icon: "🏙️",
                          url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1600",
                        },
                        {
                          id: "heritage",
                          name: "Europe / Heritage",
                          icon: "🏛️",
                          url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=1600",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setHeroImage(preset.url)}
                          className={cn(
                            "flex items-center gap-1.5 p-2 rounded-lg border text-xs font-semibold text-left transition-all",
                            heroImage === preset.url
                              ? "bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <span className="text-base">{preset.icon}</span>
                          <span className="truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom Image URL input */}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        placeholder="Paste custom travel image URL (or click any preset above)..."
                        className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                      />
                      {heroImage && (
                        <div className="w-12 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          <img src={heroImage} alt="Cover preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* --- CARD 3: ITINERARY DETAILS (DAY WISE) --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("itinerary")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Itinerary Details</h2>
                    <p className="text-xs text-slate-400">Day-wise plan with sightseeing & stay</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.itinerary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.itinerary && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-6">
                  {/* Form to add or edit a day */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {editingDayIndex !== null ? `Edit Day ${newDayNumber}` : "+ Add Day Itinerary"}
                      </span>
                      {editingDayIndex !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDayIndex(null);
                            setNewDayTitle("");
                            setNewDayDescription("");
                            setNewDayImageUrl("");
                            setNewDayDestination("");
                          }}
                          className="text-xs text-rose-600 font-semibold hover:underline"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Day Number</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newDayNumber}
                          onChange={(e) => setNewDayNumber(parseInt(e.target.value) || 1)}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-bold text-slate-600">Destination / City</Label>
                        <Input
                          value={newDayDestination}
                          onChange={(e) => setNewDayDestination(e.target.value)}
                          placeholder="e.g. Srinagar, Paris, Bali"
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Day Title / Headline</Label>
                      <Input
                        value={newDayTitle}
                        onChange={(e) => setNewDayTitle(e.target.value)}
                        placeholder="e.g. Arrival & Evening City Walk"
                        className="h-10 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Day Description / Activities</Label>
                      <Textarea
                        rows={3}
                        value={newDayDescription}
                        onChange={(e) => setNewDayDescription(e.target.value)}
                        placeholder="Detailed itinerary points, sightseeing attractions, and activity breakdown..."
                        className="bg-white resize-none text-sm"
                      />
                    </div>

                    {/* Image Upload Box Matching Screenshot */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-600">Day Image</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-white text-center flex flex-col items-center justify-center gap-2 hover:border-teal-400 transition-colors">
                        {newDayImageUrl ? (
                          <div className="relative w-full max-w-xs h-32 rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={newDayImageUrl} alt="Day preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewDayImageUrl("")}
                              className="absolute top-2 right-2 bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-full text-xs opacity-90 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-xs text-slate-500">
                              <label className="font-semibold text-teal-700 hover:text-teal-800 cursor-pointer">
                                <span>Browse or drop image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFileUpload}
                                  disabled={isUploadingImage}
                                />
                              </label>
                              <span className="block text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 5MB</span>
                            </div>
                            <div className="w-full max-w-sm flex items-center gap-2 mt-1">
                              <Input
                                placeholder="Or paste image URL (https://...)"
                                value={newDayImageUrl}
                                onChange={(e) => setNewDayImageUrl(e.target.value)}
                                className="h-8 text-xs bg-slate-50 border-slate-200"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Full width Teal button matching screenshot */}
                    <Button
                      type="button"
                      onClick={handleSaveDay}
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 rounded-xl shadow-sm transition-all"
                    >
                      {editingDayIndex !== null ? "Update Day Itinerary" : "+ Add Day to Itinerary"}
                    </Button>
                  </div>

                  {/* List of Added Days matching screenshot */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Added Days ({days.length})
                    </p>

                    {days.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No days added yet. Fill in the form above and click "+ Add Day to Itinerary".
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {days.map((day, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {day.images[0] ? (
                                <img
                                  src={day.images[0]}
                                  alt=""
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-100 shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 font-bold">
                                  D{day.day}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                                    Day {day.day}
                                  </span>
                                  {day.destination && (
                                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      {day.destination}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 truncate mt-1">{day.title}</h4>
                                <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                                  {day.activities || day.description?.replace(/\n/g, " ")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditDay(idx)}
                                className="h-8 w-8 text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveDay(idx)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- CARD 4: HOTELS DETAILS --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("hotels")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Hotels Details</h2>
                    <p className="text-xs text-slate-400">Accommodation, check-in, nights & meal</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.hotels ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.hotels && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-6">
                  {/* Add / Edit Hotel Form */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {editingHotelIndex !== null ? "Edit Hotel" : "+ Add Hotel"}
                      </span>
                      {editingHotelIndex !== null && (
                        <button
                          type="button"
                          onClick={() => setEditingHotelIndex(null)}
                          className="text-xs text-rose-600 font-semibold hover:underline"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-600">Search Hotel</Label>
                      <Input
                        placeholder="Search Hotel by name..."
                        value={hotelForm.hotelName}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotelName: e.target.value })}
                        className="h-10 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">City / Location</Label>
                        <Input
                          placeholder="e.g. City / Area"
                          value={hotelForm.location}
                          onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Room Category</Label>
                        <Input
                          placeholder="Deluxe Room / Suite"
                          value={hotelForm.roomCategory}
                          onChange={(e) => setHotelForm({ ...hotelForm, roomCategory: e.target.value })}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Meal Plan</Label>
                        <Input
                          placeholder="MAP / CP / EP / AP"
                          value={hotelForm.mealPlan}
                          onChange={(e) => setHotelForm({ ...hotelForm, mealPlan: e.target.value })}
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>

                    {/* Date / Room info box with Auto Calculation */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Check-in</Label>
                          <Input
                            type="date"
                            value={hotelForm.checkIn}
                            onChange={(e) => handleHotelDateChange('checkIn', e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Check-out</Label>
                          <Input
                            type="date"
                            value={hotelForm.checkOut}
                            onChange={(e) => handleHotelDateChange('checkOut', e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Nights / Days</Label>
                          <Input
                            type="number"
                            min="1"
                            value={hotelForm.nights || 1}
                            onChange={(e) => handleHotelNightsChange(parseInt(e.target.value) || 1)}
                            className="h-9 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">No. of Rooms</Label>
                          <Input
                            type="number"
                            min="1"
                            value={hotelForm.rooms || 1}
                            onChange={(e) => handleHotelRoomsChange(parseInt(e.target.value) || 1)}
                            className="h-9 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Rate / Room / Day (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 1500"
                            value={hotelForm.ratePerNight || ""}
                            onChange={(e) => handleHotelRateChange(parseFloat(e.target.value) || 0)}
                            className="h-9 text-xs font-semibold text-blue-700 bg-blue-50/40 border-blue-200"
                          />
                        </div>
                      </div>

                      {/* Auto Calculation Result Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100 bg-slate-50/60 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-500">Auto Calc:</span>
                          <span className="font-bold text-blue-700">₹{(hotelForm.ratePerNight || 0).toLocaleString("en-IN")}</span>
                          <span>×</span>
                          <span className="font-semibold text-slate-700">{hotelForm.nights || 1} Night(s)</span>
                          <span>×</span>
                          <span className="font-semibold text-slate-700">{hotelForm.rooms || 1} Room(s)</span>
                          <span>=</span>
                          <span className="font-black text-teal-800">
                            ₹{(((hotelForm.ratePerNight || 0) * (hotelForm.nights || 1) * (hotelForm.rooms || 1))).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Hotel Total Cost (₹):
                          </Label>
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-700">₹</span>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={hotelForm.price || ""}
                              onChange={(e) => handleHotelTotalCostChange(parseFloat(e.target.value) || 0)}
                              className="h-9 pl-6 text-sm font-black text-teal-800 bg-white border-teal-300 shadow-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Amenities / Inclusions Notes</Label>
                      <Input
                        placeholder="Free Wi-Fi, Welcome Drink, Valley View, Breakfast included"
                        value={hotelForm.amenities || ""}
                        onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                        className="h-10 bg-white text-xs"
                      />
                    </div>

                    {/* Teal button matching screenshot */}
                    <Button
                      type="button"
                      onClick={handleSaveHotel}
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 rounded-xl shadow-sm transition-all"
                    >
                      {editingHotelIndex !== null ? "Update Hotel" : "+ Add Hotel"}
                    </Button>
                  </div>

                  {/* Added Hotels list */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Added Hotels ({hotels.length})
                    </p>

                    {hotels.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No hotels added yet. Fill in the form above and click "+ Add Hotel".
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {hotels.map((h, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{h.hotelName}</span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                                  {h.starRating || "Hotel"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{h.location}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                                  {h.checkIn || "—"} to {h.checkOut || "—"} ({h.nights || 1} Nights)
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">{h.rooms || 1} Room(s)</span>
                                {h.ratePerNight ? (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                    ₹{h.ratePerNight.toLocaleString("en-IN")}/day
                                  </span>
                                ) : null}
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">{h.roomCategory}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">{h.mealPlan}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Cost</p>
                                <p className="text-sm font-bold text-teal-800">₹{(h.price || 0).toLocaleString("en-IN")}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditHotel(idx)}
                                  className="h-8 w-8 text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveHotel(idx)}
                                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- CARD 5: TRANSPORT DETAILS --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("transport")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Transport Details</h2>
                    <p className="text-xs text-slate-400">Transfers, vehicles & cabs</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.transport ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.transport && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-6">
                  {/* Transport Form */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {editingTransportIndex !== null ? "Edit Transport" : "+ Add Transport"}
                      </span>
                      {editingTransportIndex !== null && (
                        <button
                          type="button"
                          onClick={() => setEditingTransportIndex(null)}
                          className="text-xs text-rose-600 font-semibold hover:underline"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-bold text-slate-600">Vehicle Type</Label>
                        <Input
                          placeholder="e.g. Sedan / Innova Crysta / Tempo Traveller"
                          value={transportForm.vehicleType}
                          onChange={(e) => setTransportForm({ ...transportForm, vehicleType: e.target.value })}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">No. of Vehicles</Label>
                        <Input
                          type="number"
                          min="1"
                          value={transportForm.vehiclesCount || 1}
                          onChange={(e) => setTransportForm({ ...transportForm, vehiclesCount: parseInt(e.target.value) || 1 })}
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Route / Journey Coverage</Label>
                        <Input
                          placeholder="e.g. Airport -> Hotel -> Sightseeing"
                          value={transportForm.route}
                          onChange={(e) => setTransportForm({ ...transportForm, route: e.target.value })}
                          className="h-10 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Pickup Date & Time</Label>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={transportForm.date}
                            onChange={(e) => setTransportForm({ ...transportForm, date: e.target.value })}
                            className="h-10 bg-white text-xs flex-1"
                          />
                          <Input
                            placeholder="Time (10:00 AM)"
                            value={transportForm.pickupTime}
                            onChange={(e) => setTransportForm({ ...transportForm, pickupTime: e.target.value })}
                            className="h-10 bg-white text-xs w-28"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inclusions badges / checks */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Included Services</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Driver Allowance", "Tolls & State Taxes", "Fuel Charges", "Parking Fees"].map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Total Transport Cost (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Price in ₹"
                          value={transportForm.price || ""}
                          onChange={(e) => setTransportForm({ ...transportForm, price: parseFloat(e.target.value) || 0 })}
                          className="h-10 bg-white font-bold text-teal-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Notes / Remarks</Label>
                        <Input
                          placeholder="Chauffeur allowance, AC status, etc."
                          value={transportForm.notes}
                          onChange={(e) => setTransportForm({ ...transportForm, notes: e.target.value })}
                          className="h-10 bg-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Full width Teal button matching screenshot */}
                    <Button
                      type="button"
                      onClick={handleSaveTransport}
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 rounded-xl shadow-sm transition-all"
                    >
                      {editingTransportIndex !== null ? "Update Transport" : "+ Add Transport"}
                    </Button>
                  </div>

                  {/* Added Transports list */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Added Transport ({transports.length})
                    </p>

                    {transports.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No transport added yet. Fill in the form above and click "+ Add Transport".
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {transports.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{t.vehicleType}</span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                  {t.vehiclesCount || 1} Vehicle
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">{t.route}</p>
                              <p className="text-[11px] text-slate-400">
                                Pickup: {t.date || "—"} at {t.pickupTime || "—"} · {t.notes}
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Cost</p>
                                <p className="text-sm font-bold text-teal-800">₹{(t.price || 0).toLocaleString("en-IN")}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTransport(idx)}
                                  className="h-8 w-8 text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveTransport(idx)}
                                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- ACCORDION 1: SIGHTSEEING / ACTIVITIES --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("sightseeing")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Sightseeing & Activities</h2>
                    <p className="text-xs text-slate-400">Day-wise attractions, entry tickets & tours</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.sightseeing ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.sightseeing && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
                  {/* Add Sightseeing Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Activity / Ticket Name</Label>
                      <Input
                        placeholder="e.g. City Guided Tour / Museum Passes"
                        value={newSightseeing.title}
                        onChange={(e) => setNewSightseeing({ ...newSightseeing, title: e.target.value })}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Location / City</Label>
                      <Input
                        placeholder="City"
                        value={newSightseeing.city}
                        onChange={(e) => setNewSightseeing({ ...newSightseeing, city: e.target.value })}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Total Price (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newSightseeing.price || ""}
                        onChange={(e) => setNewSightseeing({ ...newSightseeing, price: parseFloat(e.target.value) || 0 })}
                        className="h-9 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!newSightseeing.title.trim()) return;
                          setSightseeings([...sightseeings, { ...newSightseeing, id: `s-${Date.now()}` }]);
                          setNewSightseeing({ title: "", city: destination || "", pax: 2, price: 0, notes: "" });
                          toast.success("Activity added");
                        }}
                        className="bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs"
                      >
                        + Add Activity
                      </Button>
                    </div>
                  </div>

                  {/* Sightseeing List */}
                  <div className="space-y-2">
                    {sightseeings.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">No sightseeing or activities added yet.</p>
                    ) : (
                      sightseeings.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{s.title}</p>
                            <p className="text-slate-400">{s.city} · {s.notes || "Included"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-teal-800">₹{(s.price || 0).toLocaleString("en-IN")}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSightseeings(sightseeings.filter((_, i) => i !== idx))}
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- ACCORDION 2: FLIGHTS --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("flights")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Flights</h2>
                    <p className="text-xs text-slate-400">Flight schedules and PNR</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.flights ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.flights && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
                  {/* Flight Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Airline & Flight No.</Label>
                      <Input
                        placeholder="e.g. Indigo 6E-204"
                        value={newFlight.flightNo}
                        onChange={(e) => setNewFlight({ ...newFlight, flightNo: e.target.value })}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Departure</Label>
                      <Input
                        placeholder="Airport · Time"
                        value={newFlight.departure}
                        onChange={(e) => setNewFlight({ ...newFlight, departure: e.target.value })}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Arrival</Label>
                      <Input
                        placeholder="Airport · Time"
                        value={newFlight.arrival}
                        onChange={(e) => setNewFlight({ ...newFlight, arrival: e.target.value })}
                        className="h-9 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Fare in ₹</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newFlight.price || ""}
                        onChange={(e) => setNewFlight({ ...newFlight, price: parseFloat(e.target.value) || 0 })}
                        className="h-9 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!newFlight.flightNo.trim()) return;
                          setFlights([...flights, { ...newFlight, id: `f-${Date.now()}` }]);
                          setNewFlight({ airline: "", flightNo: "", date: "", departure: "", arrival: "", pnr: "", baggage: "15 kg", price: 0 });
                          toast.success("Flight added");
                        }}
                        className="bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs"
                      >
                        + Add Flight
                      </Button>
                    </div>
                  </div>

                  {/* Added Flights list */}
                  <div className="space-y-2">
                    {flights.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">No flights added yet.</p>
                    ) : (
                      flights.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">{f.airline || "Flight"} · {f.flightNo}</p>
                            <p className="text-slate-500">{f.departure} ➔ {f.arrival} · {f.baggage}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-teal-800">₹{(f.price || 0).toLocaleString("en-IN")}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setFlights(flights.filter((_, i) => i !== idx))}
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- ACCORDION 3: CUSTOM BOOKINGS & SERVICES (BUS, TRAIN, CUSTOM ENTITIES) --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("services")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">Custom Bookings & Services</h2>
                      {otherServices.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                          {otherServices.length} {otherServices.length === 1 ? "Item" : "Items"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Add custom entities like bus, train, ferry, visa, guide, activity & more</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.services ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.services && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
                  {/* Entity form */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {/* Quick Preset Selector */}
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Quick Select or Type Custom Entity:
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Bus", icon: "🚌" },
                          { label: "Train", icon: "🚆" },
                          { label: "Ferry / Boat", icon: "⛴️" },
                          { label: "Cruise", icon: "🛳️" },
                          { label: "Visa Fee", icon: "🛂" },
                          { label: "Travel Insurance", icon: "🛡️" },
                          { label: "Tour Guide", icon: "👤" },
                          { label: "Entry Permit", icon: "🎟️" },
                          { label: "Custom Entity", icon: "✨" },
                        ].map((preset) => {
                          const isSelected = (customEntityForm.category || "").toLowerCase() === preset.label.toLowerCase();
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setCustomEntityForm({ ...customEntityForm, category: preset.label })}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 border",
                                isSelected
                                  ? "bg-teal-700 text-white border-teal-700 font-semibold shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              <span>{preset.icon}</span>
                              <span>{preset.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Entity / Category Type</Label>
                        <Input
                          placeholder="e.g. Bus, Train, Visa, Ferry..."
                          value={customEntityForm.category || ""}
                          onChange={(e) => setCustomEntityForm({ ...customEntityForm, category: e.target.value })}
                          className="h-9 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Service / Booking Name</Label>
                        <Input
                          placeholder="e.g. AC Sleeper Bus, Vande Bharat Express, Dubai Visa..."
                          value={customEntityForm.title}
                          onChange={(e) => setCustomEntityForm({ ...customEntityForm, title: e.target.value })}
                          className="h-9 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Details / Route / PNR / Remarks</Label>
                        <Input
                          placeholder="e.g. Delhi to Manali · Seat 12,14 · Dep 08:30 PM"
                          value={customEntityForm.details || ""}
                          onChange={(e) => setCustomEntityForm({ ...customEntityForm, details: e.target.value })}
                          className="h-9 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Date (Optional)</Label>
                        <Input
                          type="date"
                          value={customEntityForm.date || ""}
                          onChange={(e) => setCustomEntityForm({ ...customEntityForm, date: e.target.value })}
                          className="h-9 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Qty / Pax</Label>
                        <Input
                          placeholder="e.g. 2 Tickets"
                          value={customEntityForm.quantity || ""}
                          onChange={(e) => setCustomEntityForm({ ...customEntityForm, quantity: e.target.value })}
                          className="h-9 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">Rate / Total Cost in ₹</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={customEntityForm.price || ""}
                          onChange={(e) =>
                            setCustomEntityForm({ ...customEntityForm, price: parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 bg-white text-xs font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        {editingCustomIndex !== null ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (!customEntityForm.title.trim()) {
                                  toast.error("Please enter a service or entity name");
                                  return;
                                }
                                const updated = [...otherServices];
                                updated[editingCustomIndex] = { ...customEntityForm };
                                setOtherServices(updated);
                                setEditingCustomIndex(null);
                                setCustomEntityForm({
                                  category: "Bus",
                                  title: "",
                                  details: "",
                                  quantity: "1",
                                  date: "",
                                  price: 0,
                                  notes: "",
                                });
                                toast.success("Custom service updated");
                              }}
                              className="bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs"
                            >
                              Update Entity
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCustomIndex(null);
                                setCustomEntityForm({
                                  category: "Bus",
                                  title: "",
                                  details: "",
                                  quantity: "1",
                                  date: "",
                                  price: 0,
                                  notes: "",
                                });
                              }}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (!customEntityForm.title.trim()) {
                                toast.error("Please enter a service or entity name");
                                return;
                              }
                              setOtherServices([
                                ...otherServices,
                                { ...customEntityForm, id: `cs-${Date.now()}` },
                              ]);
                              setCustomEntityForm({
                                category: "Bus",
                                title: "",
                                details: "",
                                quantity: "1",
                                date: "",
                                price: 0,
                                notes: "",
                              });
                              toast.success("Custom entity added");
                            }}
                            className="bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs"
                          >
                            + Add Custom Entity
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Added Custom Services List */}
                  <div className="space-y-2">
                    {otherServices.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">
                        No custom bookings or entities added yet. Add buses, trains, ferries, visas, or any custom booking above.
                      </p>
                    ) : (
                      otherServices.map((cs, idx) => (
                        <div
                          key={cs.id || idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-colors text-xs"
                        >
                          <div className="space-y-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                                {cs.category || "Service"}
                              </span>
                              <span className="font-bold text-slate-800 truncate">{cs.title}</span>
                            </div>
                            {(cs.details || cs.date || cs.quantity) && (
                              <p className="text-slate-500 text-[11px] truncate">
                                {cs.details}
                                {cs.date ? ` · Date: ${cs.date}` : ""}
                                {cs.quantity ? ` · Qty: ${cs.quantity}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-teal-800 text-sm">
                              ₹{(Number(cs.price) || 0).toLocaleString("en-IN")}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCustomIndex(idx);
                                setCustomEntityForm({ ...cs });
                              }}
                              className="h-7 w-7 text-slate-500 hover:text-teal-700 hover:bg-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setOtherServices(otherServices.filter((_, i) => i !== idx));
                                if (editingCustomIndex === idx) {
                                  setEditingCustomIndex(null);
                                }
                              }}
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* --- ACCORDIONS: POLICIES --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("policies")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Terms & Conditions / Policies</h2>
                    <p className="text-xs text-slate-400">Payment terms, cancellation policy & notes</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.policies ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.policies && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Client Guidelines & Instructions</Label>
                    <Textarea
                      rows={3}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Enter policy terms, payment milestones, cancellation guidelines..."
                      className="text-xs rounded-xl bg-slate-50 border-slate-200 resize-none"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* --- CARD 11: QUOTATION POLICY & SETTINGS (WITHOUT AGENT PRICE) --- */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection("settings")}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Quotation Policy / Pricing</h2>
                    <p className="text-xs text-slate-400">Finalize quotation, select templates & review costs</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {sectionsOpen.settings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {sectionsOpen.settings && (
                <div className="p-4 sm:p-6 border-t border-slate-100 space-y-6">
                  {/* Notice confirming Agent Price is NOT needed */}
                  <div className="px-3.5 py-2.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center gap-2 text-xs text-teal-800">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      Direct Transparent Pricing Mode: Calculated directly from entered hotels, transport, and tours without adding agent margin.
                    </span>
                  </div>

                  {/* Inclusions Chips */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Inclusions
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {inclusions.map((inc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {inc}
                          <button
                            type="button"
                            onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))}
                            className="hover:text-rose-600 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {/* Add Custom Inclusion */}
                    <div className="flex gap-2 pt-1 max-w-md">
                      <Input
                        placeholder="+ Add custom inclusion item..."
                        id="new-inclusion-input"
                        className="h-8 text-xs bg-slate-50 border-slate-200"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setInclusions([...inclusions, val]);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Exclusions Chips */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Exclusions
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {exclusions.map((exc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/80"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          {exc}
                          <button
                            type="button"
                            onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))}
                            className="hover:text-rose-900 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {/* Add Custom Exclusion */}
                    <div className="flex gap-2 pt-1 max-w-md">
                      <Input
                        placeholder="+ Add custom exclusion item..."
                        id="new-exclusion-input"
                        className="h-8 text-xs bg-slate-50 border-slate-200"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setExclusions([...exclusions, val]);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Quotation PDF Template & Color Palette matching screenshot */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Quotation PDF Theme & Accent
                      </Label>
                      <span className="text-[11px] text-slate-500">Select quotation branding color</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {COLOR_THEMES.map((themeItem) => (
                        <button
                          key={themeItem.id}
                          type="button"
                          onClick={() => setSelectedTheme(themeItem.id)}
                          className={cn(
                            "w-7 h-7 rounded-full transition-all flex items-center justify-center text-white",
                            themeItem.bg,
                            selectedTheme === themeItem.id ? `ring-2 ring-offset-2 ${themeItem.ring} scale-110` : "opacity-80 hover:opacity-100"
                          )}
                          title={themeItem.name}
                        >
                          {selectedTheme === themeItem.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GST & TCS tax controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">GST Rate (%)</Label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium"
                      >
                        <option value={5}>5% GST (Standard Tour Package)</option>
                        <option value={0}>0% (Tax Exempt / Not Applicable)</option>
                        <option value={18}>18% GST (Services)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">TCS Rate (%)</Label>
                      <select
                        value={tcsRate}
                        onChange={(e) => setTcsRate(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium"
                      >
                        <option value={0}>0% TCS (Domestic Tour)</option>
                        <option value={5}>5% TCS (Overseas Package)</option>
                        <option value={20}>20% TCS</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Discount in ₹ (if any)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountAmount || ""}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* --- FINAL PRICE BREAKDOWN SUMMARY CARD MATCHING SCREENSHOT --- */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Price Breakdown</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  {rateDisplayMode === "subtotal" ? "Subtotal Only Mode" : "Full Itemized Mode"}
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                {/* Dynamically toggle between Full Customized Breakdown vs Subtotal Only */}
                {rateDisplayMode === "full" ? (
                  <>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Hotel Accommodation</span>
                      <span className="font-semibold text-slate-800">₹{hotelsTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Transport & Transfers</span>
                      <span className="font-semibold text-slate-800">₹{transportsTotal.toLocaleString("en-IN")}</span>
                    </div>
                    {flightsTotal > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Flight & Airfare</span>
                        <span className="font-semibold text-slate-800">₹{flightsTotal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {sightseeingsTotal > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Sightseeing & Activities</span>
                        <span className="font-semibold text-slate-800">₹{sightseeingsTotal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {trainsTotal > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Trains & Rail Fare</span>
                        <span className="font-semibold text-slate-800">₹{trainsTotal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {otherServices.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between items-center text-slate-600 font-medium">
                          <span>Custom Services & Other ({otherServices.length})</span>
                          <span className="font-semibold text-slate-800">₹{otherTotal.toLocaleString("en-IN")}</span>
                        </div>
                        {otherServices.map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-500 pl-2 text-xs">
                            <span className="truncate max-w-[200px]">
                              {s.category ? `• [${s.category}] ` : "• "}{s.title}
                            </span>
                            <span className="font-medium text-slate-700">
                              ₹{(Number(s.price) || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between text-slate-700">
                    <div>
                      <p className="text-xs font-bold text-teal-900">Consolidated Package Rate</p>
                      <p className="text-[10px] text-teal-600">All hotels, transport, flight & activities included</p>
                    </div>
                    <span className="text-sm font-black text-teal-900">₹{subTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-700 font-semibold">
                  <span>Subtotal</span>
                  <span>₹{subTotal.toLocaleString("en-IN")}</span>
                </div>
                {gstAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>GST ({gstRate}%)</span>
                    <span>₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {tcsAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>TCS ({tcsRate}%)</span>
                    <span>₹{tcsAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400">Total Quotation Price</p>
                  <p className="text-[11px] text-slate-400">Tax & services included</p>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ₹{finalQuotationTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Action Buttons: Switch replacing Update Quotation + Send to Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {/* Switch replacing Update Quotation button */}
                <div className="h-12 rounded-xl bg-slate-50 border border-slate-200 px-3.5 flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {rateDisplayMode === "subtotal" ? "Only Show Subtotal" : "Full Customized Rate"}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {rateDisplayMode === "subtotal"
                        ? "Only show package subtotal"
                        : "Show hotel, transport, flight, airfare"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider hidden sm:inline",
                        rateDisplayMode === "subtotal" ? "text-teal-700 font-black" : "text-slate-400"
                      )}
                    >
                      Subtotal
                    </span>
                    <Switch
                      checked={rateDisplayMode === "full"}
                      onCheckedChange={(checked) => setRateDisplayMode(checked ? "full" : "subtotal")}
                      aria-label="Toggle subtotal or full customized rate"
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider hidden sm:inline",
                        rateDisplayMode === "full" ? "text-teal-700 font-black" : "text-slate-400"
                      )}
                    >
                      Full Rate
                    </span>
                  </div>
                </div>

                {/* Send to Customer + Quick Save Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 bg-teal-800 hover:bg-teal-900 text-white font-bold h-12 rounded-xl gap-2 shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Send to Customer</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    title="Save Quotation"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 shrink-0 p-0 flex items-center justify-center transition-all"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold gap-1.5"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{isGenerating ? (generatingProgress || "Generating PDF…") : "Download Quotation PDF Directly"}</span>
                </Button>
              </div>
            </Card>
          </div>
        </ScrollArea>

        {/* --- HIDDEN PDF RENDER ELEMENT (Mounted at 0,0 with opacity 0 to ensure immediate layout calculations and high-priority image fetching) --- */}
        <div 
          className="fixed top-0 left-0 pointer-events-none opacity-0 -z-50 overflow-hidden" 
          style={{ width: "210mm", height: "auto" }} 
          aria-hidden
        >
          <div ref={pdfRef} style={{ width: "210mm" }}>
            <ItineraryPdfDocument data={pdfData} user={user} />
          </div>
        </div>
      </div>

      {/* --- MODAL 1: PREVIEW QUOTATION MODAL (PORTALED FULL SCREEN) --- */}
      {showPreview && (
        <div className="fixed inset-0 z-[10005] bg-slate-950/95 flex flex-col w-screen h-screen overflow-hidden force-light">
          {/* Preview Toolbar */}
          <div className="shrink-0 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-slate-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate flex items-center gap-2">
                  <span>Preview: {tripTitle || "Quotation"}</span>
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {clientName ? `Client: ${clientName}` : "Custom Quotation"} • {duration}
                </p>
              </div>
            </div>

            {/* Center: Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 rounded-xl p-1 border border-white/10 text-white">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewZoom((z) => Math.max(40, z - 10))}
                className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={() => setPreviewZoom(85)}
                className="text-xs font-mono px-2 py-0.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Click to reset zoom"
              >
                {previewZoom}%
              </button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewZoom((z) => Math.min(150, z + 10))}
                className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <div className="h-4 w-px bg-white/15 mx-0.5" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const containerW = typeof window !== "undefined" ? window.innerWidth : 1024;
                  if (containerW < 640) setPreviewZoom(55);
                  else if (containerW < 1024) setPreviewZoom(75);
                  else setPreviewZoom(95);
                }}
                className="h-7 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-white/10 rounded-lg gap-1"
                title="Fit to screen"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Fit</span>
              </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={generatePDF}
                disabled={isGenerating}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 rounded-xl text-xs font-semibold px-3.5 shadow-sm shadow-teal-900/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">{generatingProgress || "Generating…"}</span>
                    <span className="sm:hidden">Saving…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleWhatsAppShare}
                disabled={isGenerating}
                className="hidden md:flex border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 h-9 rounded-xl text-xs gap-1.5 font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="border-white/15 text-white hover:bg-white/10 h-9 w-9 p-0 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Full Screen Scroll Area */}
          <div className="flex-1 w-full overflow-auto bg-slate-950 p-4 sm:p-8 flex justify-center custom-scrollbar">
            <div 
              className="transition-transform duration-150 origin-top flex flex-col items-center"
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                marginBottom: `${(previewZoom / 100) * 80}px`,
              }}
            >
              <ItineraryPdfDocument data={pdfData} user={user} />
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SEND TO CUSTOMER MODAL --- */}
      {showShareModal && (
        <div className="fixed inset-0 z-[10006] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 force-light">
          <Card className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Send Quotation</h3>
                  <p className="text-xs text-slate-400">{clientName ? `Share with ${clientName}` : "Share quotation"}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareModal(false)}
                className="h-8 w-8 text-slate-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{tripTitle || "Custom Itinerary"}</span>
                <span className="text-teal-700">₹{finalQuotationTotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-slate-500">Recipient: {clientName || "Client"} ({clientPhone || clientEmail || "No contact specified"})</p>
              <div className="pt-1 text-[11px] text-teal-700 font-semibold">
                Rate Mode: {rateDisplayMode === "subtotal" ? "Subtotal Only (Lump sum)" : "Full Itemized Breakdown"}
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                type="button"
                onClick={() => {
                  handleWhatsAppShare();
                  setShowShareModal(false);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Send via WhatsApp (with PDF)</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getShareText());
                  toast.success("Quotation text copied to clipboard!");
                  setShowShareModal(false);
                }}
                variant="ghost"
                className="w-full text-xs text-slate-600 hover:bg-slate-100 h-10 rounded-xl"
              >
                Copy Quotation Message
              </Button>
            </div>
          </Card>
        </div>
      )}
        </>,
        document.body
      )}
    </>
  );
}
