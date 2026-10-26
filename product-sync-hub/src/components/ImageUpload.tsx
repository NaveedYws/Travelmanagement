import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  userId?: string | number;
  label?: string;
  helperText?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, userId, label, helperText, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image file is too large (max 25MB)");
      return;
    }

    setUploading(true);
    const originalKb = (file.size / 1024).toFixed(0);
    const toastId = toast.loading(
      file.size > 500 * 1024
        ? `Compressing image (${originalKb} KB → <500 KB)...`
        : "Uploading image..."
    );

    try {
      const data = await api.upload(file);
      onChange(data.publicUrl);
      toast.success(
        file.size > 500 * 1024
          ? `Image compressed to <500 KB & uploaded!`
          : "Image uploaded!",
        { id: toastId }
      );
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className || "space-y-2"}>
      {label && <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      {value ? (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Change Image
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm transition-all"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Compressing to 500KB & uploading...
              </span>
            </div>
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-medium">{label || "Upload Image"}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {helperText || "Auto-compressed to 500KB"}
              </span>
            </>
          )}
        </button>
      )}
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
