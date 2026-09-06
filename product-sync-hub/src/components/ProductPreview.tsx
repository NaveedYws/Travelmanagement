import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import { Eye, Phone, MapPin, Clock, Star, CheckCircle2, XCircle } from "lucide-react";

interface ProductPreviewProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function ProductPreview({ product, trigger }: ProductPreviewProps) {
  // Use dedicated DB fields; fall back to description regex for legacy data
  const heroHeading = product.hero_heading || product.description?.match(/✨ (.*)/)?.[1];
  const heroSubheading = product.hero_subheading || product.description?.match(/📝 (.*)/)?.[1];
  const duration = product.duration || product.description?.match(/🕐 Duration: (.*)/)?.[1];
  const inclusions = (product.inclusions && product.inclusions.length > 0)
    ? product.inclusions
    : product.description?.match(/✅ Inclusions: (.*)/)?.[1]?.split(", ");
  const exclusions = (product.exclusions && product.exclusions.length > 0)
    ? product.exclusions
    : product.description?.match(/❌ Exclusions: (.*)/)?.[1]?.split(", ");
  const location = product.description?.match(/📍 Location: (.*)/)?.[1];
  const rating = product.rating || product.description?.match(/⭐ Rating: (\d+)/)?.[1];
  const reviews = product.reviews;
  const amenities = product.description?.match(/🛋️ Room Amenities: (.*)/)?.[1]?.split(", ") || product.description?.match(/🏨 Amenities: (.*)/)?.[1]?.split(", ");
  const hotelName = product.description?.match(/🏨 Hotel: (.*)/)?.[1];

  // Itinerary: prefer dedicated field, fall back to description parsing
  let itinerary = product.itinerary && product.itinerary.length > 0
    ? product.itinerary.map((d, i) => ({ day: i + 1, title: d.title, description: d.description }))
    : null;

  if (!itinerary) {
    const itinerarySection = product.description?.split("--- Itinerary ---")[1]?.split("--- Additional Details ---")[0];
    itinerary = itinerarySection?.trim().split(/Day \d+:/).filter(Boolean).map((d, i) => {
      const lines = d.trim().split("\n");
      return { day: i + 1, title: lines[0].trim(), description: lines.slice(1).join("\n").trim() };
    }) || null;
  }

  const mainDescription = product.description?.split("---")[0]?.replace(/[✨📝🕐✅❌📍⭐🏨🛋️].*/g, '').trim();
  const additionalDetails = product.description?.split("--- Additional Details ---")[1]?.trim();
  const roomDetails = product.description?.split("--- Room Details ---")[1]?.trim();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl text-slate-900 dark:text-slate-100">
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Hero Section */}
          <div className="relative aspect-[16/7] w-full bg-slate-100 dark:bg-slate-800">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">No Image</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <div className="space-y-2">
                <Badge className="bg-blue-600 text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  {product.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  {heroHeading || product.name}
                </h1>
                {heroSubheading && (
                  <p className="text-gray-200 text-lg font-medium max-w-xl">
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

          <div className="p-8 space-y-8">
            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center gap-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">₹</div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Price</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">₹{product.price}</p>
                </div>
              </div>
              {duration && (
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-950/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Location</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{location}</p>
                  </div>
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-2">
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
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{product.category === 'hotel' ? 'Room Details' : 'Description'}</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {roomDetails || mainDescription || additionalDetails || "No detailed information available."}
              </p>
            </div>

            {/* Amenities / Inclusions / Exclusions */}
            {(amenities || (inclusions && inclusions.length > 0) || (exclusions && exclusions.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {inclusions && inclusions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> What's Included
                    </h3>
                    <ul className="grid grid-cols-1 gap-2">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="text-green-500 mt-0.5">•</span> {item}
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
                    <ul className="grid grid-cols-1 gap-2">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="text-red-400 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {amenities && (
                  <div className="space-y-4 col-span-full">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {product.category === 'hotel' ? 'Room Amenities' : 'Amenities'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((item, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-none px-3 py-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Itinerary */}
            {itinerary && itinerary.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Plan Itinerary</h3>
                <div className="space-y-6 border-l-2 border-blue-200 dark:border-blue-800 ml-4 pl-8">
                  {itinerary.map((day) => (
                    <div key={day.day} className="relative">
                      <div className="absolute -left-12 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold ring-4 ring-white dark:ring-slate-900">
                        {day.day}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{day.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="pt-8 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 mt-8">
              <div className="hidden sm:block">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Ready to book?</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contact the seller directly on WhatsApp</p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl px-8 h-12 gap-2 shadow-lg shadow-green-500/10 flex-1 sm:flex-initial"
                onClick={() => window.open(`https://wa.me/${product.whatsapp?.replace(/[^0-9]/g, '')}`, '_blank')}
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
