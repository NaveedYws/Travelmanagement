import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  Check, 
  ExternalLink, 
  BookOpen, 
  Package, 
  Zap, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Code2,
  Terminal,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function ApiLinkCard() {
  const { user } = useAuth();
  const [activeApi, setActiveApi] = useState<"products" | "blogs">("products");
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const apiUrlBase = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const productsUrl = user ? `${apiUrlBase}/api/public/products.php?user_id=${user.id}` : "";
  const blogsUrl = user ? `${apiUrlBase}/api/public/blogs.php?user_id=${user.id}` : "";

  const apiUrl = activeApi === "products" ? productsUrl : blogsUrl;
  const curlSnippet = `curl -X GET "${apiUrl}"`;

  const copyToClipboard = () => {
    if (!apiUrl) return;
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    toast.success(`${activeApi === "products" ? "Packages" : "Blogs"} API Endpoint copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCurl = () => {
    if (!apiUrl) return;
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    toast.success("cURL command copied to clipboard");
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full transition-all">
      <div>
        {/* Top Header & Segmented Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  Headless REST API
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live sync feed for your Next.js, mobile app, or WordPress site
              </p>
            </div>
          </div>

          {/* Clean Segmented Tab Control */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveApi("products");
                setCopied(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeApi === "products"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Packages</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveApi("blogs");
                setCopied(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeApi === "blogs"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Articles</span>
            </button>
          </div>
        </div>

        {/* Developer Console Box */}
        <div className="bg-slate-950 dark:bg-[#070a10] border border-slate-800/80 rounded-xl p-3 sm:p-3.5 space-y-2.5 my-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="font-mono text-slate-300">Endpoint URL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-500">FORMAT: JSON</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[10px] text-emerald-400">200 OK</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
            <div 
              onClick={() => !isVisible && setIsVisible(true)}
              className={`flex items-center gap-2 overflow-hidden flex-1 ${!isVisible ? "cursor-pointer" : ""}`}
              title={!isVisible ? "Click to reveal endpoint" : undefined}
            >
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 shrink-0">
                GET
              </span>
              {isVisible ? (
                <code className="text-xs font-mono text-slate-200 truncate select-all flex-1">
                  {apiUrl || "Generating endpoint..."}
                </code>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-mono text-xs truncate">
                  <span className="tracking-widest text-[11px] truncate">••••••••••••••••••••••••••••••••••••••••••••••••</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-sans font-medium shrink-0">
                    Click to view
                  </span>
                </div>
              )}
            </div>

            {/* Actions Button Cluster */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="h-7 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{isVisible ? "Mask" : "Reveal"}</span>
              </button>

              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!apiUrl}
                className="h-7 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              {apiUrl && (
                <a
                  href={apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Open live endpoint in browser"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {activeApi === "products"
            ? "Returns complete packages with itineraries, hotels, prices, discounts, and high-res image assets."
            : "Returns published travel blog articles with SEO meta, categories, and optimized media for your frontend."}
        </p>
      </div>

      {/* Modern Spec Badges */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-500" /> Real-time Sync
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> CORS Allowed
          </span>
        </div>
        <button
          type="button"
          onClick={copyCurl}
          className="font-mono text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Terminal className="w-3 h-3" />
          <span>{copiedCurl ? "cURL Copied!" : "Copy cURL"}</span>
        </button>
      </div>
    </div>
  );
}
