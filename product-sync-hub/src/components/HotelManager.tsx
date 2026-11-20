import React, { useState, useEffect, useRef } from "react";
import {
  Hotel,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Upload,
  Search,
  Sparkles,
  X,
  Check,
  MapPin,
  BedDouble,
  Utensils,
  DollarSign,
  Star,
  ExternalLink,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  HotelItem,
  getStoredHotels,
  fetchHotelsFromDb,
  syncHotelsToDatabase,
  saveHotel,
  deleteHotel,
} from "@/lib/hotelStorage";
import { toast } from "sonner";
import { compressImageTo500KB } from "@/lib/imageCompression";

interface HotelManagerProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  onSelectHotel?: (hotel: HotelItem) => void;
}

const STAR_OPTIONS = [
  "Standard / Budget",
  "3 Star",
  "4 Star",
  "5 Star",
  "5 Star Luxury",
  "Heritage / Boutique Resort",
  "Houseboat / Cottage",
];

const MEAL_PLAN_OPTIONS = [
  "CP (Breakfast Included)",
  "MAP (Breakfast + Dinner)",
  "AP (All Meals Included)",
  "EP (Room Only)",
];

const POPULAR_ROOM_CATEGORIES = [
  "Deluxe Room",
  "Super Deluxe Room",
  "Executive Room",
  "Executive Suite",
  "Family Suite",
  "Standard Deluxe Room",
  "Premium Valley View Room",
  "Mountain View Deluxe",
  "Luxury Suite",
  "Presidential Suite",
  "Standard Room",
  "Heritage Suite",
  "Honeymoon Suite",
  "Lake View Room",
  "Cottage / Villa",
  "Houseboat Deluxe",
];

const POPULAR_AMENITIES = [
  "Free Wi-Fi",
  "Central Heating",
  "24/7 Hot Water",
  "Mountain View",
  "Pure Veg Kitchen",
  "Power Backup",
  "Swimming Pool",
  "Spa & Wellness",
  "24/7 Room Service",
  "Tea/Coffee Maker",
  "Airport Transfers",
];

export function HotelManager({
  trigger,
  isOpen: controlledIsOpen,
  onOpenChange,
  inline = false,
  onSelectHotel,
}: HotelManagerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // New/Edit Hotel Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [hotelCity, setHotelCity] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    "Deluxe Room",
    "Super Deluxe Room",
    "Executive Suite",
  ]);
  const [roomInputText, setRoomInputText] = useState("");
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [showRawRoomsInput, setShowRawRoomsInput] = useState(false);
  const [hotelRoomsInput, setHotelRoomsInput] = useState("Deluxe Room, Super Deluxe Room, Executive Suite");
  const [hotelImage, setHotelImage] = useState("");
  const [hotelStarRating, setHotelStarRating] = useState("3 Star");
  const [hotelMealPlan, setHotelMealPlan] = useState("CP (Breakfast Included)");
  const [hotelRate, setHotelRate] = useState<number | "">("");
  const [hotelAmenities, setHotelAmenities] = useState("");
  const [hotelDescription, setHotelDescription] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  // Close room dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roomDropdownRef.current &&
        !roomDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoomDropdownOpen(false);
      }
    };
    if (isRoomDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRoomDropdownOpen]);

  const loadData = () => {
    const list = getStoredHotels();
    setHotels(list);
  };

  useEffect(() => {
    loadData();

    // Fetch and sync from database
    setIsSyncing(true);
    fetchHotelsFromDb()
      .then((items) => {
        if (items && items.length > 0) {
          setHotels(items);
        }
      })
      .catch((err) => {
        console.warn("Could not load hotels from database:", err);
      })
      .finally(() => {
        setIsSyncing(false);
      });

    const handleUpdate = () => {
      setHotels(getStoredHotels());
    };
    window.addEventListener("hotel_library_updated", handleUpdate);
    return () => window.removeEventListener("hotel_library_updated", handleUpdate);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncHotelsToDatabase();
      if (res.success) {
        toast.success(`Successfully saved ${res.count} hotels to database!`);
        loadData();
      } else {
        toast.error(res.error || "Could not sync to database.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Database sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredHotels = hotels.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.starRating?.toLowerCase().includes(q) ||
      h.rooms.some((r) => r.toLowerCase().includes(q))
    );
  });

  const handleAddRoom = (roomName: string) => {
    const trimmed = roomName.trim();
    if (!trimmed) return;

    // Support comma-separated batch input if user typed multiple rooms
    const parts = trimmed
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const updated = [...selectedRooms];
    let addedCount = 0;

    for (const part of parts) {
      if (!updated.some((r) => r.toLowerCase() === part.toLowerCase())) {
        updated.push(part);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      setSelectedRooms(updated);
      setHotelRoomsInput(updated.join(", "));
    }
    setRoomInputText("");
    setIsRoomDropdownOpen(false);
  };

  const handleRemoveRoom = (indexToRemove: number) => {
    const updated = selectedRooms.filter((_, idx) => idx !== indexToRemove);
    setSelectedRooms(updated);
    setHotelRoomsInput(updated.join(", "));
  };

  const handleToggleRoom = (roomName: string) => {
    const trimmed = roomName.trim();
    if (!trimmed) return;
    const existingIndex = selectedRooms.findIndex(
      (r) => r.toLowerCase() === trimmed.toLowerCase()
    );
    let updated: string[];
    if (existingIndex >= 0) {
      // Toggle off / remove
      updated = selectedRooms.filter((_, idx) => idx !== existingIndex);
    } else {
      // Toggle on / add
      updated = [...selectedRooms, trimmed];
    }
    setSelectedRooms(updated);
    setHotelRoomsInput(updated.join(", "));
  };

  const handleToggleAmenity = (amenity: string) => {
    const current = hotelAmenities
      .split(/[,;\n]+/)
      .map((a) => a.trim())
      .filter(Boolean);
    const exists = current.some((a) => a.toLowerCase() === amenity.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = current.filter((a) => a.toLowerCase() !== amenity.toLowerCase());
    } else {
      updated = [...current, amenity];
    }
    setHotelAmenities(updated.join(", "));
  };

  const filteredRoomSuggestions = POPULAR_ROOM_CATEGORIES.filter((category) => {
    if (!roomInputText.trim()) return true;
    return category.toLowerCase().includes(roomInputText.trim().toLowerCase());
  });

  const handleOpenAddHotel = () => {
    setEditingHotelId(null);
    setHotelName("");
    setHotelCity("");
    const initialRooms = ["Deluxe Room", "Super Deluxe Room", "Executive Suite"];
    setSelectedRooms(initialRooms);
    setHotelRoomsInput(initialRooms.join(", "));
    setRoomInputText("");
    setIsRoomDropdownOpen(false);
    setShowRawRoomsInput(false);
    setHotelImage("");
    setHotelStarRating("3 Star");
    setHotelMealPlan("CP (Breakfast Included)");
    setHotelRate("");
    setHotelAmenities("");
    setHotelDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEditHotel = (h: HotelItem) => {
    setEditingHotelId(h.id);
    setHotelName(h.name);
    setHotelCity(h.city);
    const rooms = h.rooms && h.rooms.length > 0 ? h.rooms : ["Deluxe Room"];
    setSelectedRooms(rooms);
    setHotelRoomsInput(rooms.join(", "));
    setRoomInputText("");
    setIsRoomDropdownOpen(false);
    setShowRawRoomsInput(false);
    setHotelImage(h.imageUrl || "");
    setHotelStarRating(h.starRating || "3 Star");
    setHotelMealPlan(h.defaultMealPlan || "CP (Breakfast Included)");
    setHotelRate(h.defaultRatePerNight || "");
    setHotelAmenities(h.amenities || "");
    setHotelDescription(h.description || "");
    setIsModalOpen(true);
  };

  const handleSaveHotelForm = () => {
    if (!hotelName.trim()) {
      toast.error("Please enter a hotel name");
      return;
    }
    if (!hotelCity.trim()) {
      toast.error("Please enter the city or location");
      return;
    }

    const finalRooms = selectedRooms.length > 0 ? selectedRooms : ["Deluxe Room"];

    const saved = saveHotel({
      id: editingHotelId || undefined,
      name: hotelName.trim(),
      city: hotelCity.trim(),
      rooms: finalRooms,
      imageUrl: hotelImage.trim(),
      starRating: hotelStarRating,
      defaultMealPlan: hotelMealPlan,
      defaultRatePerNight: typeof hotelRate === "number" ? hotelRate : 0,
      amenities: hotelAmenities.trim(),
      description: hotelDescription.trim(),
    });

    toast.success(editingHotelId ? "Hotel updated successfully" : "Hotel added to library");
    setIsModalOpen(false);
    loadData();

    if (onSelectHotel) {
      onSelectHotel(saved);
    }
  };

  const handleDeleteHotelItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete hotel "${name}"?`)) {
      deleteHotel(id);
      toast.success("Hotel removed from library");
      loadData();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const compressed = await compressImageTo500KB(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setHotelImage(result);
          toast.success("Hotel photo compressed and loaded");
        }
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process hotel image");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Preview rooms tags from the input string
  const parsedRoomsPreview = hotelRoomsInput
    .split(/[,;\n]+/)
    .map((r) => r.trim())
    .filter(Boolean);

  const content = (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Hotels Library
                <Badge variant="secondary" className="text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                  {hotels.length} Saved
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage saved hotels, room categories & photos for instant 1-click selection in quotation generator.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="text-xs h-9 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            title="Sync all hotels to the MySQL database"
          >
            <Database className={`w-3.5 h-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing DB..." : "Save to DB"}
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddHotel}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white gap-1.5 h-9 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Hotel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by hotel name, city (e.g. Srinagar, Katra, Gulmarg), or room types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9.5 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hotels Grid */}
      {filteredHotels.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
          <Hotel className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No hotels found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery ? "Try a different search query." : "Add your first hotel with name, city, rooms, and photo."}
          </p>
          <Button
            size="sm"
            onClick={handleOpenAddHotel}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Hotel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHotels.map((h) => (
            <div
              key={h.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700/60 transition-all flex flex-col overflow-hidden"
            >
              {/* Hotel Image with Badges */}
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {h.imageUrl ? (
                  <img
                    src={h.imageUrl}
                    alt={h.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Hotel className="w-10 h-10 mb-1 opacity-50" />
                    <span className="text-[11px]">No Photo Available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Star Rating Badge */}
                {h.starRating && (
                  <span className="absolute top-3 left-3 bg-amber-500/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-white" />
                    {h.starRating}
                  </span>
                )}

                {/* City Badge */}
                <span className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <MapPin className="w-3 h-3 text-teal-400" />
                  {h.city}
                </span>

                {/* Bottom Overlay Title on Image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-base leading-tight drop-shadow-sm truncate">{h.name}</h3>
                  <p className="text-[11px] text-slate-200 drop-shadow-xs flex items-center gap-1 mt-0.5">
                    <span>{h.city}</span>
                    {h.defaultMealPlan && (
                      <>
                        <span>•</span>
                        <span>{h.defaultMealPlan.split(" ")[0]}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                {/* Rooms List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <BedDouble className="w-3 h-3 text-teal-600" />
                    Available Rooms ({h.rooms.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {h.rooms.map((room, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60"
                      >
                        {room}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Details (Rate & Amenities) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  {h.defaultRatePerNight ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Default Rate / Night:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ₹{h.defaultRatePerNight.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : null}

                  {h.amenities && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                      {h.amenities}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {onSelectHotel ? (
                    <Button
                      size="sm"
                      onClick={() => onSelectHotel(h)}
                      className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-8"
                    >
                      Use Hotel
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditHotel(h)}
                      className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 gap-1.5 h-8 hover:bg-slate-50"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      Edit Hotel
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteHotelItem(h.id, h.name)}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Hotel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Hotel Slide-Over Drawer with Broad Breadth */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-3xl p-0 flex flex-col bg-white dark:bg-[#0e131f] border-l border-slate-200/80 dark:border-slate-800 shadow-2xl transition-all"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-center shrink-0 shadow-xs">
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {editingHotelId ? "Edit Hotel Details" : "Add New Hotel to Library"}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editingHotelId
                    ? "Update property specifications, room categories, seasonal pricing, and photos."
                    : "Create a new hotel profile for tour quotations and client room assignments."}
                </SheetDescription>
              </div>
            </div>
            <SheetClose className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>

          {/* Scrollable Form Body with Generous Spacing */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs">
            {/* Section 1: Property Identity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-teal-600" />
                  <span>Property Details</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Basic Info</span>
              </div>

              {/* Hotel Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hotel Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Hotel Overa Hill, Grand Palace Resort, The Khyber Himalayan"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="h-10 text-xs bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                />
              </div>

              {/* City & Star Rating in 2-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>City / Location</span> <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Srinagar, Gulmarg, Pahalgam, Sonamarg, Katra"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    className="h-10 text-xs bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Star Rating / Class</span>
                  </Label>
                  <select
                    value={hotelStarRating}
                    onChange={(e) => setHotelStarRating(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {STAR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Room Categories (Editable Dropdown + Clickable Category Options) */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/50">
              <div className="flex items-center justify-between pb-2 border-b border-teal-100 dark:border-teal-900/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Room Categories</span>
                      <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pick popular options from dropdown or type custom rooms
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRawRoomsInput(!showRawRoomsInput)}
                  className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{showRawRoomsInput ? "Tag View" : "Edit Raw Text"}</span>
                </button>
              </div>

              {/* Selected Categories as interactive badges */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Selected Rooms ({selectedRooms.length}):
                  </span>
                  {selectedRooms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRooms([]);
                        setHotelRoomsInput("");
                      }}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="min-h-[46px] p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2 shadow-2xs">
                  {selectedRooms.length === 0 ? (
                    <span className="text-xs text-slate-400 italic px-1">
                      No room categories selected yet. Click any room below (e.g. Deluxe Room) or use the dropdown to add.
                    </span>
                  ) : (
                    selectedRooms.map((room, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 shadow-2xs group animate-in fade-in zoom-in-95 duration-150"
                      >
                        <BedDouble className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{room}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-teal-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors ml-0.5 cursor-pointer"
                          title={`Remove ${room}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Editable Dropdown Combobox */}
              {!showRawRoomsInput ? (
                <div className="relative" ref={roomDropdownRef}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Type or select a room (e.g. Deluxe Room, Executive Suite)..."
                        value={roomInputText}
                        onChange={(e) => {
                          setRoomInputText(e.target.value);
                          if (!isRoomDropdownOpen) setIsRoomDropdownOpen(true);
                        }}
                        onFocus={() => setIsRoomDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (roomInputText.trim()) {
                              handleAddRoom(roomInputText);
                            }
                          } else if (e.key === "Escape") {
                            setIsRoomDropdownOpen(false);
                          }
                        }}
                        className="pl-9 pr-10 h-10 text-xs bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Toggle room dropdown"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isRoomDropdownOpen && "rotate-180")} />
                      </button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (roomInputText.trim()) {
                          handleAddRoom(roomInputText);
                        } else {
                          setIsRoomDropdownOpen(!isRoomDropdownOpen);
                        }
                      }}
                      className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>

                  {/* Dropdown Options Menu */}
                  {isRoomDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e131f] shadow-2xl p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100">
                      {/* Custom input quick adder */}
                      {roomInputText.trim() && !POPULAR_ROOM_CATEGORIES.some(r => r.toLowerCase() === roomInputText.trim().toLowerCase()) && (
                        <div
                          onClick={() => handleAddRoom(roomInputText)}
                          className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer border border-teal-200/80 dark:border-teal-800"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-teal-600" />
                            <span>Add custom: &quot;{roomInputText.trim()}&quot;</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                            Custom
                          </span>
                        </div>
                      )}

                      <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                        <span>Popular Room Types (Click to Add)</span>
                        <span>{filteredRoomSuggestions.length} available</span>
                      </div>

                      {filteredRoomSuggestions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No preset matches &quot;{roomInputText}&quot;. Click &quot;Add custom&quot; above to add it.
                        </div>
                      ) : (
                        filteredRoomSuggestions.map((category) => {
                          const isSelected = selectedRooms.some(r => r.toLowerCase() === category.toLowerCase());
                          return (
                            <div
                              key={category}
                              onClick={() => {
                                handleToggleRoom(category);
                              }}
                              className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <BedDouble className={cn("w-4 h-4", isSelected ? "text-teal-600 dark:text-teal-400" : "text-slate-400")} />
                                <span>{category}</span>
                              </div>
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Selected</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-teal-600">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Click to select</span>
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Raw Text Mode fallback */
                <div className="space-y-1">
                  <Input
                    placeholder="e.g. Deluxe Room, Super Deluxe, Executive Suite"
                    value={hotelRoomsInput}
                    onChange={(e) => {
                      setHotelRoomsInput(e.target.value);
                      const parsed = e.target.value
                        .split(/[,;\n]+/)
                        .map((r) => r.trim())
                        .filter(Boolean);
                      setSelectedRooms(parsed);
                    }}
                    className="h-10 text-xs bg-white dark:bg-slate-900 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">Separate multiple rooms with commas</p>
                </div>
              )}

              {/* Quick Click Suggestion Pills */}
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Quick Click Rooms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_ROOM_CATEGORIES.slice(0, 8).map((preset) => {
                    const isSelected = selectedRooms.some(r => r.toLowerCase() === preset.toLowerCase());
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleToggleRoom(preset)}
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs",
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:text-teal-700 dark:hover:text-teal-300"
                        )}
                      >
                        {isSelected ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Meal Plan & Rates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-teal-600" />
                  <span>Meal Plan & Pricing</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Defaults</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-teal-600" />
                    <span>Default Meal Plan</span>
                  </Label>
                  <select
                    value={hotelMealPlan}
                    onChange={(e) => setHotelMealPlan(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {MEAL_PLAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Default Rate / Night (₹)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 4500"
                      value={hotelRate}
                      onChange={(e) => setHotelRate(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="pl-7 h-10 text-xs bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Hotel Image */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>Hotel Photography</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Cover Photo</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                {hotelImage ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs group">
                    <img src={hotelImage} alt="Hotel preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      type="button"
                      onClick={() => setHotelImage("")}
                      className="absolute top-2.5 right-2.5 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full text-xs shadow-md transition-all cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2.5 left-3 text-white text-xs font-semibold drop-shadow-md">
                      Current Hotel Photo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Paste web image URL (https://...)"
                        value={hotelImage}
                        onChange={(e) => setHotelImage(e.target.value)}
                        className="h-10 text-xs bg-white dark:bg-slate-900 rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">Or</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="h-10 text-xs gap-1.5 bg-white dark:bg-slate-900 rounded-xl w-full sm:w-auto cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-teal-600" />
                        <span>{isUploadingImage ? "Compressing..." : "Upload Photo"}</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Amenities & Notes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Amenities & Notes</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amenities & Inclusions
                </Label>
                <Input
                  placeholder="e.g. Free Wi-Fi, Central Heating, Mountain View, Pure Veg Kitchen"
                  value={hotelAmenities}
                  onChange={(e) => setHotelAmenities(e.target.value)}
                  className="h-10 text-xs bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_AMENITIES.map((am) => {
                    const isSelected = hotelAmenities.toLowerCase().includes(am.toLowerCase());
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => handleToggleAmenity(am)}
                        className={cn(
                          "text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1",
                          isSelected
                            ? "bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        )}
                      >
                        {isSelected ? <Check className="w-2.5 h-2.5 text-teal-600" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                        <span>{am}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description / Overview */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Property Description / Overview (Optional)
                </Label>
                <Textarea
                  placeholder="Enter property background, check-in policy, view highlights, or concierge notes..."
                  value={hotelDescription}
                  onChange={(e) => setHotelDescription(e.target.value)}
                  className="min-h-[80px] text-xs bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs sm:text-sm text-slate-500">
              <span className="text-rose-500 font-bold">*</span> Required fields
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setIsModalOpen(false)}
                className="text-xs sm:text-sm font-semibold h-11 sm:h-12 px-5 sm:px-6 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="default"
                onClick={handleSaveHotelForm}
                className="text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white h-11 sm:h-12 px-6 sm:px-8 rounded-xl shadow-lg shadow-teal-700/25 cursor-pointer flex items-center gap-2 active:scale-[0.98] transition-all"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{editingHotelId ? "Update Hotel" : "Save Hotel"}</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto p-6">
        {content}
      </DialogContent>
    </Dialog>
  );
}
