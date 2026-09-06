import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "./ImageUpload";
import { Hotel, Phone, MapPin, Star, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/lib/types";

interface HotelFormProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    stock: number;
    whatsapp?: string;
  }) => void;
  initialData?: Product;
  trigger?: React.ReactNode;
}

export function HotelForm({ onSubmit, initialData, trigger }: HotelFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState("3");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [availableRooms, setAvailableRooms] = useState(initialData?.stock?.toString() ?? "5");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? "");
  const [description, setDescription] = useState("");
  
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [amenities, setAmenities] = useState<string[]>(["Free WiFi", "AC"]);

  useEffect(() => {
    if (initialData?.description) {
      const desc = initialData.description;
      
      const headingMatch = desc.match(/✨ (.*)/);
      if (headingMatch) setHeroHeading(headingMatch[1]);
      
      const subMatch = desc.match(/📝 (.*)/);
      if (subMatch) setHeroSubheading(subMatch[1]);
      
      const locMatch = desc.match(/📍 Location: (.*)/);
      if (locMatch) setLocation(locMatch[1]);
      
      const rateMatch = desc.match(/⭐ Rating: (\d+)/);
      if (rateMatch) setRating(rateMatch[1]);
      
      const amenMatch = desc.match(/(?:🛋️ Room Amenities|🏨 Amenities): (.*)/);
      if (amenMatch) setAmenities(amenMatch[1].split(", "));
      
      const detailsSection = desc.split("--- Room Details ---")[1];
      if (detailsSection) setDescription(detailsSection.trim());
      else if (!desc.includes("---")) setDescription(desc);

      const hotelMatch = desc.match(/🏨 Hotel: (.*)/);
      if (hotelMatch) setHotelName(hotelMatch[1]);
    }
  }, [initialData]);

  const addAmenity = () => setAmenities([...amenities, ""]);
  const removeAmenity = (index: number) => setAmenities(amenities.filter((_, i) => i !== index));
  const handleAmenityChange = (index: number, value: string) => {
    const newAmen = [...amenities];
    newAmen[index] = value;
    setAmenities(newAmen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullDesc = [
      heroSubheading && `📝 ${heroSubheading}`,
      `🏨 Hotel: ${hotelName}`,
      `📍 Location: ${location}`,
      `⭐ Rating: ${rating} Star`,
      amenities.length > 0 && amenities[0] !== "" && `🛋️ Room Amenities: ${amenities.filter(a => a !== "").join(", ")}`,
      description && `\n--- Room Details ---\n${description}`,
    ].filter(Boolean).join("\n");

    onSubmit({
      name,
      description: fullDesc || undefined,
      price: parseFloat(price) || 0,
      image_url: imageUrl || undefined,
      stock: parseInt(availableRooms) || 0,
      whatsapp: whatsapp || undefined,
    });
    setOpen(false);
    if (!initialData) resetForm();
  };

  const resetForm = () => {
    setName(""); setLocation(""); setRating("3"); setPrice(""); setAvailableRooms("5"); setImageUrl(""); setWhatsapp("");
    setAmenities(["Free WiFi", "AC"]); setHeroHeading(""); setHeroSubheading(""); setDescription("");
    setHotelName("");
  };

  const triggerEl = trigger ?? (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6">
      <Hotel className="w-4 h-4 mr-2" /> Add Room
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerEl}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100">
        <DialogHeader className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {initialData ? "Edit Room Details" : "Add New Room"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Basic Info */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Information</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="room-name" className="text-slate-700 dark:text-slate-300 font-medium">Room Type / Name</Label>
                  <Input 
                    id="room-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    placeholder="e.g. Deluxe Double Room"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-name" className="text-slate-700 dark:text-slate-300 font-medium">Hotel Name</Label>
                  <Input 
                    id="hotel-name" 
                    value={hotelName} 
                    onChange={(e) => setHotelName(e.target.value)} 
                    required 
                    placeholder="e.g. Grand Paradise Resort"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700 dark:text-slate-300 font-medium">Hotel Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input 
                      id="location" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      placeholder="e.g. Manali, Himachal Pradesh"
                      className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Star Rating (Hotel)</Label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(r => (
                        <SelectItem key={r} value={r.toString()}>
                          <span className="flex items-center gap-1">
                            {r} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-slate-700 dark:text-slate-300 font-medium">Price per Night (₹)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms" className="text-slate-700 dark:text-slate-300 font-medium">Available Rooms</Label>
                  <Input 
                    id="rooms" 
                    type="number" 
                    value={availableRooms} 
                    onChange={(e) => setAvailableRooms(e.target.value)} 
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Visuals & Content */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visuals & Content</h3>
              
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Hero Image</Label>
                <ImageUpload value={imageUrl} onChange={setImageUrl} userId={user?.id} />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="h-heading" className="text-slate-700 dark:text-slate-300 font-medium">Hero Heading</Label>
                  <Input id="h-heading" value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} placeholder="Luxury Stay Awaits..." className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-sub" className="text-slate-700 dark:text-slate-300 font-medium">Hero Subheading</Label>
                  <Input id="h-sub" value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} placeholder="Experience the best..." className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="h-whatsapp" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Booking WhatsApp
                </Label>
                <Input id="h-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 9876543210" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" />
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Amenities</h3>
                <Button type="button" size="sm" variant="outline" onClick={addAmenity} className="h-7 px-2 text-xs border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 bg-white dark:bg-slate-800">
                  + Add Amenity
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amen, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      value={amen} 
                      onChange={(e) => handleAmenityChange(index, e.target.value)} 
                      placeholder="e.g. Swimming Pool"
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-9"
                    />
                    <button type="button" onClick={() => removeAmenity(index)} className="text-red-500 hover:text-red-600 dark:text-red-400 font-bold px-1">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <Label htmlFor="h-details" className="text-slate-700 dark:text-slate-300 font-medium">Room Details / Policies</Label>
              <Textarea 
                id="h-details" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Bed type, room size, cancellation policy, etc..." 
                rows={4}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>
          </div>

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
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
              >
                Save as draft
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 shadow-sm"
              >
                Publish Room
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
