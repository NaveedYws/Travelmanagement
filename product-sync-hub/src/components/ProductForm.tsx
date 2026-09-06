import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import { ShoppingBag, Phone, Tag, Box, Plus, Info, Clock, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/lib/types";

interface ProductFormProps {
  onSubmit: (product: {
    name: string;
    title?: string;
    description?: string;
    price: number;
    category?: string;
    image_url?: string;
    stock: number;
    whatsapp?: string;
    duration?: string;
    rating?: number;
    reviews?: number;
  }) => void;
  initialData?: Product;
  trigger?: React.ReactNode;
}

export function ProductForm({ onSubmit, initialData, trigger }: ProductFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "");
  const [stock, setStock] = useState(initialData?.stock?.toString() ?? "0");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? "");
  const [duration, setDuration] = useState(initialData?.duration ?? "");
  const [rating, setRating] = useState(initialData?.rating?.toString() ?? "0");
  const [reviews, setReviews] = useState(initialData?.reviews?.toString() ?? "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      title: title || undefined,
      description: description || undefined,
      price: parseFloat(price) || 0,
      category: category || undefined,
      image_url: imageUrl || undefined,
      stock: parseInt(stock) || 0,
      whatsapp: whatsapp || undefined,
      duration: duration || undefined,
      rating: parseFloat(rating) || 0,
      reviews: parseInt(reviews) || 0,
    });
    setOpen(false);
    if (!initialData) resetForm();
  };

  const resetForm = () => {
    setName(""); setTitle(""); setDescription(""); setPrice(""); setCategory(""); setImageUrl(""); setStock("0"); setWhatsapp(""); setDuration(""); setRating("0"); setReviews("0");
  };

  const triggerEl = trigger ?? (
    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6">
      <Plus className="w-4 h-4 mr-2" /> Add Product
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerEl}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100">
        <DialogHeader className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {initialData ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column: Main Info */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" /> Product Information
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="p-name" className="text-slate-700 dark:text-slate-300 font-medium">Product Name *</Label>
                    <Input 
                      id="p-name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      placeholder="e.g. Wireless Noise Cancelling Headphones"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-title" className="text-slate-700 dark:text-slate-300 font-medium">Title / Subtitle</Label>
                    <Input 
                      id="p-title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="e.g. ✨ Premium Studio Over-Ear Headphones"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-cat" className="text-slate-700 dark:text-slate-300 font-medium">Category</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <Input 
                          id="p-cat" 
                          value={category} 
                          onChange={(e) => setCategory(e.target.value)} 
                          placeholder="e.g. Electronics"
                          className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-wa" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" /> WhatsApp for Orders
                      </Label>
                      <Input 
                        id="p-wa" 
                        value={whatsapp} 
                        onChange={(e) => setWhatsapp(e.target.value)} 
                        placeholder="+91 9876543210" 
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-duration" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Duration / Delivery Time
                    </Label>
                    <Input 
                      id="p-duration" 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      placeholder="e.g. 2-3 Days"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-desc" className="text-slate-700 dark:text-slate-300 font-medium">Product Description</Label>
                    <Textarea 
                      id="p-desc" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Tell customers about the features, specs, and benefits..." 
                      rows={5}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Inventory & Visuals */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-500" /> Pricing & Inventory
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="p-price" className="text-slate-700 dark:text-slate-300 font-medium">Selling Price (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">₹</span>
                      <Input 
                        id="p-price" 
                        type="number" 
                        step="0.01"
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        required 
                        placeholder="0.00"
                        className="pl-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-lg font-bold text-blue-600 dark:text-blue-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-stock" className="text-slate-700 dark:text-slate-300 font-medium">Available Stock *</Label>
                    <Input 
                      id="p-stock" 
                      type="number" 
                      value={stock} 
                      onChange={(e) => setStock(e.target.value)} 
                      required 
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-rating" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" /> Rating (0–5)
                      </Label>
                      <Input 
                        id="p-rating" 
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
                      <Label htmlFor="p-reviews" className="text-slate-700 dark:text-slate-300 font-medium">Reviews Count</Label>
                      <Input 
                        id="p-reviews" 
                        type="number" 
                        min="0" 
                        value={reviews} 
                        onChange={(e) => setReviews(e.target.value)} 
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Visuals</h3>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Main Image</Label>
                    <ImageUpload value={imageUrl} onChange={setImageUrl} userId={user?.id} />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">Recommended size: 1080x1080px</p>
                  </div>
                </div>
              </div>
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
                {initialData ? "Save Changes" : "Publish Product"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
