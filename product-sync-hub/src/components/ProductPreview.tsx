import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import { Eye, Phone, MapPin, Clock, Star, CheckCircle2, XCircle, Compass, Sparkles } from "lucide-react";
import { normalizeProduct, cleanDisplayDescription } from "@/lib/packageParser";

interface ProductPreviewProps {
  product: Product;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductPreview({ product, trigger, open, onOpenChange }: ProductPreviewProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

  // Hydrate all fields safely via normalizer
  const p = normalizeProduct(product);

  const heroHeading = p.hero_heading || p.title || p.name;
  const heroSubheading = p.hero_subheading;
  const duration = p.duration;
  const inclusions = p.inclusions && p.inclusions.length > 0 ? p.inclusions : undefined;
  const exclusions = p.exclusions && p.exclusions.length > 0 ? p.exclusions : undefined;
  const activities = p.activities && p.activities.length > 0 ? p.activities : undefined;
  const location = p.description?.match(/📍 Location: (.*)/)?.[1];
  const rating = p.rating && p.rating > 0 ? p.rating : undefined;
  const reviews = p.reviews && p.reviews > 0 ? p.reviews : undefined;
  const amenities = p.description?.match(/🛋️ Room Amenities: (.*)/)?.[1]?.split(", ") || p.description?.match(/🏨 Amenities: (.*)/)?.[1]?.split(", ");
  const hotelName = p.description?.match(/🏨 Hotel: (.*)/)?.[1];

  const itinerary = p.itinerary && p.itinerary.length > 0 ? p.itinerary : null;

  const rawCleanDesc = cleanDisplayDescription(p);
  const displayDescription = rawCleanDesc || (
    p.category === 'travel' && (heroSubheading || inclusions || itinerary)
      ? (heroSubheading ? heroSubheading : `Experience an unforgettable journey with ${p.name}. Check the complete itinerary, inclusions, and activities below.`)
      : "No detailed information available."
  );

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
            <Eye className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl text-slate-900 dark:text-slate-100">
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Hero Section */}
          <div className="relative aspect-[16/7] w-full bg-slate-100 dark:bg-slate-800">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 font-medium">
                No Image Available
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
              <div className="space-y-2">
                <Badge className="bg-blue-600 text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  {p.category || "Package"}
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                  {heroHeading}
                </h1>
                {heroSubheading && (
                  <p className="text-gray-200 text-base sm:text-lg font-medium max-w-xl">
                    {hotelName ? `🏨 ${hotelName}` : heroSubheading}
                  </p>
                )}
                {hotelName && heroSubheading && (
                  <p className="text-gray-300 text-sm italic">
                    {heroSubheading}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center gap-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  ₹
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Price</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">₹{p.price.toLocaleString()}</p>
                </div>
              </div>
              {duration && (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/50 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Duration</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{duration}</p>
                  </div>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-950/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Location</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{location}</p>
                  </div>
                </div>
              )}
              {rating !== undefined && (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 rounded-full flex items-center justify-center text-amber-500">
                    <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Rating</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rating} Star {reviews ? <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">({reviews} reviews)</span> : null}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {p.category === 'hotel' ? 'Room Details' : 'Overview & Details'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {displayDescription}
              </p>
            </div>

            {/* Activities / Experiences */}
            {activities && activities.length > 0 && (
              <div className="space-y-3 bg-blue-50/40 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Activities & Experiences
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activities.map((act, i) => (
                    <Badge key={i} variant="secondary" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 text-xs font-semibold shadow-xs">
                      🎯 {act}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            {((inclusions && inclusions.length > 0) || (exclusions && exclusions.length > 0) || amenities) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {inclusions && inclusions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> What's Included
                    </h3>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                          <span className="text-green-500 mt-0.5 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions && exclusions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" /> What's Excluded
                    </h3>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500 dark:text-slate-400">
                          <span className="text-red-400 mt-0.5 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {amenities && (
                  <div className="space-y-4 col-span-full">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {p.category === 'hotel' ? 'Room Amenities' : 'Amenities'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((item, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none px-3 py-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plan Itinerary */}
            {itinerary && itinerary.length > 0 && (
              <div className="space-y-6 pt-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Day-by-Day Itinerary</h3>
                <div className="space-y-8 border-l-2 border-blue-200 dark:border-blue-800/60 ml-4 pl-6 sm:pl-8">
                  {itinerary.map((day, dIdx) => (
                    <div key={dIdx} className="relative">
                      <div className="absolute -left-10 sm:-left-12 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black ring-4 ring-white dark:ring-slate-900 shadow-sm">
                        {day.day || dIdx + 1}
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-snug">
                          {day.title}
                        </h4>

                        {day.imageUrl && (
                          <div className="rounded-xl overflow-hidden max-h-60 border border-slate-200 dark:border-slate-800 shadow-xs">
                            <img src={day.imageUrl} alt={day.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        {day.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {day.description}
                          </p>
                        )}

                        {/* Day Highlights */}
                        {day.highlights && day.highlights.length > 0 && (
                          <div className="pt-2">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Day Highlights
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {day.highlights.map((hl, hlIdx) => (
                                <div key={hlIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span className="font-medium">{hl}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="pt-6 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 mt-8">
              <div className="hidden sm:block">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Ready to book?</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contact the seller directly on WhatsApp</p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl px-8 h-12 gap-2 shadow-lg shadow-green-500/10 flex-1 sm:flex-initial"
                onClick={() => window.open(`https://wa.me/${p.whatsapp?.replace(/[^0-9]/g, '')}`, '_blank')}
              >
                <Phone className="w-5 h-5" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
