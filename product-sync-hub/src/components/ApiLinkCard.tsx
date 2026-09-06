import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function ApiLinkCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const apiUrlBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const apiUrl = user
    ? `${apiUrlBase}/api/public/products.php?user_id=${user.id}`
    : "";

  const copyToClipboard = () => {
    if (!apiUrl) return;
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    toast.success("API Endpoint copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Public API Endpoint</h3>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">JSON • Realtime</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Use this URL to integrate and sync your live listings with your website, apps, or partner portals.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 min-w-0">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">GET</span>
          <code className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-all flex-1">
            {apiUrl || "Generating endpoint..."}
          </code>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!apiUrl}
            className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium gap-1.5"
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
              className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
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
