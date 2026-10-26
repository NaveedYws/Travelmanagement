import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO
} from "date-fns";
import { Inquiry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Phone,
  MessageCircle,
  Mail,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Facebook,
  Globe,
  FileSpreadsheet,
  FileText,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIGS = {
  new: {
    label: "New",
    color: "#2563eb",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  contacted: {
    label: "Contacted",
    color: "#d97706",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  converted: {
    label: "Converted",
    color: "#16a34a",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    color: "#64748b",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
};

interface LeadCalendarViewProps {
  inquiries: Inquiry[];
  onSelectLead?: (lead: Inquiry) => void;
  onUpdateStatus?: (id: string, status: "new" | "contacted" | "converted" | "closed") => void;
  compact?: boolean;
}

export function LeadCalendarView({
  inquiries,
  onSelectLead,
  onUpdateStatus,
  compact = false,
}: LeadCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Group inquiries by date "yyyy-MM-dd"
  const inquiriesByDate = useMemo(() => {
    const map = new Map<string, Inquiry[]>();

    inquiries.forEach((inq) => {
      try {
        let d: Date;
        if (inq.created_at.includes("T") || inq.created_at.includes("-")) {
          // Normalize standard date string
          d = new Date(inq.created_at.replace(" ", "T"));
        } else {
          d = new Date(inq.created_at);
        }

        if (isNaN(d.getTime())) return;

        const dateKey = format(d, "yyyy-MM-dd");
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(inq);
      } catch (err) {
        // Silently continue for invalid dates
      }
    });

    return map;
  }, [inquiries]);

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Leads for the selected date
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayLeads = useMemo(() => {
    const list = inquiriesByDate.get(selectedDateKey) || [];
    if (statusFilter === "all") return list;
    return list.filter((l) => l.status === statusFilter);
  }, [inquiriesByDate, selectedDateKey, statusFilter]);

  // Monthly statistics
  const monthStats = useMemo(() => {
    const monthKey = format(currentMonth, "yyyy-MM");
    let total = 0;
    let newCount = 0;
    let contactedCount = 0;
    let convertedCount = 0;

    inquiries.forEach((inq) => {
      try {
        const d = new Date(inq.created_at.replace(" ", "T"));
        if (format(d, "yyyy-MM") === monthKey) {
          total++;
          if (inq.status === "new") newCount++;
          if (inq.status === "contacted") contactedCount++;
          if (inq.status === "converted") convertedCount++;
        }
      } catch {}
    });

    return { total, newCount, contactedCount, convertedCount };
  }, [inquiries, currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const getSourceIcon = (source?: string | null) => {
    if (source === "meta_ads") return <Facebook className="w-3 h-3 text-blue-600" />;
    if (source === "google_ads") return <Globe className="w-3 h-3 text-amber-600" />;
    if (source === "csv_import") return <FileSpreadsheet className="w-3 h-3 text-emerald-600" />;
    if (source === "pdf_import") return <FileText className="w-3 h-3 text-rose-500" />;
    return <Globe className="w-3 h-3 text-purple-600" />;
  };

  return (
    <div className={cn("space-y-4", compact ? "" : "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm")}>
      {/* Month Navigation & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700"
              onClick={handlePrevMonth}
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700"
              onClick={handleNextMonth}
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{format(currentMonth, "MMMM yyyy")}</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {monthStats.total} leads recorded this month
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-7 text-xs font-semibold px-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            Today
          </Button>
        </div>

        {/* Status Indicators Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>New: {monthStats.newCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Contacted: {monthStats.contactedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Converted: {monthStats.convertedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar on left, Selected Day Leads on right */}
      <div className={cn("grid gap-5", compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12")}>
        {/* Left Calendar Matrix (8 cols on full, full width on compact) */}
        <div className={cn("space-y-1.5", compact ? "w-full" : "lg:col-span-8")}>
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-slate-500 dark:text-slate-400 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayLeads = inquiriesByDate.get(dayKey) || [];
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const isDaySelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);

              const hasLeads = dayLeads.length > 0;
              const newLeadsCount = dayLeads.filter((l) => l.status === "new").length;
              const convertedLeadsCount = dayLeads.filter((l) => l.status === "converted").length;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col justify-between p-1.5 rounded-lg border text-left transition-all min-h-[64px] sm:min-h-[76px] cursor-pointer relative group",
                    isCurrentMonthDay
                      ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500"
                      : "bg-slate-50/50 dark:bg-slate-950/50 border-transparent text-slate-400 dark:text-slate-600 opacity-60",
                    isDaySelected &&
                      "ring-2 ring-blue-600 dark:ring-blue-500 border-blue-600 dark:border-blue-500 shadow-xs z-10",
                    isTodayDay && "bg-blue-50/30 dark:bg-blue-950/20"
                  )}
                >
                  {/* Day Number and Today Marker */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "text-xs font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full",
                        isTodayDay
                          ? "bg-blue-600 text-white font-bold"
                          : isCurrentMonthDay
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-400"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Total Leads Count Badge */}
                    {hasLeads && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono",
                          newLeadsCount > 0
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        )}
                      >
                        {dayLeads.length}
                      </span>
                    )}
                  </div>

                  {/* Leads Preview Dots or Micro Labels */}
                  {hasLeads ? (
                    <div className="space-y-1 w-full pt-1">
                      {/* Status Dots */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {dayLeads.slice(0, 5).map((l, idx) => {
                          const cfg = STATUS_CONFIGS[l.status] || STATUS_CONFIGS.new;
                          return (
                            <span
                              key={idx}
                              className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)}
                              title={`${l.customer_name} (${l.status})`}
                            />
                          );
                        })}
                        {dayLeads.length > 5 && (
                          <span className="text-[9px] font-mono text-slate-400">+{dayLeads.length - 5}</span>
                        )}
                      </div>

                      {/* Snippet on Desktop */}
                      <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate hidden sm:block">
                        {dayLeads[0].customer_name}
                      </p>
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Leads on Selected Day (4 cols on full) */}
        <div className={cn("space-y-3 flex flex-col", compact ? "w-full" : "lg:col-span-4")}>
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 flex-1 flex flex-col">
            {/* Header for Day's Leads */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {format(selectedDate, "EEE, MMM d, yyyy")}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedDayLeads.length} {selectedDayLeads.length === 1 ? "lead" : "leads"} recorded
                </p>
              </div>

              {selectedDayLeads.length > 0 && (
                <div className="flex items-center gap-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300"
                  >
                    <option value="all">All</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
            </div>

            {/* List of Leads */}
            {selectedDayLeads.length === 0 ? (
              <div className="py-10 text-center my-auto space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No inquiries on this date
                </p>
                <p className="text-[11px] text-slate-400">
                  Select another day or check days with blue count badges.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                {selectedDayLeads.map((inq) => {
                  const cfg = STATUS_CONFIGS[inq.status] || STATUS_CONFIGS.new;
                  const timeFormatted = inq.created_at
                    ? new Date(inq.created_at.replace(" ", "T")).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  const cleanPhone = inq.contact_no ? inq.contact_no.replace(/[^0-9]/g, "") : "";
                  const waGreeting = encodeURIComponent(
                    `Hello ${inq.customer_name}, thank you for your inquiry${
                      inq.products?.name ? ` about ${inq.products.name}` : ""
                    }. How can I assist you?`
                  );

                  return (
                    <div
                      key={inq.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {inq.customer_name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{inq.contact_no}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase px-1.5 py-0", cfg.badgeClass)}>
                            {cfg.label}
                          </Badge>
                          {timeFormatted && (
                            <span className="text-[10px] font-mono text-slate-400">{timeFormatted}</span>
                          )}
                        </div>
                      </div>

                      {/* Package & Source */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        {inq.products?.name && (
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium truncate max-w-[170px]">
                            <Package className="w-3 h-3 text-slate-400" />
                            {inq.products.name}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          {getSourceIcon(inq.source)}
                          <span className="capitalize">{inq.source?.replace("_", " ") || "Inquiry"}</span>
                        </span>
                      </div>

                      {/* Message preview */}
                      {(inq.clean_message || inq.message) && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 italic">
                          "{inq.clean_message || inq.message}"
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        {onUpdateStatus ? (
                          <select
                            value={inq.status}
                            onChange={(e) => onUpdateStatus(inq.id, e.target.value as any)}
                            className="text-[10px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-slate-700 dark:text-slate-300"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="closed">Closed</option>
                          </select>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${waGreeting}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold shadow-xs"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          )}

                          {onSelectLead && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => onSelectLead(inq)}
                            >
                              Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
