import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import { Plane, Phone, Plus, Star, Sparkles, Loader2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Product, ItineraryDay } from "@/lib/types";
import { packPackageDescription, normalizeProduct, cleanDisplayDescription } from "@/lib/packageParser";
import { ProductPreview } from "./ProductPreview";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingDayIdx, setUploadingDayIdx] = useState<number | null>(null);

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

  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [exclusions, setExclusions] = useState<string[]>([""]);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [activities, setActivities] = useState<string[]>([""]);

  // File input refs for each day image upload
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (initialData) {
      const p = normalizeProduct(initialData);

      if (p.name) setName(p.name);
      if (p.title) setTitle(p.title);
      if (p.hero_heading) setHeroHeading(p.hero_heading);
      if (p.hero_subheading) setHeroSubheading(p.hero_subheading);
      if (p.price !== undefined) setPrice(p.price.toString());
      if (p.stock !== undefined) setSeats(p.stock.toString());
      if (p.image_url) setImageUrl(p.image_url);
      if (p.whatsapp) setWhatsapp(p.whatsapp);
      if (p.rating !== undefined && p.rating > 0) setRating(p.rating.toString());
      if (p.reviews !== undefined && p.reviews > 0) setReviews(p.reviews.toString());

      if (p.duration) {
        const durMatch = p.duration.match(/(\d+)\s*Nights?\s*\/\s*(\d+)\s*Days?/i);
        if (durMatch) {
          setNights(durMatch[1]);
          setDays(durMatch[2]);
        }
      }

      if (p.inclusions && p.inclusions.length > 0) {
        setInclusions(p.inclusions);
      } else {
        setInclusions([""]);
      }

      if (p.exclusions && p.exclusions.length > 0) {
        setExclusions(p.exclusions);
      } else {
        setExclusions([""]);
      }

      if (p.activities && p.activities.length > 0) {
        setActivities(p.activities);
      } else {
        setActivities([""]);
      }

      if (p.itinerary && p.itinerary.length > 0) {
        setItinerary(
          p.itinerary.map((d, i) => ({
            day: i + 1,
            title: d.title || "",
            imageUrl: d.imageUrl || "",
            description: d.description || "",
            highlights: d.highlights || [],
          }))
        );
      } else {
        setItinerary([]);
      }

      const cleanDesc = cleanDisplayDescription(p);
      setDescription(cleanDesc);
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

  const handleItineraryChange = (index: number, field: keyof ItineraryDay, value: any) => {
    const newItinerary = [...itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setItinerary(newItinerary);
  };

  const addDay = () => {
    setItinerary([
      ...itinerary,
      {
        day: itinerary.length + 1,
        title: "",
        imageUrl: "",
        description: "",
        highlights: [],
      },
    ]);
  };

  const removeDay = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 })));
  };

  // Day Highlights handlers (matching Image 3)
  const addHighlight = (dayIndex: number) => {
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    const currentHls = day.highlights ? [...day.highlights, ""] : [""];
    newItinerary[dayIndex] = { ...day, highlights: currentHls };
    setItinerary(newItinerary);
  };

  const handleHighlightChange = (dayIndex: number, hlIndex: number, value: string) => {
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    const currentHls = day.highlights ? [...day.highlights] : [];
    currentHls[hlIndex] = value;
    newItinerary[dayIndex] = { ...day, highlights: currentHls };
    setItinerary(newItinerary);
  };

  const removeHighlight = (dayIndex: number, hlIndex: number) => {
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    const currentHls = (day.highlights || []).filter((_, i) => i !== hlIndex);
    newItinerary[dayIndex] = { ...day, highlights: currentHls };
    setItinerary(newItinerary);
  };

  const handleDayImageUpload = async (dayIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDayIdx(dayIndex);
    const toastId = toast.loading(
      file.size > 500 * 1024
        ? `Compressing Day ${dayIndex + 1} image to <500 KB...`
        : `Uploading Day ${dayIndex + 1} image...`
    );
    try {
      const res = await api.upload(file);
      handleItineraryChange(dayIndex, "imageUrl", res.publicUrl);
      toast.success(
        file.size > 500 * 1024
          ? `Day ${dayIndex + 1} image compressed to <500 KB & uploaded!`
          : `Day ${dayIndex + 1} image uploaded!`,
        { id: toastId }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: toastId });
    } finally {
      setUploadingDayIdx(null);
      if (e.target) e.target.value = "";
    }
  };

  const cleanFormValues = () => {
    const durationStr = `${nights} Nights / ${days} Days`;
    const cleanInclusions = inclusions.map(i => i.trim()).filter(Boolean);
    const cleanExclusions = exclusions.map(e => e.trim()).filter(Boolean);
    const cleanActivities = activities.map(a => a.trim()).filter(Boolean);
    const cleanItinerary: ItineraryDay[] = itinerary
      .map((d, i) => ({
        day: i + 1,
        title: d.title?.trim() || "",
        imageUrl: d.imageUrl?.trim() || undefined,
        description: d.description?.trim() || "",
        highlights: (d.highlights || []).map(h => h.trim()).filter(Boolean),
      }))
      .filter(d => d.title || d.description || d.imageUrl || (d.highlights && d.highlights.length > 0));

    return {
      durationStr,
      cleanInclusions,
      cleanExclusions,
      cleanActivities,
      cleanItinerary,
    };
  };

  const handleSubmit = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    const { durationStr, cleanInclusions, cleanExclusions, cleanActivities, cleanItinerary } = cleanFormValues();

    // Pack complete details into description for 100% data preservation
    const fullDescription = packPackageDescription({
      title: title || heroHeading || undefined,
      heroHeading: heroHeading || undefined,
      heroSubheading: heroSubheading || undefined,
      duration: durationStr,
      inclusions: cleanInclusions,
      exclusions: cleanExclusions,
      activities: cleanActivities,
      itinerary: cleanItinerary,
      rating: parseFloat(rating) || 0,
      reviews: parseInt(reviews) || 0,
      details: description || undefined,
    });

    onSubmit({
      name,
      title: title || heroHeading || undefined,
      description: fullDescription,
      duration: durationStr,
      price: parseFloat(price) || 0,
      image_url: imageUrl || undefined,
      hero_heading: heroHeading || undefined,
      hero_subheading: heroSubheading || undefined,
      stock: isDraft ? 0 : (parseInt(seats) || 0),
      whatsapp: whatsapp || undefined,
      rating: parseFloat(rating) || 0,
      reviews: parseInt(reviews) || 0,
      inclusions: cleanInclusions.length > 0 ? cleanInclusions : undefined,
      exclusions: cleanExclusions.length > 0 ? cleanExclusions : undefined,
      itinerary: cleanItinerary.length > 0 ? cleanItinerary : undefined,
      activities: cleanActivities.length > 0 ? cleanActivities : undefined,
    });

    setOpen(false);
    if (!initialData) resetForm();
  };

  const resetForm = () => {
    setName("");
    setTitle("");
    setNights("0");
    setDays("0");
    setDescription("");
    setPrice("");
    setSeats("10");
    setImageUrl("");
    setWhatsapp("");
    setHeroHeading("");
    setHeroSubheading("");
    setInclusions([""]);
    setExclusions([""]);
    setItinerary([]);
    setActivities([""]);
    setRating("0");
    setReviews("0");
  };

  // Real-time draft for Live Preview
  const draftProduct: Product = useMemo(() => {
    const { durationStr, cleanInclusions, cleanExclusions, cleanActivities, cleanItinerary } = cleanFormValues();

    return {
      id: initialData?.id || "preview-temp-id",
      user_id: user?.id ? String(user.id) : "0",
      name: name || "Package Preview",
      title: title || heroHeading || name || "Package Preview",
      description: description || null,
      duration: durationStr,
      price: parseFloat(price) || 0,
      category: "travel",
      image_url: imageUrl || null,
      hero_heading: heroHeading || null,
      hero_subheading: heroSubheading || null,
      stock: parseInt(seats) || 0,
      whatsapp: whatsapp || null,
      rating: parseFloat(rating) || 0,
      reviews: parseInt(reviews) || 0,
      inclusions: cleanInclusions,
      exclusions: cleanExclusions,
      activities: cleanActivities,
      itinerary: cleanItinerary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [name, title, description, nights, days, price, imageUrl, heroHeading, heroSubheading, seats, whatsapp, rating, reviews, inclusions, exclusions, activities, itinerary, user, initialData]);

  const triggerEl = trigger ?? (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 shadow-sm">
      <Plane className="w-4 h-4 mr-2" /> Add Package
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerEl}</DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100">
          <DialogHeader className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {initialData ? "Edit Package" : "Add New Package"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col max-h-[85vh]">
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Basic Information Section */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="targeted-name" className="text-slate-700 dark:text-slate-300 font-medium">
                      Package Name *
                    </Label>
                    <Input
                      id="targeted-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Kashmir Spiritual Temple Tour"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pkg-title" className="text-slate-700 dark:text-slate-300 font-medium">
                      Display Title
                    </Label>
                    <Input
                      id="pkg-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. 4 Nights / 5 Days – Kashmir Spiritual Temple Tour"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-slate-700 dark:text-slate-300 font-medium">
                      Slug (URL)
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      readOnly
                      className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Duration</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={nights}
                          onChange={(e) => setNights(e.target.value)}
                          className="pr-16 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Nights
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                          className="pr-16 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-slate-700 dark:text-slate-300 font-medium">
                      Price (₹) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">
                        ₹
                      </span>
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
                  <div className="space-y-2">
                    <Label htmlFor="pkg-seats" className="text-slate-700 dark:text-slate-300 font-medium">
                      Available Seats / Slots
                    </Label>
                    <Input
                      id="pkg-seats"
                      type="number"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Visuals & Content Section */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Visuals & Highlights
                </h3>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Hero Image</Label>
                  <ImageUpload value={imageUrl} onChange={setImageUrl} userId={user?.id} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="hero-heading" className="text-slate-700 dark:text-slate-300 font-medium">
                      Hero Heading
                    </Label>
                    <Input
                      id="hero-heading"
                      value={heroHeading}
                      onChange={(e) => setHeroHeading(e.target.value)}
                      placeholder="e.g. Kashmir Spiritual Temple Tour"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-subheading" className="text-slate-700 dark:text-slate-300 font-medium">
                      Hero Subheading
                    </Label>
                    <Input
                      id="hero-subheading"
                      value={heroSubheading}
                      onChange={(e) => setHeroSubheading(e.target.value)}
                      placeholder="e.g. Visit Shankaracharya, Kheer Bhawani, Mamleshwar & more"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Inclusions */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 dark:text-slate-300 font-semibold">Inclusions</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addListItem('inc')}
                        className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800"
                      >
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
                          <button
                            type="button"
                            onClick={() => removeListItem(i, 'inc')}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1.5 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exclusions */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 dark:text-slate-300 font-semibold">Exclusions</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addListItem('exc')}
                        className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800"
                      >
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
                          <button
                            type="button"
                            onClick={() => removeListItem(i, 'exc')}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1.5 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activities Section */}
                <div className="pt-2">
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 dark:text-slate-300 font-semibold">Activities / Experiences</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addListItem('act')}
                        className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800"
                      >
                        + Add
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activities.map((act, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={act}
                            onChange={(e) => handleListChange(i, e.target.value, 'act')}
                            placeholder="Add activity (e.g. Shikara Ride, Temple Darshan)..."
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-9"
                          />
                          <button
                            type="button"
                            onClick={() => removeListItem(i, 'act')}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1.5 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary Section with Day Highlights (Image 3) */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-2">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Itinerary
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addDay}
                    className="h-8 px-3 border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800 font-medium"
                  >
                    + Add Day
                  </Button>
                </div>

                <div className="space-y-6 pt-2">
                  {itinerary.map((day, index) => (
                    <div
                      key={index}
                      className="relative p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 group space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          Day {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDay(index)}
                          className="text-red-500 dark:text-red-400 text-xs font-semibold hover:underline transition-all"
                        >
                          Remove Day
                        </button>
                      </div>

                      {/* Day Title & Day Image (Image 3) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Day Title
                          </Label>
                          <Input
                            value={day.title}
                            onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                            placeholder="e.g. Day 4: Mamleshwar Temple – Return to Srinagar"
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Day Image
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={day.imageUrl || ""}
                              onChange={(e) => handleItineraryChange(index, 'imageUrl', e.target.value)}
                              placeholder="https://storage.eduyaam.com/uploads/..."
                              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => { fileInputRefs.current[index] = el; }}
                              onChange={(e) => handleDayImageUpload(index, e)}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => fileInputRefs.current[index]?.click()}
                              disabled={uploadingDayIdx === index}
                              className="shrink-0 h-10 w-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Upload Day Image"
                            >
                              {uploadingDayIdx === index ? <Loader2 className="w-4 h-4 animate-spin" /> : "🖼️"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Description
                        </Label>
                        <Textarea
                          value={day.description}
                          onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                          placeholder="Visit the ancient Mamleshwar Temple, one of Kashmir's oldest surviving Shiva temples..."
                          rows={3}
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      {/* Highlights Section (exact styling as in Image 3) */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Highlights
                          </Label>
                          <button
                            type="button"
                            onClick={() => addHighlight(index)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            + Add Highlight
                          </button>
                        </div>

                        {day.highlights && day.highlights.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {day.highlights.map((hl, hlIdx) => (
                              <div key={hlIdx} className="flex items-center gap-2">
                                <Input
                                  value={hl}
                                  onChange={(e) => handleHighlightChange(index, hlIdx, e.target.value)}
                                  placeholder="e.g. Mamleshwar Temple"
                                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-9"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeHighlight(index, hlIdx)}
                                  className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1.5 text-base transition-colors shrink-0"
                                  title="Remove highlight"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white/60 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700/60 text-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              No highlights added for this day yet. Click <span className="font-semibold text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => addHighlight(index)}>"+ Add Highlight"</span> to add key spots (e.g. Mamleshwar Temple, Local Shopping).
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {itinerary.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <p className="text-slate-400 dark:text-slate-500 text-sm">
                        No itinerary days added yet. Click "+ Add Day" to start building your day-by-day plan.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Additional Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="grid grid-cols-2 gap-3">
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
                      <Label htmlFor="pkg-reviews" className="text-slate-700 dark:text-slate-300 font-medium">
                        Reviews Count
                      </Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details" className="text-slate-700 dark:text-slate-300 font-medium">
                    Other Terms & Info
                  </Label>
                  <Textarea
                    id="details"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional terms, refund policy, special notes, etc..."
                    rows={2}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
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
                  onClick={() => setPreviewOpen(true)}
                  className="border-blue-500/80 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium"
                >
                  <Eye className="w-4 h-4 mr-1.5" /> Preview
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => handleSubmit(e, true)}
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

      {/* Live Preview Modal */}
      {previewOpen && (
        <ProductPreview
          product={draftProduct}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  );
}
