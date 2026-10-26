import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBlogs } from "@/hooks/useBlogs";
import { BlogCard } from "./BlogCard";
import { BlogForm } from "./BlogForm";
import { BlogApiLinkCard } from "./BlogApiLinkCard";
import { BlogPost, BlogInsert } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Filter,
  Sparkles,
  FileText,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";

export function BlogManager() {
  const { user } = useAuth();
  const { blogs, isLoading, addBlog, updateBlog, deleteBlog } = useBlogs(user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "published" | "draft" | "archived">("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.slug.toLowerCase().includes(q) ||
        (blog.category && blog.category.toLowerCase().includes(q)) ||
        (blog.author_name && blog.author_name.toLowerCase().includes(q)) ||
        (blog.tags && blog.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesCategory = selectedCategory === "all" || blog.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || blog.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [blogs, searchQuery, selectedCategory, selectedStatus]);

  const handleAdd = (data: BlogInsert) => {
    addBlog.mutate(data, {
      onSuccess: () => toast.success("Blog article published successfully!"),
      onError: (err: any) => toast.error(err.message || "Failed to create blog"),
    });
  };

  const handleUpdate = (data: BlogInsert & { id: string | number }) => {
    updateBlog.mutate(data, {
      onSuccess: () => toast.success("Blog article updated successfully!"),
      onError: (err: any) => toast.error(err.message || "Failed to update blog"),
    });
  };

  const handleDelete = (id: string | number) => {
    deleteBlog.mutate(id, {
      onSuccess: () => toast.success("Blog article deleted successfully!"),
      onError: (err: any) => toast.error(err.message || "Failed to delete blog"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Manage Blogs</h2>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {blogs.length} {blogs.length === 1 ? "Article" : "Articles"}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Publish SEO-optimized articles, attach 2 images (up to 500KB), and sync them to your live public API
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <BlogForm onSubmit={handleAdd} />
        </div>
      </div>

      {/* Public API Endpoint Card for Blogs */}
      <BlogApiLinkCard />

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search articles by title, tag, slug, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-lg h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {(["all", "published", "draft"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  selectedStatus === status
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2.5 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="h-8 text-xs text-slate-500 hover:text-slate-800"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Blogs Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800/60">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold">No blog articles created yet</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Create your first blog post with 2 images (auto-compressed to 500KB) and complete SEO metadata.
            </p>
          </div>
          <div>
            <BlogForm onSubmit={handleAdd} />
          </div>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">No articles match your filter</p>
          <p className="text-slate-400 text-xs">Try clearing your search query or changing the filter.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedStatus("all");
            }}
            className="text-xs mt-2"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
