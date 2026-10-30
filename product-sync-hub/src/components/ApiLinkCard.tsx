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
  Play
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function ApiLinkCard() {
  const { user } = useAuth();
  const [activeApi, setActiveApi] = useState<"products" | "blogs">("products");
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rawBase = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();
  const apiUrlBase = (rawBase.startsWith("http://") || rawBase.startsWith("https://") ? rawBase : `https://${rawBase}`).replace(/\/+$/, "");

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

  const handleTestApi = () => {
    if (!apiUrl) return;
    window.open(apiUrl, "_blank", "noopener,noreferrer");
    toast.info("Opening live endpoint in browser...");
  };

  return (
    <div className="bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full transition-all">
      <div>
        {/* Top Header & Segmented Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Headless REST API
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
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

          {/* Switcher Tabs styled like Image 2 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveApi("products");
                setCopied(false);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeApi === "products"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeApi === "blogs"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Articles</span>
            </button>
          </div>
        </div>

        {/* Developer Console Box Matching Image 2 */}
        <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3 my-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="font-mono text-slate-300 text-xs">Endpoint URL</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-slate-500">FORMAT: JSON</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">200 OK</span>
            </div>
          </div>

          {/* URL Input Box with Copy icon & Blue GET Badge */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-[#070B14] rounded-lg border border-slate-800">
            <div 
              onClick={() => !isVisible && setIsVisible(true)}
              className={`flex-1 flex items-center gap-2 px-2 overflow-hidden min-w-0 ${!isVisible ? "cursor-pointer" : ""}`}
              title={!isVisible ? "Click to reveal endpoint" : undefined}
            >
              {isVisible ? (
                <code className="text-xs font-mono text-slate-200 truncate select-all flex-1">
                  {apiUrl || "Generating endpoint..."}
                </code>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-mono text-xs truncate">
                  <span className="tracking-widest text-[11px] truncate">••••••••••••••••••••••••••••••••••••••••••••••••</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={copyToClipboard}
                title="Copy endpoint"
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-blue-600 text-white shadow-xs">
                GET
              </span>
            </div>
          </div>

          {/* Button Row Matching Image 2: Test API, Reveal/Mask, Copy */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestApi}
              disabled={!apiUrl}
              className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-blue-400 fill-blue-400" />
              <span>Test API</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isVisible ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isVisible ? "Mask" : "Reveal"}</span>
            </button>

            <button
              type="button"
              onClick={copyToClipboard}
              disabled={!apiUrl}
              className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Spec Badges Matching Image 2 */}
      <div className="pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 sm:gap-4 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
            <span>Real-time Sync</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
            <span>CORS Allowed</span>
          </span>
        </div>
        <button
          type="button"
          onClick={copyCurl}
          className="font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{copiedCurl ? "cURL Copied!" : "Copy cURL"}</span>
        </button>
      </div>
    </div>
  );
}
