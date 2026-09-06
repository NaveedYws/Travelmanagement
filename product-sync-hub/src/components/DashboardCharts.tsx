import { useMemo } from "react";
import { format, subDays, parseISO, isSameDay } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Product, Inquiry } from "@/lib/types";
import { Loader2, ArrowUpRight, Inbox, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  new: { label: "New", color: "#2563eb", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300" },
  contacted: { label: "Contacted", color: "#d97706", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300" },
  converted: { label: "Converted", color: "#16a34a", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" },
  closed: { label: "Closed", color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" },
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
      <div className="flex items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalWeeklyInquiries = inquiriesTrend.reduce((acc, curr) => acc + curr.count, 0);
  const maxDailyCount = Math.max(...inquiriesTrend.map((d) => d.count), 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Weekly Volume & Pipeline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Inquiry Volume</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily leads recorded across the past 7 days</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalWeeklyInquiries}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1 font-medium">leads this week</span>
            </div>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inquiriesTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, Math.max(maxDailyCount, 3)]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-slate-950 text-white px-3 py-1.5 rounded-lg text-xs shadow-md border border-slate-800">
                          <p className="font-medium text-slate-300">{data.fullDate}</p>
                          <p className="font-semibold text-white mt-0.5">
                            {data.count} {data.count === 1 ? "inquiry" : "inquiries"}
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
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {totalWeeklyInquiries === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
              No inquiries recorded this week. Newly submitted leads will display here automatically.
            </p>
          )}
        </div>

        {/* Lead Pipeline Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lead Pipeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Status breakdown</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {inquiries.length} Total
            </span>
          </div>

          <div className="space-y-3.5 my-auto">
            {statusBreakdown.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 w-8 text-right font-mono">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
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
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-between transition-colors w-full"
            >
              <span>Manage all inquiries</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Recent Inquiries & Catalog Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Inquiries (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Inquiries</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest customer inquiries received</p>
            </div>
            {onViewInquiries && inquiries.length > 0 && (
              <button
                onClick={onViewInquiries}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
              >
                View all ({inquiries.length})
              </button>
            )}
          </div>

          {recentInquiries.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">No customer inquiries yet</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Share your public endpoint or inquiry links with clients to receive leads.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentInquiries.map((inq) => {
                const conf = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                return (
                  <div key={inq.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{inq.customer_name}</p>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border border-transparent", conf.bg, conf.text)}>
                          {conf.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {inq.products?.name || "General Catalog Inquiry"}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                      {format(parseISO(inq.created_at), "MMM d")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Listings / Catalog Highlights (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top {itemPlural}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Highest-value listings in your catalog</p>
            </div>
            {onViewManage && products.length > 0 && (
              <button
                onClick={onViewManage}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
              >
                View all ({products.length})
              </button>
            )}
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">No {itemPlural.toLowerCase()} in catalog</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Add listings to populate pricing and inventory analytics.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                          {title.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                          {duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {duration}
                            </span>
                          )}
                          <span className="capitalize">{p.category || "General"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">₹{Number(p.price).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
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
