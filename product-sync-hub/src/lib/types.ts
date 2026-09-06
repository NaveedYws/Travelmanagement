export interface User {
  id: number;
  email: string;
  business_type?: string;
  role?: "admin" | "user";
  is_verified?: boolean;
  company_name?: string;
  company_logo?: string;
  company_phone?: string;
  company_website?: string;
  created_at?: string;
}

export interface Profile {
  id: number;
  user_id: number;
  business_type: "hotel" | "travel" | "products";
  created_at: string;
  updated_at: string;
}

export interface ItineraryFlight {
  id?: string;
  airline?: string;
  flightNo: string;
  date: string;
  departure: string;
  arrival: string;
  pnr?: string;
  baggage?: string;
  price?: number;
}

export interface ItineraryHotel {
  id?: string;
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  roomCategory: string;
  bedType?: string;
  mealPlan: string;
  nights?: number;
  rooms?: number;
  price?: number;
  starRating?: string;
  amenities?: string;
}

export interface ItineraryTransport {
  id?: string;
  date: string;
  vehicleType: string;
  route: string;
  pickupTime: string;
  dropoff: string;
  notes: string;
  vehiclesCount?: number;
  price?: number;
  inclusions?: string[];
}

export interface ItinerarySightseeing {
  id?: string;
  title: string;
  city?: string;
  date?: string;
  pax?: number;
  price?: number;
  notes?: string;
}

export interface ItineraryTrain {
  id?: string;
  trainName?: string;
  trainNo?: string;
  route?: string;
  date?: string;
  travelClass?: string;
  price?: number;
}

export interface ItineraryService {
  id?: string;
  category?: string;
  title: string;
  details?: string;
  date?: string;
  quantity?: number | string;
  price?: number;
  notes?: string;
}

export interface ItineraryCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  adults: number;
  children: number;
  infants: number;
  adultRate: number;
  childRate: number;
  infantRate: number;
  rooms: number;
}

export interface DetailedItineraryDay {
  day: number;
  destination?: string;
  title: string;
  activities: string;
  description: string;
  images: string[];
  /** @deprecated Use itinerary-level `hotels` instead */
  hotel?: string;
  /** @deprecated Use itinerary-level `transports` instead */
  transport?: string;
  /** @deprecated Use itinerary-level `flights` instead */
  flight?: string;
}

export interface DetailedItinerary {
  id?: string;
  clientName: string;
  tripTitle: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  adults: number;
  children: number;
  theme: string;
  finalRate?: number;
  totalDays: number;
  days: DetailedItineraryDay[];
  flights?: ItineraryFlight[];
  hotels?: ItineraryHotel[];
  transports?: ItineraryTransport[];
  sightseeings?: ItinerarySightseeing[];
  trains?: ItineraryTrain[];
  otherServices?: ItineraryService[];
  inclusions: string[];
  exclusions: string[];
  clientNotes: string;
  created_at?: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  title?: string | null;
  description: string | null;
  duration?: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  hero_heading?: string | null;
  hero_subheading?: string | null;
  stock: number;
  whatsapp: string | null;
  rating?: number;
  reviews?: number;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: ItineraryDay[];
  activities?: string[];
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  product_id: string;
  customer_name: string;
  address: string | null;
  contact_no: string;
  message: string | null;
  clean_message?: string | null;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
  source?: "meta_ads" | "google_ads" | "website" | "csv_import" | string | null;
  campaign_name?: string | null;
  email?: string | null;
  products?: {
    name: string;
    category: string | null;
  };
}
