import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Inquiry } from "@/lib/types";

export function useInquiries(userId?: number | string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["inquiries", userId],
    queryFn: async () => {
      const data = await api.get<{ inquiries: Inquiry[] }>("/api/inquiries/index.php");
      return data.inquiries;
    },
    enabled: !!userId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
      await api.put("/api/inquiries/update.php", { id, status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  const deleteInquiry = useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/api/inquiries/delete.php?id=${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  const addInquiry = useMutation({
    mutationFn: async (inquiryData: {
      product_id: string | number;
      customer_name: string;
      contact_no: string;
      address?: string | null;
      message?: string | null;
      email?: string | null;
      source?: string | null;
      campaign_name?: string | null;
      status?: string;
    }) => {
      return await api.post<{ success: boolean; id: number }>("/api/inquiries/index.php", inquiryData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  const bulkImport = useMutation({
    mutationFn: async (leads: Array<{
      product_id: string | number;
      customer_name: string;
      contact_no: string;
      address?: string | null;
      message?: string | null;
      email?: string | null;
      source?: string | null;
      campaign_name?: string | null;
      status?: string;
    }>) => {
      return await api.post<{ success: boolean; count: number }>("/api/inquiries/index.php", { leads });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  return {
    inquiries: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateStatus,
    deleteInquiry,
    addInquiry,
    bulkImport,
  };
}
