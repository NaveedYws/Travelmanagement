import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Globe, BookOpen, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function BlogApiLinkCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rawBase = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();
  const apiUrlBase = (rawBase.startsWith("http://") || rawBase.startsWith("https://") ? rawBase : `https://${rawBase}`).replace(/\/+$/, "");
  const apiUrl = user ? `${apiUrlBase}/api/public/blogs.php?user_id=${user.id}` : "";

  const copyToClipboard = () => {
    if (!apiUrl) return;
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    toast.success("Blog API Endpoint copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Public Blog API Endpoint</h3>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">JSON • Realtime • SEO Ready</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Use this URL to feed and synchronize your published blogs, 2-image assets, and complete SEO metadata directly to your public website, headless CMS, or mobile app.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div
          onClick={() => !isVisible && setIsVisible(true)}
          className={`flex-1 flex items-center gap-2 px-2.5 py-1 min-w-0 ${!isVisible ? "cursor-pointer select-none" : ""}`}
          title={!isVisible ? "Click View button or click here to reveal endpoint" : undefined}
        >
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 shrink-0">
            GET
          </span>
          {isVisible ? (
            <code className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-all flex-1 animate-in fade-in duration-200">
              {apiUrl || "Generating endpoint..."}
            </code>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0 text-slate-400 dark:text-slate-500 font-mono text-xs">
              <span className="tracking-[0.25em] text-[13px] truncate">••••••••••••••••••••••••••••••••••••••••</span>
              <span className="text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded font-sans shrink-0 hidden sm:inline-block">Hidden</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 px-1 pb-1 sm:pb-0">
          <Button
            type="button"
            variant={isVisible ? "outline" : "default"}
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer transition-all ${
              isVisible
                ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            }`}
          >
            {isVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!apiUrl}
            className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Copy URL</span>
              </>
            )}
          </Button>

          {apiUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs shadow-2xs cursor-pointer"
            >
              <a href={apiUrl} target="_blank" rel="noopener noreferrer" title="Test in browser">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
