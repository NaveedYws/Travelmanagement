import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Image as ImageIcon,
  Upload,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  X,
  Check,
  Globe,
  Layers,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DestinationItem,
  DestinationDayTemplate,
  getStoredDestinations,
  saveDestination,
  deleteDestination,
  addDayToDestination,
  updateDayInDestination,
  deleteDayFromDestination,
  resetDestinationsToDefaults,
} from "@/lib/destinationStorage";
import { toast } from "sonner";
import { compressImageTo500KB } from "@/lib/imageCompression";

interface DestinationManagerProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  onSelectDestination?: (dest: DestinationItem) => void;
}

export function DestinationManager({
  trigger,
  isOpen: controlledIsOpen,
  onOpenChange,
  inline = false,
  onSelectDestination,
}: DestinationManagerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDestId, setExpandedDestId] = useState<string | null>(null);

  // New/Edit Destination Dialog
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [destName, setDestName] = useState("");
  const [destRegion, setDestRegion] = useState("");
  const [destCover, setDestCover] = useState("");
  const [destDescription, setDestDescription] = useState("");

  // New/Edit Day Itinerary inside a Destination
  const [editingDayDestId, setEditingDayDestId] = useState<string | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [dayCity, setDayCity] = useState("");
  const [dayTitle, setDayTitle] = useState("");
  const [dayDescription, setDayDescription] = useState("");
  const [dayImage, setDayImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const list = getStoredDestinations();
    setDestinations(list);
    if (!expandedDestId && list.length > 0) {
      setExpandedDestId(list[0].id);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setDestinations(getStoredDestinations());
    };
    window.addEventListener("destination_library_updated", handleUpdate);
    return () => window.removeEventListener("destination_library_updated", handleUpdate);
  }, []);

  const filteredDestinations = destinations.filter((d) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      d.name.toLowerCase().includes(query) ||
      d.stateOrCountry?.toLowerCase().includes(query) ||
      d.days.some(
        (day) =>
          day.destinationCity.toLowerCase().includes(query) ||
          day.title.toLowerCase().includes(query) ||
          day.description.toLowerCase().includes(query)
      )
    );
  });

  const handleOpenAddDest = () => {
    setEditingDestId(null);
    setDestName("");
    setDestRegion("");
    setDestCover("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200");
    setDestDescription("");
    setIsDestModalOpen(true);
  };

  const handleOpenEditDest = (dest: DestinationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDestId(dest.id);
    setDestName(dest.name);
    setDestRegion(dest.stateOrCountry || "");
    setDestCover(dest.coverImage || "");
    setDestDescription(dest.description || "");
    setIsDestModalOpen(true);
  };

  const handleSaveDest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName.trim()) {
      toast.error("Please enter a destination name");
      return;
    }

    const saved = saveDestination({
      id: editingDestId || undefined,
      name: destName.trim(),
      stateOrCountry: destRegion.trim(),
      coverImage: destCover.trim(),
      description: destDescription.trim(),
    });

    toast.success(editingDestId ? "Destination updated" : "Destination added");
    setIsDestModalOpen(false);
    setExpandedDestId(saved.id);
    loadData();
  };

  const handleDeleteDest = (destId: string, destName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${destName}" and all its pre-fed itineraries?`)) {
      deleteDestination(destId);
      toast.success("Destination deleted");
      loadData();
    }
  };

  // Day Form Actions
  const handleOpenAddDay = (dest: DestinationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDayDestId(dest.id);
    setEditingDayId(null);
    setDayNumber(dest.days.length + 1);
    setDayCity(dest.days[dest.days.length - 1]?.destinationCity || dest.name.split(" ")[0]);
    setDayTitle("");
    setDayDescription("");
    setDayImage("");
    setExpandedDestId(dest.id);
  };

  const handleOpenEditDay = (destId: string, day: DestinationDayTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDayDestId(destId);
    setEditingDayId(day.id);
    setDayNumber(day.dayNumber);
    setDayCity(day.destinationCity);
    setDayTitle(day.title);
    setDayDescription(day.description);
    setDayImage(day.imageUrl || "");
  };

  const handleCancelDayForm = () => {
    setEditingDayDestId(null);
    setEditingDayId(null);
    setDayTitle("");
    setDayDescription("");
    setDayImage("");
  };

  const handleSaveDayForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDayDestId) return;
    if (!dayTitle.trim()) {
      toast.error("Please provide a Day Title / Headline");
      return;
    }

    if (editingDayId) {
      updateDayInDestination(editingDayDestId, {
        id: editingDayId,
        dayNumber,
        destinationCity: dayCity || "City",
        title: dayTitle.trim(),
        description: dayDescription.trim(),
        imageUrl: dayImage,
      });
      toast.success("Day itinerary updated");
    } else {
      addDayToDestination(editingDayDestId, {
        dayNumber,
        destinationCity: dayCity || "City",
        title: dayTitle.trim(),
        description: dayDescription.trim(),
        imageUrl: dayImage,
      });
      toast.success("Day itinerary added");
    }

    handleCancelDayForm();
    loadData();
  };

  const handleDeleteDay = (destId: string, dayId: string, dayTitle: string) => {
    if (confirm(`Remove "${dayTitle}" from pre-fed days?`)) {
      deleteDayFromDestination(destId, dayId);
      toast.success("Day itinerary removed");
      loadData();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const compressed = await compressImageTo500KB(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setDayImage(event.target?.result as string);
        setIsUploadingImage(false);
        toast.success("Image uploaded & optimized");
      };
      reader.readAsDataURL(compressed);
    } catch {
      setIsUploadingImage(false);
      toast.error("Failed to process image");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Reset destinations to official default templates (Kashmir, Ladakh, Himachal, Dubai, Bali, Kerala)?")) {
      resetDestinationsToDefaults();
      toast.success("Destinations reset to defaults");
      loadData();
    }
  };

  const renderMainContent = () => (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Destination Itinerary Library
                <Badge variant="outline" className="text-xs bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200">
                  {destinations.length} Destinations
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pre-feed your master itineraries here once, then easily choose them from dropdowns in Quotation Studio!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs h-9 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            title="Reload official template destinations"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Defaults
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenAddDest}
            className="h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            + Add Destination
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search destinations (e.g. Kashmir, Paris, Bali, Srinagar, Solang...)"
          className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Destination Cards List */}
      {filteredDestinations.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-6 space-y-3">
          <MapPin className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {searchQuery ? `No destinations found matching "${searchQuery}"` : "No destinations saved yet"}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "+ Add Destination" above to create your first destination and feed day itineraries.
          </p>
          <Button size="sm" onClick={handleOpenAddDest} className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Your First Destination
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDestinations.map((dest) => {
            const isExpanded = expandedDestId === dest.id;
            return (
              <div
                key={dest.id}
                className={`border rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-all ${
                  isExpanded
                    ? "border-teal-300 dark:border-teal-700 ring-1 ring-teal-200 dark:ring-teal-900/40"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                {/* Destination Card Header */}
                <div
                  onClick={() => setExpandedDestId(isExpanded ? null : dest.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-800/40 dark:to-slate-900 select-none hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {dest.coverImage ? (
                      <img
                        src={dest.coverImage}
                        alt={dest.name}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                          {dest.name}
                        </h3>
                        {dest.stateOrCountry && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {dest.stateOrCountry}
                          </span>
                        )}
                        <Badge className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] px-2 py-0.5">
                          {dest.days.length} {dest.days.length === 1 ? "Day" : "Days"} Pre-fed
                        </Badge>
                      </div>
                      {dest.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {dest.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {onSelectDestination && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDestination(dest);
                        }}
                        className="h-8 text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 font-semibold"
                      >
                        Use in Quotation
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenAddDay(dest, e)}
                      className="h-8 text-xs text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Day
                    </Button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenEditDest(dest, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Destination"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteDest(dest.id, dest.name, e)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Delete Destination"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400 ml-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Day Feeder Section */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 space-y-4">
                    {/* Add / Edit Day Form (inline when active) */}
                    {editingDayDestId === dest.id && (
                      <form
                        onSubmit={handleSaveDayForm}
                        className="bg-white dark:bg-slate-800/90 rounded-xl border-2 border-teal-500/40 p-4 sm:p-5 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            {editingDayId ? `Edit Day ${dayNumber}` : `+ Feed Day ${dayNumber} for ${dest.name}`}
                          </span>
                          <button
                            type="button"
                            onClick={handleCancelDayForm}
                            className="text-xs text-rose-600 hover:underline font-semibold"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              Day Number
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={dayNumber}
                              onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                              className="h-9 bg-white dark:bg-slate-900 text-xs"
                              required
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              City / Stop Name
                            </Label>
                            <Input
                              value={dayCity}
                              onChange={(e) => setDayCity(e.target.value)}
                              placeholder="e.g. Srinagar, Gulmarg, Paris, Denpasar"
                              className="h-9 bg-white dark:bg-slate-900 text-xs"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Day Title / Headline
                          </Label>
                          <Input
                            value={dayTitle}
                            onChange={(e) => setDayTitle(e.target.value)}
                            placeholder="e.g. Arrival in Srinagar & Romantic Dal Lake Shikara Ride"
                            className="h-9 bg-white dark:bg-slate-900 text-xs"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Day Description & Activities Breakdown
                          </Label>
                          <Textarea
                            rows={3}
                            value={dayDescription}
                            onChange={(e) => setDayDescription(e.target.value)}
                            placeholder="Detailed sightseeing points, places visited, activities, transport details..."
                            className="bg-white dark:bg-slate-900 text-xs resize-none"
                            required
                          />
                        </div>

                        {/* Image input with upload & preview */}
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            Day Image (Scenic Photo)
                          </Label>
                          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                            {dayImage ? (
                              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                <img src={dayImage} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setDayImage("")}
                                  className="absolute top-1 right-1 bg-black/70 text-white p-0.5 rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-28 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}

                            <div className="flex-1 w-full space-y-2">
                              <Input
                                value={dayImage}
                                onChange={(e) => setDayImage(e.target.value)}
                                placeholder="Paste image URL (https://...)"
                                className="h-8 text-xs bg-white dark:bg-slate-900"
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef}
                                  className="hidden"
                                  onChange={handleImageFileChange}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploadingImage}
                                  className="h-7 text-[11px] gap-1.5"
                                >
                                  <Upload className="w-3 h-3" />
                                  {isUploadingImage ? "Optimizing..." : "Upload from Device"}
                                </Button>
                                <span className="text-[10px] text-slate-400">JPG, PNG, WebP auto-compressed</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelDayForm}
                            className="h-9 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            className="h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {editingDayId ? "Save Changes" : "+ Add Day to Destination"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Pre-fed Days list */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Pre-fed Itinerary Days ({dest.days.length})
                        </span>
                        {editingDayDestId !== dest.id && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAddDay(dest)}
                            className="h-7 text-xs text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Day {dest.days.length + 1}
                          </Button>
                        )}
                      </div>

                      {dest.days.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                          No itinerary days fed yet. Click "Add Day 1" to start feeding this destination's itinerary.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dest.days.map((day) => (
                            <div
                              key={day.id}
                              className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-teal-300 transition-colors"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                {day.imageUrl ? (
                                  <img
                                    src={day.imageUrl}
                                    alt={day.title}
                                    className="w-16 h-14 rounded-md object-cover border border-slate-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-16 h-14 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex flex-col items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                                    <span className="text-[10px] font-semibold">DAY</span>
                                    <span className="text-sm font-extrabold">{day.dayNumber}</span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                                      Day {day.dayNumber}
                                    </span>
                                    {day.destinationCity && (
                                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        • {day.destinationCity}
                                      </span>
                                    )}
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {day.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {day.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditDay(dest.id, day)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  title="Edit Day Itinerary"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDay(dest.id, day.id, day.title)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  title="Remove Day"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Destination Create / Edit Modal Dialog */}
      <Dialog open={isDestModalOpen} onOpenChange={setIsDestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              {editingDestId ? "Edit Destination" : "+ Add New Destination"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveDest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Destination Name *</Label>
              <Input
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                placeholder="e.g. Kashmir, Dubai, Bali, Ladakh, Himachal"
                className="h-9 text-xs"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Region / Country (Optional)</Label>
              <Input
                value={destRegion}
                onChange={(e) => setDestRegion(e.target.value)}
                placeholder="e.g. India, United Arab Emirates, Europe"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Cover Image URL (Optional)</Label>
              <Input
                value={destCover}
                onChange={(e) => setDestCover(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="h-9 text-xs"
              />
              {destCover && (
                <div className="h-20 w-full rounded-lg overflow-hidden border border-slate-200 mt-1">
                  <img src={destCover} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Short Description (Optional)</Label>
              <Textarea
                rows={2}
                value={destDescription}
                onChange={(e) => setDestDescription(e.target.value)}
                placeholder="Highlight of this destination..."
                className="text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDestModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold">
                {editingDestId ? "Update Destination" : "Create Destination"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (inline) {
    return renderMainContent();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        {renderMainContent()}
      </DialogContent>
    </Dialog>
  );
}
