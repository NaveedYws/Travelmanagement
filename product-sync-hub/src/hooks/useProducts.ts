import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Product, ItineraryDay } from "@/lib/types";

type ProductInsert = {
  name: string;
  title?: string;
  description?: string;
  duration?: string;
  price: number;
  category?: string;
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
};

export function useProducts(userId?: number | string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["products", userId],
    queryFn: async () => {
      const data = await api.get<{ products: Product[] }>(`/api/products/index.php?user_id=${userId}`);
      return data.products;
    },
    enabled: !!userId,
  });

  const addProduct = useMutation({
    mutationFn: async (product: ProductInsert) => {
      return await api.post<Product>("/api/products/index.php", product);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string | number }) => {
      return await api.put<Product>("/api/products/update.php", { id, ...updates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/api/products/delete.php?id=${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  return { products: query.data ?? [], isLoading: query.isLoading, addProduct, updateProduct, deleteProduct };
}
