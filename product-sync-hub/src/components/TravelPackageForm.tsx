import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import { Plane, Phone, Plus, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Product, ItineraryDay } from "@/lib/types";

interface TravelPackageFormProps {
  onSubmit: (data: {
    name: string;
    title?: string;
    description?: string;
    duration?: string;
    price: number;
    image_url?: string;
    hero_heading?: string;
    hero_subheading?: string;
    stock: number;
    whatsapp?: string;
    rating?: number;
    reviews?: number;
    inclusions?: string[];
    exclusions?: string[];
    itinerary?: ItineraryDay[];
    activities?: string[];
  }) => void;
  initialData?: Product;
  trigger?: React.ReactNode;
}

export function TravelPackageForm({ onSubmit, initialData, trigger }: TravelPackageFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [nights, setNights] = useState("0");
  const [days, setDays] = useState("0");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [seats, setSeats] = useState(initialData?.stock?.toString() ?? "10");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? "");
  const [rating, setRating] = useState(initialData?.rating?.toString() ?? "0");
  const [reviews, setReviews] = useState(initialData?.reviews?.toString() ?? "0");

  // New Fields
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [exclusions, setExclusions] = useState<string[]>([""]);
  const [itinerary, setItinerary] = useState<{ title: string; imageUrl: string; description: string }[]>([]);
  const [activities, setActivities] = useState<string[]>([""]);

  useEffect(() => {
    if (initialData) {
      // Use proper DB fields first
      if (initialData.title) setTitle(initialData.title);
      if (initialData.hero_heading) setHeroHeading(initialData.hero_heading);
      if (initialData.hero_subheading) setHeroSubheading(initialData.hero_subheading);
      if (initialData.rating) setRating(initialData.rating.toString());
      if (initialData.reviews) setReviews(initialData.reviews.toString());

      // Duration from dedicated field
      if (initialData.duration) {
        const durMatch = initialData.duration.match(/(\d+)\s*Nights?\s*\/\s*(\d+)\s*Days?/i);
        if (durMatch) {
          setNights(durMatch[1]);
          setDays(durMatch[2]);
        }
      }

      // Arrays from dedicated JSON fields
      if (initialData.inclusions && initialData.inclusions.length > 0) setInclusions(initialData.inclusions);
      if (initialData.exclusions && initialData.exclusions.length > 0) setExclusions(initialData.exclusions);
      if (initialData.itinerary && initialData.itinerary.length > 0) setItinerary(initialData.itinerary);
      if (initialData.activities && initialData.activities.length > 0) setActivities(initialData.activities);

      // Description is now just the additional details
      if (initialData.description) {
        // Legacy: if description still has the old format, extract additional details
        const detailsSection = initialData.description.split("--- Additional Details ---")[1];
        if (detailsSection) {
          setDescription(detailsSection.trim());
        } else if (!initialData.description.includes("---") && !initialData.description.includes("✨")) {
          setDescription(initialData.description);
        }
      }
    }
  }, [initialData]);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleListChange = (index: number, value: string, type: 'inc' | 'exc' | 'act') => {
    if (type === 'inc') {
      const newInc = [...inclusions];
      newInc[index] = value;
      setInclusions(newInc);
    } else if (type === 'exc') {
      const newExc = [...exclusions];
      newExc[index] = value;
      setExclusions(newExc);
    } else {
      const newAct = [...activities];
      newAct[index] = value;
      setActivities(newAct);
    }
  };

  const addListItem = (type: 'inc' | 'exc' | 'act') => {
    if (type === 'inc') setInclusions([...inclusions, ""]);
    else if (type === 'exc') setExclusions([...exclusions, ""]);
    else setActivities([...activities, ""]);
  };

  const removeListItem = (index: number, type: 'inc' | 'exc' | 'act') => {
    if (type === 'inc') setInclusions(inclusions.filter((_, i) => i !== index));
    else if (type === 'exc') setExclusions(exclusions.filter((_, i) => i !== index));
    else setActivities(activities.filter((_, i) => i !== index));
  };

  const handleItineraryChange = (index: number, field: string, value: string) => {
    const newItinerary = [...itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setItinerary(newItinerary);
  };

  const addDay = () => {
    setItinerary([...itinerary, { title: "", imageUrl: "", description: "" }]);
  };

  const removeDay = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationStr = `${nights} Nights / ${days} Days`;
    const cleanInclusions = inclusions.filter(i => i.trim() !== "");
    const cleanExclusions = exclusions.filter(i => i.trim() !== "");
    const cleanActivities = activities.filter(i => i.trim() !== "");

    onSubmit({
      name,
      title: title || heroHeading || undefined,
      description: description || undefined,
      duration: durationStr,
      price: parseFloat(price) || 0,
      image_url: imageUrl || undefined,
      hero_heading: heroHeading || undefined,
      hero_subheading: heroSubheading || undefined,
      stock: parseInt(seats) || 0,
      whatsapp: whatsapp || undefined,
      rating: parseFloat(rating) || 0,
      reviews: parseInt(reviews) || 0,
      inclusions: cleanInclusions.length > 0 ? cleanInclusions : undefined,
      exclusions: cleanExclusions.length > 0 ? cleanExclusions : undefined,
      itinerary: itinerary.length > 0 ? itinerary : undefined,
      activities: cleanActivities.length > 0 ? cleanActivities : undefined,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName(""); setTitle(""); setNights("0"); setDays("0"); setDescription(""); setPrice(""); setSeats("10"); setImageUrl(""); setWhatsapp("");
    setHeroHeading(""); setHeroSubheading(""); setInclusions([""]); setExclusions([""]); setItinerary([]);
    setActivities([""]);
    setRating("0"); setReviews("0");
  };

  const triggerEl = trigger ?? (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 shadow-sm">
      <Plane className="w-4 h-4 mr-2" /> Add Package
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerEl}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100">
        <DialogHeader className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {initialData ? "Edit Package" : "Add New Package"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Basic Information Section */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Basic Information</h3>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targeted-name" className="text-slate-700 dark:text-slate-300 font-medium">Package Name *</Label>
                  <Input
                    id="targeted-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Kashmir Trip"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-title" className="text-slate-700 dark:text-slate-300 font-medium">Display Title</Label>
                  <Input
                    id="pkg-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. ✨ Kashmir Trip – Meadows of Gold"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-slate-700 dark:text-slate-300 font-medium">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={slug}
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Duration</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={nights}
                        onChange={(e) => setNights(e.target.value)}
                        className="pr-16 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">Nights</span>
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="pr-16 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">Days</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-slate-700 dark:text-slate-300 font-medium">Price (₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">₹</span>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visuals & Content Section */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visuals & Content</h3>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Hero Image</Label>
                <ImageUpload value={imageUrl} onChange={setImageUrl} userId={user?.id} />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-heading" className="text-slate-700 dark:text-slate-300 font-medium">Hero Heading</Label>
                  <Input
                    id="hero-heading"
                    value={heroHeading}
                    onChange={(e) => setHeroHeading(e.target.value)}
                    placeholder="Capture attention..."
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-subheading" className="text-slate-700 dark:text-slate-300 font-medium">Hero Subheading</Label>
                  <Input
                    id="hero-subheading"
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                    placeholder="Add more details..."
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                {/* Inclusions */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">Inclusions</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => addListItem('inc')} className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800">
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {inclusions.map((inc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={inc}
                          onChange={(e) => handleListChange(i, e.target.value, 'inc')}
                          placeholder="Add inclusion..."
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-9"
                        />
                        <button type="button" onClick={() => removeListItem(i, 'inc')} className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclusions */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">Exclusions</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => addListItem('exc')} className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800">
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {exclusions.map((exc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={exc}
                          onChange={(e) => handleListChange(i, e.target.value, 'exc')}
                          placeholder="Add exclusion..."
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-9"
                        />
                        <button type="button" onClick={() => removeListItem(i, 'exc')} className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activities Section */}
              <div className="pt-2">
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">Activities</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => addListItem('act')} className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800">
                      + Add
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {activities.map((act, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={act}
                          onChange={(e) => handleListChange(i, e.target.value, 'act')}
                          placeholder="Add activity..."
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-9"
                        />
                        <button type="button" onClick={() => removeListItem(i, 'act')} className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary Section */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Itinerary</h3>
                <Button type="button" size="sm" variant="outline" onClick={addDay} className="h-8 px-3 border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800 font-medium">
                  + Add Day
                </Button>
              </div>

              <div className="space-y-6 pt-2">
                {itinerary.map((day, index) => (
                  <div key={index} className="relative p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">Day {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        className="text-red-500 dark:text-red-400 text-sm font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove Day
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Day Title</Label>
                        <Input
                          value={day.title}
                          onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                          placeholder="e.g. Arrival & City Tour"
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Day Image URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={day.imageUrl}
                            onChange={(e) => handleItineraryChange(index, 'imageUrl', e.target.value)}
                            placeholder="https://..."
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          />
                          <Button type="button" size="icon" variant="outline" className="shrink-0 h-10 w-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            🖼️
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description</Label>
                      <Textarea
                        value={day.description}
                        onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                        placeholder="What happens on this day?"
                        rows={3}
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                      />
                    </div>
                  </div>
                ))}

                {itinerary.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">No itinerary days added yet. Click "+ Add Day" to start.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Additional Settings</h3>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pkg-seats" className="text-slate-700 dark:text-slate-300 font-medium">Available Seats</Label>
                  <Input
                    id="pkg-seats"
                    type="number"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-whatsapp" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" /> WhatsApp Support
                  </Label>
                  <Input
                    id="pkg-whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+91 9876543210"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pkg-rating" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" /> Rating (0–5)
                  </Label>
                  <Input
                    id="pkg-rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-reviews" className="text-slate-700 dark:text-slate-300 font-medium">Reviews Count</Label>
                  <Input
                    id="pkg-reviews"
                    type="number"
                    min="0"
                    value={reviews}
                    onChange={(e) => setReviews(e.target.value)}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details" className="text-slate-700 dark:text-slate-300 font-medium">Other Terms & Info</Label>
                <Textarea
                  id="details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional terms, refund policy, etc..."
                  rows={2}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-red-500 hover:text-red-600 dark:text-red-400 font-medium hover:underline transition-all"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="border-blue-500/80 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium"
              >
                <span className="mr-1.5">👁</span> Preview
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
              >
                Save as draft
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 shadow-sm"
              >
                Publish
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
