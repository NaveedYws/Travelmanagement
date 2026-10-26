import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BlogPost, BlogInsert } from "@/lib/types";

export function useBlogs(userId?: number | string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["blogs", userId],
    queryFn: async () => {
      const data = await api.get<{ blogs: BlogPost[] }>(`/api/blogs/index.php?user_id=${userId}`);
      return (data.blogs || []).map((b) => ({
        ...b,
        tags: Array.isArray(b.tags) ? b.tags : [],
      }));
    },
    enabled: !!userId,
  });

  const addBlog = useMutation({
    mutationFn: async (blog: BlogInsert) => {
      const res = await api.post<BlogPost>("/api/blogs/index.php", blog);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  const updateBlog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string | number }) => {
      const res = await api.put<BlogPost>("/api/blogs/update.php", { id, ...updates });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  const deleteBlog = useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/api/blogs/delete.php?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  return {
    blogs: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    addBlog,
    updateBlog,
    deleteBlog,
  };
}
