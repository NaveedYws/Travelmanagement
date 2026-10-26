import { useState } from "react";
import { BlogPost, BlogInsert } from "@/lib/types";
import { BlogForm } from "./BlogForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  Share2,
  Copy,
  Check,
  Search,
  ImageIcon,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  blog: BlogPost;
  onUpdate: (data: BlogInsert & { id: string | number }) => void;
  onDelete: (id: string | number) => void;
}

export function BlogCard({ blog, onUpdate, onDelete }: BlogCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  const handleCopySlug = () => {
    navigator.clipboard.writeText(blog.slug);
    setCopiedSlug(true);
    toast.success("Blog slug copied to clipboard");
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const hasSeo = Boolean(blog.meta_title && blog.meta_description);

  return (
    <>
      <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col overflow-hidden">
        {/* Card Image Banner */}
        <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
          {blog.featured_image ? (
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <ImageIcon className="w-8 h-8 mb-1" />
              <span className="text-[11px]">No cover image</span>
            </div>
          )}

          {/* Badges on Top */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold uppercase px-2 py-0.5 backdrop-blur-md shadow-xs",
                blog.status === "published"
                  ? "bg-emerald-500/90 text-white border-transparent"
                  : blog.status === "draft"
                  ? "bg-amber-500/90 text-white border-transparent"
                  : "bg-slate-700/90 text-white border-transparent"
              )}
            >
              {blog.status}
            </Badge>

            {blog.category && (
              <Badge className="text-[10px] font-medium bg-black/60 hover:bg-black/70 text-white border-transparent backdrop-blur-md">
                {blog.category}
              </Badge>
            )}
          </div>

          {/* 2-Images Indicator */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
            <ImageIcon className="w-3 h-3" />
            <span>{[blog.featured_image, blog.secondary_image].filter(Boolean).length}/2 images</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            {/* Meta bar: Date & Reading time */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {blog.published_at || new Date().toISOString().split("T")[0]}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {blog.reading_time || "2 min"}
              </span>
              {blog.author_name && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[100px] flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {blog.author_name}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h3
              onClick={() => setShowPreview(true)}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
            >
              {blog.title}
            </h3>

            {/* Excerpt */}
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {blog.excerpt || (blog.content ? blog.content.slice(0, 120) + "..." : "No description provided.")}
            </p>
          </div>

          {/* SEO & Slug info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div
                onClick={handleCopySlug}
                className="flex items-center gap-1 font-mono text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer max-w-[200px] truncate"
                title="Click to copy slug"
              >
                <span className="text-slate-400">/</span>
                <span className="truncate">{blog.slug}</span>
                {copiedSlug ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
              </div>

              <div className="flex items-center gap-1 text-[10px] font-medium">
                {hasSeo ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                    <Search className="w-2.5 h-2.5" /> SEO Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Basic SEO
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 gap-1"
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </Button>

              <div className="flex items-center gap-1">
                <BlogForm
                  onSubmit={(data) => onUpdate({ ...data, id: blog.id })}
                  initialData={blog}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                  }
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => setShowPreview(true)} className="gap-2 text-xs">
                      <Eye className="w-3.5 h-3.5" /> View Article
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopySlug} className="gap-2 text-xs">
                      <Copy className="w-3.5 h-3.5" /> Copy URL Slug
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteAlert(true)}
                      className="gap-2 text-xs text-red-600 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Blog
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-slate-900 dark:text-slate-100">
              Delete this blog article?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{blog.title}"</strong>?
              This will permanently remove it from your live public API. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(blog.id)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              Delete Blog
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600 text-white text-xs">{blog.category || "General"}</Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {blog.status}
              </Badge>
              <span className="text-xs text-slate-400">• {blog.reading_time || "2 min"}</span>
              <span className="text-xs text-slate-400">• {blog.published_at}</span>
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {blog.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Author bar */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {blog.author_name?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{blog.author_name || "Editorial Team"}</p>
                <p className="text-[10px] font-mono text-slate-400">/blog/{blog.slug}</p>
              </div>
            </div>

            {/* Featured Image */}
            {blog.featured_image && (
              <div className="rounded-xl overflow-hidden aspect-video w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic border-l-4 border-blue-600 pl-3.5 py-1">
                {blog.excerpt}
              </p>
            )}

            {/* Content Body */}
            <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed space-y-3">
              {blog.content || "No body content written."}
            </div>

            {/* Secondary Image if present */}
            {blog.secondary_image && (
              <div className="space-y-1.5 pt-3">
                <div className="rounded-xl overflow-hidden aspect-2/1 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                  <img src={blog.secondary_image} alt="Secondary content" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-slate-400 text-center italic">Secondary / Social Media Banner Image</p>
              </div>
            )}

            {/* SEO Factors Inspector */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                Search Engine Optimization (SEO) Metadata
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-500 block">Meta Title:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{blog.meta_title || blog.title}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Keywords:</span>
                  <span className="text-slate-800 dark:text-slate-200">{blog.meta_keywords || "—"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-500 block">Meta Description:</span>
                  <span className="text-slate-800 dark:text-slate-200">{blog.meta_description || blog.excerpt || "—"}</span>
                </div>
                {blog.canonical_url && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-500 block">Canonical URL:</span>
                    <span className="text-blue-600 font-mono text-[10px]">{blog.canonical_url}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
