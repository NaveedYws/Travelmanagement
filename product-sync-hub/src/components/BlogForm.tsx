import React, { useReducer, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "./ImageUpload";
import { BlogPost, BlogInsert } from "@/lib/types";
import {
  BookOpen,
  Plus,
  Sparkles,
  Loader2,
  Eye,
  FileText,
  Image as ImageIcon,
  Search,
  Calendar,
  Clock,
  User,
  Tag,
  Share2,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper: Convert string to URL slug
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

// Helper: Estimate reading time
export function calculateReadingTime(text: string): string {
  if (!text) return "1 min read";
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

// ----------------------------------------------------
// REDUCER STATE & ACTIONS
// ----------------------------------------------------
export interface BlogFormState {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  tagInput: string;
  author_name: string;
  excerpt: string;
  content: string;
  featured_image: string; // Image 1 (Cover, <= 500KB)
  secondary_image: string; // Image 2 (OG/Social/Secondary, <= 500KB)
  status: "published" | "draft" | "archived";
  reading_time: string;
  published_at: string;
  // SEO Factors
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  // Internal control
  isAutoSlug: boolean;
}

export type BlogAction =
  | { type: "SET_FIELD"; field: keyof BlogFormState; value: any }
  | { type: "SET_IMAGE"; which: "featured_image" | "secondary_image"; value: string }
  | { type: "ADD_TAG"; tag: string }
  | { type: "REMOVE_TAG"; index: number }
  | { type: "SET_TAG_INPUT"; value: string }
  | { type: "AUTO_SLUG" }
  | { type: "AUTO_SYNC_SEO" }
  | { type: "CALC_READING_TIME" }
  | { type: "RESET"; initialData?: Partial<BlogPost> }
  | { type: "LOAD_INITIAL"; payload: Partial<BlogPost> };

const getInitialState = (initialData?: Partial<BlogPost>): BlogFormState => ({
  title: initialData?.title || "",
  slug: initialData?.slug || (initialData?.title ? slugify(initialData.title) : ""),
  category: initialData?.category || "General",
  tags: initialData?.tags || [],
  tagInput: "",
  author_name: initialData?.author_name || "Editorial Team",
  excerpt: initialData?.excerpt || "",
  content: initialData?.content || "",
  featured_image: initialData?.featured_image || "",
  secondary_image: initialData?.secondary_image || "",
  status: initialData?.status || "published",
  reading_time: initialData?.reading_time || "2 min read",
  published_at: initialData?.published_at || new Date().toISOString().split("T")[0],
  meta_title: initialData?.meta_title || initialData?.title || "",
  meta_description: initialData?.meta_description || initialData?.excerpt || "",
  meta_keywords: initialData?.meta_keywords || (initialData?.tags ? initialData.tags.join(", ") : ""),
  canonical_url: initialData?.canonical_url || "",
  og_title: initialData?.og_title || initialData?.meta_title || initialData?.title || "",
  og_description: initialData?.og_description || initialData?.meta_description || initialData?.excerpt || "",
  isAutoSlug: !initialData?.slug,
});

export function blogReducer(state: BlogFormState, action: BlogAction): BlogFormState {
  switch (action.type) {
    case "SET_FIELD": {
      const nextState = { ...state, [action.field]: action.value };

      // If user typed a title and auto-slug is still active, sync slug automatically
      if (action.field === "title" && state.isAutoSlug) {
        nextState.slug = slugify(action.value);
        if (!state.meta_title || state.meta_title === state.title) {
          nextState.meta_title = action.value;
        }
        if (!state.og_title || state.og_title === state.title) {
          nextState.og_title = action.value;
        }
      }

      // If excerpt changed and meta_desc was empty, sync
      if (action.field === "excerpt") {
        if (!state.meta_description || state.meta_description === state.excerpt) {
          nextState.meta_description = action.value;
        }
        if (!state.og_description || state.og_description === state.excerpt) {
          nextState.og_description = action.value;
        }
      }

      // If content changed, auto update reading time
      if (action.field === "content") {
        nextState.reading_time = calculateReadingTime(action.value);
      }

      return nextState;
    }

    case "SET_IMAGE":
      return {
        ...state,
        [action.which]: action.value,
      };

    case "ADD_TAG": {
      const trimmed = action.tag.trim().toLowerCase();
      if (!trimmed || state.tags.includes(trimmed)) return { ...state, tagInput: "" };
      const newTags = [...state.tags, trimmed];
      return {
        ...state,
        tags: newTags,
        tagInput: "",
        meta_keywords: state.meta_keywords ? `${state.meta_keywords}, ${trimmed}` : newTags.join(", "),
      };
    }

    case "REMOVE_TAG": {
      const newTags = state.tags.filter((_, i) => i !== action.index);
      return {
        ...state,
        tags: newTags,
        meta_keywords: newTags.join(", "),
      };
    }

    case "SET_TAG_INPUT":
      return {
        ...state,
        tagInput: action.value,
      };

    case "AUTO_SLUG":
      return {
        ...state,
        slug: slugify(state.title),
        isAutoSlug: true,
      };

    case "AUTO_SYNC_SEO":
      return {
        ...state,
        meta_title: state.title ? state.title.slice(0, 60) : state.meta_title,
        meta_description: state.excerpt
          ? state.excerpt.slice(0, 160)
          : state.content
          ? state.content.replace(/<[^>]*>?/gm, "").slice(0, 160)
          : state.meta_description,
        og_title: state.title || state.og_title,
        og_description: state.excerpt || state.og_description,
        meta_keywords: state.tags.length > 0 ? state.tags.join(", ") : state.category,
      };

    case "CALC_READING_TIME":
      return {
        ...state,
        reading_time: calculateReadingTime(state.content),
      };

    case "RESET":
      return getInitialState(action.initialData);

    case "LOAD_INITIAL":
      return getInitialState(action.payload);

    default:
      return state;
  }
}

// ----------------------------------------------------
// BLOG FORM COMPONENT
// ----------------------------------------------------
interface BlogFormProps {
  onSubmit: (data: BlogInsert & { id?: string | number }) => void;
  initialData?: BlogPost;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BlogForm({ onSubmit, initialData, trigger, open: controlledOpen, onOpenChange }: BlogFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  const [activeTab, setActiveTab] = useState<"general" | "content" | "media" | "seo" | "preview">("general");
  const [state, dispatch] = useReducer(blogReducer, initialData, getInitialState);

  useEffect(() => {
    if (open) {
      dispatch({ type: "LOAD_INITIAL", payload: initialData || {} });
      setActiveTab("general");
    }
  }, [open, initialData]);

  const handleAddTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      dispatch({ type: "ADD_TAG", tag: state.tagInput });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.title.trim()) {
      toast.error("Please enter a blog title");
      setActiveTab("general");
      return;
    }

    const payload: BlogInsert & { id?: string | number } = {
      title: state.title.trim(),
      slug: state.slug.trim() || slugify(state.title),
      category: state.category.trim() || "General",
      tags: state.tags,
      author_name: state.author_name.trim() || "Editorial Team",
      excerpt: state.excerpt.trim(),
      content: state.content.trim(),
      featured_image: state.featured_image || null,
      secondary_image: state.secondary_image || null,
      status: state.status,
      reading_time: state.reading_time || "2 min read",
      published_at: state.published_at || new Date().toISOString().split("T")[0],
      meta_title: state.meta_title.trim() || state.title.trim(),
      meta_description: state.meta_description.trim() || state.excerpt.trim(),
      meta_keywords: state.meta_keywords.trim() || state.tags.join(", "),
      canonical_url: state.canonical_url.trim() || null,
      og_title: state.og_title.trim() || state.meta_title.trim() || state.title.trim(),
      og_description: state.og_description.trim() || state.meta_description.trim() || state.excerpt.trim(),
    };

    if (initialData?.id) {
      payload.id = initialData.id;
    }

    onSubmit(payload);
    setOpen(false);
  };

  // SEO Score & Length indicators
  const metaTitleLength = state.meta_title.length;
  const metaDescLength = state.meta_description.length;
  const isTitleGood = metaTitleLength >= 30 && metaTitleLength <= 60;
  const isDescGood = metaDescLength >= 120 && metaDescLength <= 160;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{initialData ? "Edit Blog" : "Add Blog"}</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                {initialData ? "Edit Blog Article" : "Create New Blog Article"}
              </DialogTitle>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Managed via React Reducer • 2 Images (max 500KB) • Complete SEO Factors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider",
                state.status === "published"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                  : state.status === "draft"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              )}
            >
              {state.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Tab Navigation Header */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-6 gap-1 shrink-0 overflow-x-auto">
          {[
            { id: "general" as const, label: "Basic Details", icon: FileText },
            { id: "content" as const, label: "Article Content", icon: BookOpen },
            { id: "media" as const, label: "Media (2 Images, 500KB)", icon: ImageIcon },
            { id: "seo" as const, label: "SEO & Social Factors", icon: Search },
            { id: "preview" as const, label: "Live Preview", icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.id === "media" && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {[state.featured_image, state.secondary_image].filter(Boolean).length}/2
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* ----------------- TAB 1: BASIC DETAILS ----------------- */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blog-title" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Blog Title <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[10px] text-slate-400">{state.title.length} characters</span>
                  </div>
                  <Input
                    id="blog-title"
                    placeholder="e.g. 10 Essential Travel Tips for First-Time Travelers to Europe"
                    value={state.title}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })}
                    className="rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blog-slug" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      URL Slug
                    </Label>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "AUTO_SLUG" })}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-generate from Title
                    </button>
                  </div>
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5">
                    <span className="text-xs font-mono text-slate-400 select-none">/blog/</span>
                    <input
                      id="blog-slug"
                      value={state.slug}
                      onChange={(e) => {
                        dispatch({ type: "SET_FIELD", field: "isAutoSlug", value: false });
                        dispatch({ type: "SET_FIELD", field: "slug", value: slugify(e.target.value) });
                      }}
                      placeholder="url-friendly-slug"
                      className="w-full bg-transparent border-0 p-0 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">Category</Label>
                    <Input
                      placeholder="e.g. Travel Guide, Tips, Food"
                      value={state.category}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "category", value: e.target.value })}
                      className="rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">Author Name</Label>
                    <Input
                      placeholder="e.g. John Doe, Editor"
                      value={state.author_name}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "author_name", value: e.target.value })}
                      className="rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">Publication Status</Label>
                    <Select
                      value={state.status}
                      onValueChange={(val: any) => dispatch({ type: "SET_FIELD", field: "status", value: val })}
                    >
                      <SelectTrigger className="text-xs rounded-lg">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published (Visible in API)</SelectItem>
                        <SelectItem value="draft">Draft (Unpublished)</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Published Date
                    </Label>
                    <Input
                      type="date"
                      value={state.published_at}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "published_at", value: e.target.value })}
                      className="rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Reading Time
                      </Label>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "CALC_READING_TIME" })}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Auto-calc
                      </button>
                    </div>
                    <Input
                      placeholder="e.g. 5 min read"
                      value={state.reading_time}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "reading_time", value: e.target.value })}
                      className="rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {state.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "REMOVE_TAG", index: idx })}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type a tag and press Enter or comma..."
                      value={state.tagInput}
                      onChange={(e) => dispatch({ type: "SET_TAG_INPUT", value: e.target.value })}
                      onKeyDown={handleAddTagKeyDown}
                      className="rounded-lg text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch({ type: "ADD_TAG", tag: state.tagInput })}
                      disabled={!state.tagInput.trim()}
                      className="text-xs h-9"
                    >
                      Add Tag
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TAB 2: ARTICLE CONTENT ----------------- */}
            {activeTab === "content" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blog-excerpt" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Short Excerpt / Summary
                    </Label>
                    <span className="text-[10px] text-slate-400">
                      {state.excerpt.length} characters (Used on cards & listing pages)
                    </span>
                  </div>
                  <Textarea
                    id="blog-excerpt"
                    placeholder="Brief summary of the article to capture readers' interest on social media and blog cards..."
                    value={state.excerpt}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "excerpt", value: e.target.value })}
                    className="min-h-20 text-xs rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blog-content" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Full Article Body
                    </Label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {state.content.split(/\s+/).filter(Boolean).length} words • {state.reading_time}
                    </span>
                  </div>
                  <Textarea
                    id="blog-content"
                    placeholder="Write the full blog article here. You can use standard paragraphs, markdown, or HTML format..."
                    value={state.content}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "content", value: e.target.value })}
                    className="min-h-72 text-xs rounded-lg font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Tip: Writing in clear headings and paragraphs enhances reader retention and SEO ranking.
                  </p>
                </div>
              </div>
            )}

            {/* ----------------- TAB 3: MEDIA (2 IMAGES, MAX 500KB) ----------------- */}
            {activeTab === "media" && (
              <div className="space-y-5">
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
                    <p className="font-semibold">Dual Image Support with 500KB Compression</p>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                      Upload up to 2 images: a primary <strong>Featured Cover Image</strong> and a secondary{" "}
                      <strong>Social / OG Banner Image</strong>. All uploaded images are automatically compressed to under{" "}
                      <strong>500KB</strong> for maximum website speed and SEO performance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Image 1: Featured Cover Image */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          1
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Featured Cover Image</p>
                          <p className="text-[10px] text-slate-400">Hero banner & article header</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono border-blue-200 text-blue-700 dark:text-blue-300">
                        Max 500KB
                      </Badge>
                    </div>

                    <ImageUpload
                      value={state.featured_image}
                      onChange={(url) => dispatch({ type: "SET_IMAGE", which: "featured_image", value: url })}
                      label="Upload Featured Cover Image"
                      helperText="Auto-compressed to <500KB"
                    />

                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Or paste image URL:</Label>
                      <Input
                        placeholder="https://..."
                        value={state.featured_image}
                        onChange={(e) => dispatch({ type: "SET_IMAGE", which: "featured_image", value: e.target.value })}
                        className="text-xs rounded-lg h-8"
                      />
                    </div>
                  </div>

                  {/* Image 2: Secondary / OG Social Image */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          2
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Secondary / OG Image</p>
                          <p className="text-[10px] text-slate-400">Social shares & inline highlight</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono border-indigo-200 text-indigo-700 dark:text-indigo-300">
                        Max 500KB
                      </Badge>
                    </div>

                    <ImageUpload
                      value={state.secondary_image}
                      onChange={(url) => dispatch({ type: "SET_IMAGE", which: "secondary_image", value: url })}
                      label="Upload Secondary / Social Image"
                      helperText="Auto-compressed to <500KB"
                    />

                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Or paste image URL:</Label>
                      <Input
                        placeholder="https://..."
                        value={state.secondary_image}
                        onChange={(e) => dispatch({ type: "SET_IMAGE", which: "secondary_image", value: e.target.value })}
                        className="text-xs rounded-lg h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TAB 4: SEO FACTORS ----------------- */}
            {activeTab === "seo" && (
              <div className="space-y-5">
                {/* Auto SEO Fill Action */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">SEO Assistant</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Generate optimized meta tags, titles, and Open Graph data directly from your content.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch({ type: "AUTO_SYNC_SEO" });
                      toast.success("SEO fields synced from article content");
                    }}
                    className="text-xs font-medium gap-1.5 h-8 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Auto-Fill SEO
                  </Button>
                </div>

                {/* Google Search Live SERP Preview */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" /> Google Search SERP Preview
                    </span>
                    <span className="text-[10px] font-mono">Desktop / Mobile result</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                      https://example.com/blog/{state.slug || "url-slug"}
                    </div>
                    <div className="text-base font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
                      {state.meta_title || state.title || "Your Blog Article Title Here"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {state.meta_description || state.excerpt || "Meta description will appear here in search engine results snippets."}
                    </div>
                  </div>
                </div>

                {/* Meta Title Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meta-title" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      SEO Meta Title
                    </Label>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-medium",
                        isTitleGood ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {metaTitleLength} / 60 chars {isTitleGood && "✓ Ideal"}
                    </span>
                  </div>
                  <Input
                    id="meta-title"
                    placeholder="Concise, keyword-rich title for search engines (50-60 characters)"
                    value={state.meta_title}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "meta_title", value: e.target.value })}
                    className="rounded-lg text-xs"
                  />
                </div>

                {/* Meta Description Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meta-desc" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      SEO Meta Description
                    </Label>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-medium",
                        isDescGood ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {metaDescLength} / 160 chars {isDescGood && "✓ Ideal"}
                    </span>
                  </div>
                  <Textarea
                    id="meta-desc"
                    placeholder="Search snippet summary that persuades clicks (140-160 characters)"
                    value={state.meta_description}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "meta_description", value: e.target.value })}
                    className="min-h-20 text-xs rounded-lg"
                  />
                </div>

                {/* Focus Keywords & Canonical URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Meta Keywords / Focus Keywords
                    </Label>
                    <Input
                      placeholder="e.g. travel tips, europe trip, budget travel"
                      value={state.meta_keywords}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "meta_keywords", value: e.target.value })}
                      className="rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900 dark:text-slate-100">Canonical URL</Label>
                    <Input
                      placeholder="https://example.com/blog/preferred-url"
                      value={state.canonical_url}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "canonical_url", value: e.target.value })}
                      className="rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* OpenGraph (OG) Social Media Tags */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    OpenGraph & Social Sharing (WhatsApp, Facebook, LinkedIn, Twitter)
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">OG Title</Label>
                      <Input
                        placeholder="Social share title"
                        value={state.og_title}
                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "og_title", value: e.target.value })}
                        className="rounded-lg text-xs bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">OG Description</Label>
                      <Textarea
                        placeholder="Social share description"
                        value={state.og_description}
                        onChange={(e) => dispatch({ type: "SET_FIELD", field: "og_description", value: e.target.value })}
                        className="min-h-16 text-xs rounded-lg bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TAB 5: LIVE PREVIEW ----------------- */}
            {activeTab === "preview" && (
              <div className="space-y-6">
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  {/* Category & Date */}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className="bg-blue-600 text-white font-medium">{state.category || "General"}</Badge>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-mono text-[11px]">{state.published_at}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 text-[11px]">{state.reading_time}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {state.title || "Untitled Blog Post"}
                  </h1>

                  {/* Author */}
                  <div className="flex items-center gap-2.5 pt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {state.author_name[0]?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{state.author_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">/blog/{state.slug || "slug"}</p>
                    </div>
                  </div>

                  {/* Primary Featured Image */}
                  {state.featured_image ? (
                    <div className="rounded-xl overflow-hidden aspect-video w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                      <img src={state.featured_image} alt={state.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">No Featured Cover Image added</span>
                    </div>
                  )}

                  {/* Excerpt Lead */}
                  {state.excerpt && (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-3 border-blue-600 pl-3.5 py-1">
                      {state.excerpt}
                    </p>
                  )}

                  {/* Content */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed space-y-2">
                    {state.content || "Article content will be displayed here."}
                  </div>

                  {/* Secondary Image if provided */}
                  {state.secondary_image && (
                    <div className="space-y-1.5 pt-2">
                      <div className="rounded-xl overflow-hidden aspect-2/1 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                        <img src={state.secondary_image} alt="Secondary asset" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-slate-400 text-center italic">Secondary / Social Media Banner Image</p>
                    </div>
                  )}

                  {/* Tags */}
                  {state.tags.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                      {state.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: "RESET", initialData })}
                className="text-xs text-slate-600 dark:text-slate-400"
              >
                Reset Form
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== "preview" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tabs: Array<"general" | "content" | "media" | "seo" | "preview"> = [
                      "general",
                      "content",
                      "media",
                      "seo",
                      "preview",
                    ];
                    const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
                    setActiveTab(tabs[nextIdx]);
                  }}
                  className="text-xs font-medium gap-1"
                >
                  <span>Next Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              <Button
                type="submit"
                size="sm"
                className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{initialData ? "Update Blog" : "Publish / Save Blog"}</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
