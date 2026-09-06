import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "./ProductForm";
import { TravelPackageForm } from "./TravelPackageForm";
import { HotelForm } from "./HotelForm";
import { ProductPreview } from "./ProductPreview";
import { Pencil, Trash2, Package, Phone, MapPin, Clock, Eye, Star } from "lucide-react";
import { Product } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

interface ProductCardProps {
  product: Product;
  onUpdate: (data: any) => void;
  onDelete: (id: string | number) => void;
}

export function ProductCard({ product, onUpdate, onDelete }: ProductCardProps) {
  const { businessType } = useAuth();
  
  // Use dedicated fields; fall back to description regex for legacy data
  const duration = product.duration ?? product.description?.match(/🕐 Duration: (.*)/)?.[1];
  const displayTitle = product.title || product.name;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
      <CardContent className="p-0">
        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 shadow-sm capitalize">
              {product.category || "General"}
            </Badge>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg line-clamp-1">{displayTitle}</h3>
                {product.title && product.name !== product.title && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{product.name}</p>
                )}
              </div>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 shrink-0">₹{product.price.toFixed(0)}</span>
            </div>
            {duration && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                {duration}
              </div>
            )}
            {(product.rating !== undefined && product.rating > 0) && (
              <div className="flex items-center gap-1 text-xs">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= Math.round(product.rating!) ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700"
                    }`}
                  />
                ))}
                <span className="text-slate-600 dark:text-slate-300 ml-1 font-medium">{product.rating?.toFixed(1)}</span>
                {product.reviews ? <span className="text-slate-400 dark:text-slate-500">({product.reviews} reviews)</span> : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className="text-[10px] uppercase tracking-wider font-bold">
              {product.stock > 0 
                ? `${product.stock} ${businessType === 'hotel' ? 'Rooms Available' : 'Slots Left'}` 
                : "Sold Out"}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2">
            <ProductPreview
              product={product}
              trigger={
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700">
                  <Eye className="w-4 h-4" />
                </Button>
              }
            />
            {businessType === "travel" ? (
              <TravelPackageForm
                initialData={product}
                onSubmit={(data) => onUpdate({ id: product.id, ...data })}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                    <Pencil className="w-3 h-3 mr-2" /> Edit
                  </Button>
                }
              />
            ) : businessType === "hotel" ? (
              <HotelForm
                initialData={product}
                onSubmit={(data) => onUpdate({ id: product.id, ...data })}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                    <Pencil className="w-3 h-3 mr-2" /> Edit
                  </Button>
                }
              />
            ) : (
              <ProductForm
                initialData={product}
                onSubmit={(data) => onUpdate({ id: product.id, ...data })}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                    <Pencil className="w-3 h-3 mr-2" /> Edit
                  </Button>
                }
              />
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(product.id)} 
              className="rounded-xl border border-red-200/70 dark:border-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 bg-red-50/50 dark:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
