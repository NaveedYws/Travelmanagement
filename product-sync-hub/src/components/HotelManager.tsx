import React, { useState, useEffect, useRef } from "react";
import {
  Hotel,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Upload,
  Search,
  RotateCcw,
  Sparkles,
  X,
  Check,
  MapPin,
  BedDouble,
  Utensils,
  DollarSign,
  Star,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  HotelItem,
  getStoredHotels,
  saveHotel,
  deleteHotel,
  resetHotelsToDefaults,
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

  // New/Edit Hotel Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [hotelCity, setHotelCity] = useState("");
  const [hotelRoomsInput, setHotelRoomsInput] = useState("Deluxe Room, Super Deluxe, Suite");
  const [hotelImage, setHotelImage] = useState("");
  const [hotelStarRating, setHotelStarRating] = useState("3 Star");
  const [hotelMealPlan, setHotelMealPlan] = useState("CP (Breakfast Included)");
  const [hotelRate, setHotelRate] = useState<number | "">("");
  const [hotelAmenities, setHotelAmenities] = useState("");
  const [hotelDescription, setHotelDescription] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const list = getStoredHotels();
    setHotels(list);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setHotels(getStoredHotels());
    };
    window.addEventListener("hotel_library_updated", handleUpdate);
    return () => window.removeEventListener("hotel_library_updated", handleUpdate);
  }, []);

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

  const handleOpenAddHotel = () => {
    setEditingHotelId(null);
    setHotelName("");
    setHotelCity("");
    setHotelRoomsInput("Deluxe Room, Super Deluxe Room, Luxury Suite");
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
    setHotelRoomsInput(h.rooms.join(", "));
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

    const saved = saveHotel({
      id: editingHotelId || undefined,
      name: hotelName.trim(),
      city: hotelCity.trim(),
      rooms: hotelRoomsInput,
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

  const handleResetDefaults = () => {
    if (confirm("Reset hotel library to default seed hotels? Your custom additions will be overwritten.")) {
      resetHotelsToDefaults();
      toast.success("Hotel library reset to defaults");
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
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs text-slate-600 dark:text-slate-400 gap-1.5 h-9"
            title="Reset library to default hotels"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
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

      {/* Add / Edit Hotel Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-teal-700" />
              {editingHotelId ? "Edit Hotel Details" : "Add New Hotel to Library"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Hotel Name */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Hotel Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Hotel Arco Srinagar, The Grand Dragon"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-900"
              />
            </div>

            {/* City & Star Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  City / Location <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Srinagar, Katra, Pahalgam, Gulmarg"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="h-9.5 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Star Rating / Class</Label>
                <select
                  value={hotelStarRating}
                  onChange={(e) => setHotelStarRating(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {STAR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Categories */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Room Categories <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-slate-400">Separate multiple rooms with commas</span>
              </div>
              <Input
                placeholder="e.g. Deluxe Room, Super Deluxe, Executive Suite, Family Suite"
                value={hotelRoomsInput}
                onChange={(e) => setHotelRoomsInput(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-900"
              />
              {parsedRoomsPreview.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 self-center">Preview:</span>
                  {parsedRoomsPreview.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Meal Plan & Default Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Default Meal Plan</Label>
                <select
                  value={hotelMealPlan}
                  onChange={(e) => setHotelMealPlan(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {MEAL_PLAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Default Rate / Night (₹)</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 4500"
                    value={hotelRate}
                    onChange={(e) => setHotelRate(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="pl-6 h-9.5 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Hotel Image: URL + File Upload */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Hotel Image (Image URL or File Upload)
              </Label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                {hotelImage ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={hotelImage} alt="Hotel preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setHotelImage("")}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1 rounded-full text-xs shadow-md transition-all"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Paste web image URL (https://...)"
                        value={hotelImage}
                        onChange={(e) => setHotelImage(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Or</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="h-9 text-xs gap-1.5 bg-white dark:bg-slate-900"
                      >
                        <Upload className="w-3.5 h-3.5 text-teal-600" />
                        {isUploadingImage ? "Compressing..." : "Upload Photo"}
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

            {/* Amenities & Inclusions */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Amenities & Inclusions Notes (Optional)
              </Label>
              <Input
                placeholder="e.g. Free Wi-Fi, Central Heating, Mountain View, Pure Veg Kitchen"
                value={hotelAmenities}
                onChange={(e) => setHotelAmenities(e.target.value)}
                className="h-9 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveHotelForm}
              className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white h-9 px-5 shadow-xs"
            >
              {editingHotelId ? "Update Hotel" : "Save Hotel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
