import { Product, ItineraryDay } from "./types";

export interface PackageMetaPayload {
  title?: string;
  hero_heading?: string;
  hero_subheading?: string;
  duration?: string;
  rating?: number;
  reviews?: number;
  inclusions?: string[];
  exclusions?: string[];
  activities?: string[];
  itinerary?: ItineraryDay[];
  details?: string;
}

export interface PackagePackOptions {
  title?: string;
  heroHeading?: string;
  heroSubheading?: string;
  duration?: string;
  inclusions?: string[];
  exclusions?: string[];
  activities?: string[];
  itinerary?: ItineraryDay[];
  rating?: number;
  reviews?: number;
  details?: string;
}

/**
 * Packs package details into a single formatted description string with human-readable
 * sections and a lossless embedded JSON metadata comment.
 */
export function packPackageDescription(data: PackagePackOptions): string {
  const parts: string[] = [];

  if (data.heroHeading) parts.push(`✨ ${data.heroHeading.trim()}`);
  if (data.heroSubheading) parts.push(`📝 ${data.heroSubheading.trim()}`);
  if (data.duration) parts.push(`🕐 Duration: ${data.duration.trim()}`);
  if (data.rating !== undefined && data.rating > 0) parts.push(`⭐ Rating: ${data.rating}`);
  if (data.reviews !== undefined && data.reviews > 0) parts.push(`💬 Reviews: ${data.reviews}`);

  const cleanInclusions = (data.inclusions || []).map(i => i.trim()).filter(Boolean);
  if (cleanInclusions.length > 0) {
    parts.push(`✅ Inclusions: ${cleanInclusions.join(", ")}`);
  }

  const cleanExclusions = (data.exclusions || []).map(e => e.trim()).filter(Boolean);
  if (cleanExclusions.length > 0) {
    parts.push(`❌ Exclusions: ${cleanExclusions.join(", ")}`);
  }

  const cleanActivities = (data.activities || []).map(a => a.trim()).filter(Boolean);
  if (cleanActivities.length > 0) {
    parts.push(`🎯 Activities: ${cleanActivities.join(", ")}`);
  }

  const cleanItinerary = (data.itinerary || []).filter(d => d.title?.trim() || d.description?.trim() || (d.highlights && d.highlights.length > 0));
  if (cleanItinerary.length > 0) {
    parts.push("\n--- Itinerary ---");
    cleanItinerary.forEach((d, i) => {
      let dayBlock = `Day ${i + 1}: ${d.title?.trim() || `Day ${i + 1}`}`;
      if (d.imageUrl?.trim()) {
        dayBlock += `\nImage: ${d.imageUrl.trim()}`;
      }
      if (d.description?.trim()) {
        dayBlock += `\n${d.description.trim()}`;
      }
      const dayHls = (d.highlights || []).map(h => h.trim()).filter(Boolean);
      if (dayHls.length > 0) {
        dayBlock += `\nHighlights:\n` + dayHls.map(h => `• ${h}`).join("\n");
      }
      parts.push(dayBlock);
    });
  }

  if (data.details?.trim()) {
    parts.push(`\n--- Additional Details ---\n${data.details.trim()}`);
  }

  // Lossless JSON metadata block
  const meta: PackageMetaPayload = {
    title: data.title?.trim() || undefined,
    hero_heading: data.heroHeading?.trim() || undefined,
    hero_subheading: data.heroSubheading?.trim() || undefined,
    duration: data.duration?.trim() || undefined,
    rating: data.rating,
    reviews: data.reviews,
    inclusions: cleanInclusions,
    exclusions: cleanExclusions,
    activities: cleanActivities,
    itinerary: cleanItinerary.map(d => ({
      title: d.title?.trim() || "",
      imageUrl: d.imageUrl?.trim() || undefined,
      description: d.description?.trim() || "",
      highlights: (d.highlights || []).map(h => h.trim()).filter(Boolean),
    })),
    details: data.details?.trim() || undefined,
  };

  parts.push(`\n<!-- PACKAGE_META:${JSON.stringify(meta)} -->`);

  return parts.join("\n").trim();
}

/**
 * Normalizes a product so that all package fields (inclusions, exclusions, itinerary with day highlights,
 * duration, rating, activities, etc.) are always hydrated, whether from dedicated columns or description.
 */
export function normalizeProduct(product: Product): Product {
  if (!product) return product;

  const desc = product.description || "";
  let meta: PackageMetaPayload | null = null;

  // 1. Try extracting lossless metadata comment
  const metaMatch = desc.match(/<!--\s*PACKAGE_META:(.*?)\s*-->/s);
  if (metaMatch && metaMatch[1]) {
    try {
      meta = JSON.parse(metaMatch[1]);
    } catch {
      meta = null;
    }
  }

  // 2. Hydrate fields from meta if available
  const title = product.title || meta?.title || (product.category === "travel" ? product.name : undefined);
  const hero_heading = product.hero_heading || meta?.hero_heading || desc.match(/✨ (.*)/)?.[1]?.trim() || null;
  const hero_subheading = product.hero_subheading || meta?.hero_subheading || desc.match(/📝 (.*)/)?.[1]?.trim() || null;
  const duration = product.duration || meta?.duration || desc.match(/🕐 Duration: (.*)/)?.[1]?.trim() || null;
  const rating = (product.rating !== undefined && product.rating > 0)
    ? product.rating
    : (meta?.rating ?? (desc.match(/⭐ Rating: ([\d.]+)/)?.[1] ? parseFloat(desc.match(/⭐ Rating: ([\d.]+)/)![1]) : 0));
  const reviews = (product.reviews !== undefined && product.reviews > 0)
    ? product.reviews
    : (meta?.reviews ?? (desc.match(/💬 Reviews: (\d+)/)?.[1] ? parseInt(desc.match(/💬 Reviews: (\d+)/)![1]) : 0));

  const inclusions = (product.inclusions && product.inclusions.length > 0)
    ? product.inclusions
    : (meta?.inclusions && meta.inclusions.length > 0)
      ? meta.inclusions
      : (desc.match(/✅ Inclusions: (.*)/)?.[1]?.split(", ").map(s => s.trim()).filter(Boolean) || []);

  const exclusions = (product.exclusions && product.exclusions.length > 0)
    ? product.exclusions
    : (meta?.exclusions && meta.exclusions.length > 0)
      ? meta.exclusions
      : (desc.match(/❌ Exclusions: (.*)/)?.[1]?.split(", ").map(s => s.trim()).filter(Boolean) || []);

  const activities = (product.activities && product.activities.length > 0)
    ? product.activities
    : (meta?.activities && meta.activities.length > 0)
      ? meta.activities
      : (desc.match(/🎯 Activities: (.*)/)?.[1]?.split(", ").map(s => s.trim()).filter(Boolean) || []);

  // 3. Hydrate Itinerary
  let itinerary: ItineraryDay[] = [];
  if (product.itinerary && product.itinerary.length > 0) {
    itinerary = product.itinerary;
  } else if (meta?.itinerary && meta.itinerary.length > 0) {
    itinerary = meta.itinerary;
  } else {
    // Parse legacy itinerary from description
    const itinSection = desc.split("--- Itinerary ---")[1]?.split("--- Additional Details ---")[0]?.split("<!--")[0];
    if (itinSection) {
      const dayBlocks = itinSection.trim().split(/Day \d+:/).filter(Boolean);
      itinerary = dayBlocks.map((block, idx) => {
        const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
        const dayTitle = lines[0] || `Day ${idx + 1}`;
        let imageUrl: string | undefined;
        const highlights: string[] = [];
        const descLines: string[] = [];

        let inHighlights = false;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("Image:")) {
            imageUrl = line.replace(/^Image:\s*/, "").trim();
          } else if (line.toLowerCase().startsWith("highlights:")) {
            inHighlights = true;
          } else if (inHighlights && (line.startsWith("•") || line.startsWith("-") || line.startsWith("*"))) {
            highlights.push(line.replace(/^[•\-*]\s*/, "").trim());
          } else {
            inHighlights = false;
            descLines.push(line);
          }
        }

        return {
          day: idx + 1,
          title: dayTitle,
          imageUrl,
          description: descLines.join("\n"),
          highlights: highlights.length > 0 ? highlights : undefined,
        };
      });
    }
  }

  return {
    ...product,
    title,
    hero_heading,
    hero_subheading,
    duration,
    rating,
    reviews,
    inclusions,
    exclusions,
    activities,
    itinerary,
  };
}

/**
 * Extracts a clean, human-friendly description text without metadata flags or comments.
 */
export function cleanDisplayDescription(product: Product): string {
  if (!product || !product.description) return "";
  let d = product.description;

  // Remove comment metadata
  d = d.replace(/<!--\s*PACKAGE_META:[\s\S]*?-->/g, "");

  // If there's an Additional Details section, prefer that
  if (d.includes("--- Additional Details ---")) {
    const additional = d.split("--- Additional Details ---")[1]?.split("---")[0]?.trim();
    if (additional) return additional;
  }

  // If there's Room Details, prefer that
  if (d.includes("--- Room Details ---")) {
    const room = d.split("--- Room Details ---")[1]?.split("---")[0]?.trim();
    if (room) return room;
  }

  // Strip known marker lines
  const clean = d
    .split("---")[0]
    .replace(/[✨📝🕐⭐💬✅❌🎯📍🏨🛋️].*/g, "")
    .trim();

  return clean;
}
