import { useState, useMemo } from "react";
import { format, subDays, parseISO, isSameDay, formatDistanceToNow } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Product, Inquiry } from "@/lib/types";
import { 
  Loader2, 
  ArrowUpRight, 
  Inbox, 
  Clock, 
  Tag, 
  Calendar as CalendarIcon, 
  BarChart3, 
  MessageCircle, 
  TrendingUp,
  Layers,
  Sparkles,
  Trophy,
  Edit3,
  ChevronDown
} from "lucide-react";
import { LeadCalendarView } from "./LeadCalendarView";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; dot: string }> = {
  new: { label: "New Lead", color: "#2563eb", bg: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-600" },
  contacted: { label: "Contacted", color: "#f59e0b", bg: "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  converted: { label: "Converted", color: "#10b981", bg: "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "#8b5cf6", bg: "bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/60", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
};

interface DashboardChartsProps {
  products: Product[];
  inquiries: Inquiry[];
  isLoading?: boolean;
  itemPlural?: string;
  onViewInquiries?: () => void;
  onViewManage?: () => void;
}

export function DashboardCharts({
  products,
  inquiries,
  isLoading,
  itemPlural = "Packages",
  onViewInquiries,
  onViewManage,
}: DashboardChartsProps) {
  const [volumeView, setVolumeView] = useState<"trend" | "calendar">("trend");

  const inquiriesTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const count = inquiries.filter((inq) => {
        try {
          return isSameDay(parseISO(inq.created_at), date);
        } catch {
          return false;
        }
      }).length;
      return {
        day: format(date, "EEE"),
        count,
        fullDate: format(date, "MMM d, yyyy"),
      };
    });
  }, [inquiries]);

  const statusBreakdown = useMemo(() => {
    const total = inquiries.length;
    const counts: Record<string, number> = { new: 0, contacted: 0, converted: 0, closed: 0 };
    inquiries.forEach((inq) => {
      if (counts[inq.status] !== undefined) counts[inq.status]++;
    });

    return (["new", "contacted", "converted", "closed"] as const).map((status) => {
      const value = counts[status];
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      return {
        status,
        ...STATUS_CONFIG[status],
        count: value,
        percentage,
      };
    });
  }, [inquiries]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 5);
  }, [products]);

  const recentInquiries = useMemo(() => {
    return [...inquiries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [inquiries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalWeeklyInquiries = inquiriesTrend.reduce((acc, curr) => acc + curr.count, 0);
  const maxDailyCount = Math.max(...inquiriesTrend.map((d) => d.count), 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Weekly Volume & Pipeline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Weekly Trend or Calendar (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Inquiry Activity & Volume
                </h3>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60">
                  {inquiries.length} Total Leads
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily inquiries recorded across the past 7 days
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVolumeView("trend")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    volumeView === "trend"
                      ? "bg-[#0B132B] text-white shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>7-Day Volume</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVolumeView("calendar")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    volumeView === "calendar"
                      ? "bg-[#0B132B] text-white shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>

              <button className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                <span>This week</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {volumeView === "trend" ? (
            <>
              <div className="h-[210px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inquiriesTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="stroke-slate-200/50 dark:stroke-slate-800/60" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, Math.max(maxDailyCount, 3)]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0B132B] text-white px-3.5 py-2 rounded-xl text-xs shadow-xl border border-slate-800">
                              <p className="font-medium text-slate-400">{data.fullDate}</p>
                              <p className="font-bold text-white mt-0.5 text-sm">
                                {data.count} {data.count === 1 ? "lead" : "leads"}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {totalWeeklyInquiries === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
                  No inquiries recorded this week. New customer submissions will reflect here in real-time.
                </p>
              )}
            </>
          ) : (
            <div className="pt-1">
              <LeadCalendarView
                inquiries={inquiries}
                compact={true}
                onSelectLead={() => onViewInquiries?.()}
              />
            </div>
          )}
        </div>

        {/* Lead Pipeline Breakdown (4 cols) Matching Image 2 */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Lead Pipeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Status breakdown & conversion</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              {inquiries.length} Total
            </span>
          </div>

          <div className="space-y-4 my-auto">
            {statusBreakdown.map((item) => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", item.dot)} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{item.count}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 w-8 text-right font-mono">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage > 0 ? item.percentage : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {onViewInquiries && (
            <button
              onClick={onViewInquiries}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors w-full cursor-pointer group"
            >
              <span>Manage inquiries in CRM</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Recent Inquiries & Catalog Highlights Matching Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Recent Customer Inquiries (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Recent Customer Inquiries</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest leads received across all channels</p>
              </div>
            </div>
            {onViewInquiries && inquiries.length > 0 && (
              <button
                onClick={onViewInquiries}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-0.5 cursor-pointer"
              >
                View all ({inquiries.length})
              </button>
            )}
          </div>

          {recentInquiries.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No customer inquiries yet</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Share your public endpoint or inquiry links with clients to receive leads.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentInquiries.map((inq) => {
                const conf = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                const cleanPhone = inq.contact_no ? inq.contact_no.replace(/[^0-9]/g, "") : "";
                const greeting = encodeURIComponent(
                  `Hello ${inq.customer_name}, thank you for your interest in our travel offerings. How can I assist you?`
                );

                let relativeTime = "";
                let formattedDate = "";
                try {
                  const dateObj = parseISO(inq.created_at);
                  relativeTime = formatDistanceToNow(dateObj, { addSuffix: true });
                  formattedDate = format(dateObj, "MMM d");
                } catch {
                  relativeTime = "";
                  formattedDate = "";
                }

                return (
                  <div key={inq.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-[#0B132B] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {inq.customer_name?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{inq.customer_name}</p>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", conf.bg)}>
                            {conf.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {inq.products?.name || "Kashmir"} {relativeTime ? `• ${relativeTime}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${greeting}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Catalog Packages (6 cols) Matching Image 2 */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Top Catalog {itemPlural}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Highest-value listings in your active catalog</p>
              </div>
            </div>
            {onViewManage && products.length > 0 && (
              <button
                onClick={onViewManage}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-0.5 cursor-pointer"
              >
                View all ({products.length})
              </button>
            )}
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No {itemPlural.toLowerCase()} in catalog</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Add listings to populate pricing and inventory analytics.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {topProducts.map((p) => {
                const title = p.title || p.name;
                const duration = p.duration ?? p.description?.match(/🕐 Duration: (.*)/)?.[1];
                return (
                  <div key={p.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={title}
                          className="w-11 h-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                          {title.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {duration && (
                            <span className="font-medium text-slate-500">
                              {duration} •
                            </span>
                          )}
                          <span className="capitalize">{p.category || "Travel"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">₹{Number(p.price).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {p.stock > 0 ? `${p.stock} slots` : "Sold out"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
