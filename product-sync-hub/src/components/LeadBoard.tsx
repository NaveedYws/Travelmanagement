import React, { useState, useEffect, useMemo } from "react";
import {
  SavedQuotation,
  QuotationLeadStatus,
} from "@/lib/types";
import {
  getStoredQuotations,
  fetchQuotationsFromDb,
  updateQuotationStatus,
  deleteQuotation,
  QUOTATIONS_UPDATED_EVENT,
} from "@/lib/quotationStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Kanban,
  Table as TableIcon,
  Search,
  Filter,
  FileText,
  Calendar,
  IndianRupee,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  PauseCircle,
  XCircle,
  Users,
  Plus,
  ArrowUpDown,
  Building,
  Plane,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ItineraryMaker } from "./ItineraryMaker";

export const LEAD_STATUS_OPTIONS: QuotationLeadStatus[] = [
  "In Progress",
  "Hold",
  "Converted",
  "Active",
  "Completed",
  "Canceled",
];

export const LEAD_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  "In Progress": {
    label: "In Progress",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
    icon: Clock,
  },
  Hold: {
    label: "Hold",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: PauseCircle,
  },
  Converted: {
    label: "Converted",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  Active: {
    label: "Active",
    bg: "bg-sky-50 dark:bg-sky-950/60",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    dot: "bg-sky-500",
    icon: Sparkles,
  },
  Completed: {
    label: "Completed",
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    dot: "bg-indigo-500",
    icon: CheckCheck,
  },
  Canceled: {
    label: "Canceled",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
    icon: XCircle,
  },
  Cancel: {
    label: "Canceled",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
    icon: XCircle,
  },
};

interface LeadBoardProps {
  onOpenQuotation?: (quotation: SavedQuotation) => void;
  onGoToPayments?: () => void;
}

export function LeadBoard({ onOpenQuotation, onGoToPayments }: LeadBoardProps) {
  const [quotations, setQuotations] = useState<SavedQuotation[]>(() => getStoredQuotations());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc" | "name">("newest");
  const [selectedLead, setSelectedLead] = useState<SavedQuotation | null>(null);

  // Sync with Database & localStorage & custom quotation events
  useEffect(() => {
    fetchQuotationsFromDb().catch(() => {});
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setQuotations(getStoredQuotations());
    };
    handleUpdate();
    window.addEventListener(QUOTATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(QUOTATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Update Status handler with dropdown
  const handleStatusChange = (id: string, newStatus: QuotationLeadStatus) => {
    const lead = quotations.find((q) => q.id === id);
    const updated = updateQuotationStatus(id, newStatus);
    if (updated) {
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus, updatedAt: updated.updatedAt } : q))
      );
      if (selectedLead?.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success(
        `Status for "${lead?.clientName || "Lead"}" updated to ${newStatus}`
      );
    }
  };

  // Delete lead handler
  const handleDeleteLead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const lead = quotations.find((q) => q.id === id);
    if (window.confirm(`Are you sure you want to delete lead "${lead?.clientName || "Lead"}"?`)) {
      deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
      toast.success("Lead quotation removed");
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = quotations.length;
    const totalValue = quotations.reduce((acc, q) => acc + (Number(q.finalQuotationTotal) || 0), 0);
    const inProgressCount = quotations.filter((q) => (q.status || "In Progress") === "In Progress").length;
    const holdCount = quotations.filter((q) => q.status === "Hold").length;
    const convertedCount = quotations.filter((q) => q.status === "Converted").length;
    const activeCount = quotations.filter((q) => q.status === "Active").length;
    const completedCount = quotations.filter((q) => q.status === "Completed").length;
    const cancelCount = quotations.filter((q) => q.status === "Canceled" || q.status === "Cancel").length;

    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;
    const convertedValue = quotations
      .filter((q) => q.status === "Converted" || q.status === "Completed")
      .reduce((acc, q) => acc + (Number(q.finalQuotationTotal) || 0), 0);

    return {
      total,
      totalValue,
      inProgressCount,
      holdCount,
      convertedCount,
      activeCount,
      completedCount,
      cancelCount,
      conversionRate,
      convertedValue,
    };
  }, [quotations]);

  // Filter & Search
  const filteredQuotations = useMemo(() => {
    return quotations
      .filter((q) => {
        // Status filter
        const currentStatus = (q.status as QuotationLeadStatus) || "In Progress";
        if (statusFilter !== "all") {
          if (statusFilter === "Canceled") {
            if (currentStatus !== "Canceled" && currentStatus !== "Cancel") return false;
          } else if (currentStatus !== statusFilter) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = (q.clientName || "").toLowerCase().includes(query);
          const matchTitle = (q.tripTitle || "").toLowerCase().includes(query);
          const matchDest = (q.destination || "").toLowerCase().includes(query);
          const matchRef = (q.quotationRef || "").toLowerCase().includes(query);
          const matchPhone = (q.clientPhone || "").toLowerCase().includes(query);
          const matchEmail = (q.clientEmail || "").toLowerCase().includes(query);
          if (!matchName && !matchTitle && !matchDest && !matchRef && !matchPhone && !matchEmail) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tB - tA;
        }
        if (sortBy === "oldest") {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tA - tB;
        }
        if (sortBy === "amount_desc") {
          return (Number(b.finalQuotationTotal) || 0) - (Number(a.finalQuotationTotal) || 0);
        }
        if (sortBy === "amount_asc") {
          return (Number(a.finalQuotationTotal) || 0) - (Number(b.finalQuotationTotal) || 0);
        }
        if (sortBy === "name") {
          return (a.clientName || "").localeCompare(b.clientName || "");
        }
        return 0;
      });
  }, [quotations, searchQuery, statusFilter, sortBy]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // WhatsApp link helper
  const getWhatsAppLink = (lead: SavedQuotation) => {
    const phone = (lead.clientPhone || "").replace(/[^0-9]/g, "");
    const name = lead.clientName || "Valued Client";
    const title = lead.tripTitle || lead.destination || "Tour Package";
    const amount = Number(lead.finalQuotationTotal) || 0;
    const text = encodeURIComponent(
      `Hello ${name}, thank you for your interest in our ${title} quotation${amount > 0 ? ` (Quoted: ₹${amount.toLocaleString("en-IN")})` : ""}. Please let us know if you have any questions or would like to proceed with the booking!`
    );
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-xs">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Lead Board
                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {quotations.length} {quotations.length === 1 ? "Quotation" : "Quotations"}
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage clients from generated quotations, quoted amounts, and real-time lead pipeline statuses
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "board"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          {/* View Payments Button */}
          {onGoToPayments && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToPayments}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Payment Details ({metrics.convertedCount})</span>
            </Button>
          )}

          {/* Create Quotation Button */}
          <ItineraryMaker
            trigger={
              <button className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2 shadow-md shadow-blue-500/20 transition-all flex items-center cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Create Quotation</span>
              </button>
            }
          />
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Pipeline Value */}
        <div
          onClick={() => setStatusFilter("all")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all col-span-2 sm:col-span-1",
            statusFilter === "all" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Value</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            ₹{metrics.totalValue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.total} quotations
          </p>
        </div>

        {/* 1. In Progress */}
        <div
          onClick={() => setStatusFilter("In Progress")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all",
            statusFilter === "In Progress" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">1. In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {metrics.inProgressCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending client decision</p>
        </div>

        {/* 2. Hold */}
        <div
          onClick={() => setStatusFilter("Hold")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all",
            statusFilter === "Hold" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">2. Hold</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PauseCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {metrics.holdCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">On hold / follow up</p>
        </div>

        {/* 3. Converted */}
        <div
          onClick={() => setStatusFilter("Converted")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all",
            statusFilter === "Converted" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">3. Converted</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {metrics.convertedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.conversionRate}% conversion
          </p>
        </div>

        {/* 4. Active */}
        <div
          onClick={() => setStatusFilter("Active")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all",
            statusFilter === "Active" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">4. Active</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {metrics.activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Actively engaged</p>
        </div>

        {/* 5. Completed */}
        <div
          onClick={() => setStatusFilter("Completed")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all",
            statusFilter === "Completed" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">5. Completed</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {metrics.completedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Trip concluded</p>
        </div>

        {/* 6. Canceled */}
        <div
          onClick={() => setStatusFilter("Canceled")}
          className={cn(
            "bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all",
            statusFilter === "Canceled" && "ring-2 ring-blue-500"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">6. Canceled</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {metrics.cancelCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Canceled / dropped</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by client name, trip title, destination, phone, quotation ref..."
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer",
              statusFilter === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            All ({quotations.length})
          </button>
          {LEAD_STATUS_OPTIONS.map((st) => {
            const count = quotations.filter((q) => {
              const s = (q.status as QuotationLeadStatus) || "In Progress";
              if (st === "Canceled") return s === "Canceled" || s === "Cancel";
              return s === st;
            }).length;
            const cfg = LEAD_STATUS_CONFIG[st];
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? cn(cfg.bg, cfg.text, cfg.border, "border shadow-xs")
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                <span>{st}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="shrink-0 flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-9 text-xs w-[170px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount_desc">Amount: High to Low</SelectItem>
              <SelectItem value="amount_asc">Amount: Low to High</SelectItem>
              <SelectItem value="name">Client Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area: Table vs Board */}
      {filteredQuotations.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0e131f] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Kanban className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 font-bold text-base">
              {searchQuery.trim() || statusFilter !== "all"
                ? "No matching quotation leads found"
                : "No leads on the board yet"}
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
              {searchQuery.trim() || statusFilter !== "all"
                ? "Try clearing the search query or changing your status filter."
                : "When you create and download a quotation from Create Quotation, it will automatically appear here with client name, quotation date, quoted amount, and real-time status tracking."}
            </p>
          </div>
          {searchQuery.trim() || statusFilter !== "all" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          ) : (
            <ItineraryMaker
              trigger={
                <Button className="text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Quotation
                </Button>
              }
            />
          )}
        </div>
      ) : viewMode === "table" ? (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-900/60 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Client / Lead Name
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Quotation Date
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Package & Destination
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Quoted Amount
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 min-w-[170px]">
                    Status (Live Dropdown)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((lead) => {
                  const rawStatus = (lead.status as QuotationLeadStatus) || "In Progress";
                  const currentStatus = (rawStatus === "Cancel" ? "Canceled" : rawStatus) as QuotationLeadStatus;
                  const cfg = LEAD_STATUS_CONFIG[currentStatus] || LEAD_STATUS_CONFIG["In Progress"];
                  const initial = (lead.clientName?.[0] || lead.tripTitle?.[0] || "L").toUpperCase();
                  const totalAmount = Number(lead.finalQuotationTotal) || 0;

                  return (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
                      onClick={() => {
                        if (onOpenQuotation) {
                          onOpenQuotation(lead);
                        } else {
                          setSelectedLead(lead);
                        }
                      }}
                    >
                      {/* 1. Client / Lead Name */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 transition-colors">
                              {lead.clientName || "Untitled Client"}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
                              {lead.quotationRef && (
                                <span className="font-mono text-slate-500 dark:text-slate-400">
                                  {lead.quotationRef}
                                </span>
                              )}
                              {lead.clientPhone && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {lead.clientPhone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Quotation Date */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.quotationDate || formatDate(lead.createdAt)}</span>
                        </div>
                      </TableCell>

                      {/* 3. Package & Destination */}
                      <TableCell className="py-3.5">
                        <div className="max-w-[220px]">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {lead.tripTitle || lead.destination || "Custom Itinerary"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {lead.destination || "Destination TBD"}
                            {lead.adults && ` · ${lead.adults} Adults`}
                          </p>
                        </div>
                      </TableCell>

                      {/* 4. Quoted Amount */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums flex items-center gap-0.5">
                            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                          {lead.amountMode === "manual" ? (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                              Manual Rate
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Calculated
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* 5. Status Interactive Dropdown */}
                      <TableCell className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={currentStatus}
                          onValueChange={(newStatus: QuotationLeadStatus) =>
                            handleStatusChange(lead.id, newStatus)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 text-xs font-semibold rounded-lg border transition-all w-[150px]",
                              cfg.bg,
                              cfg.text,
                              cfg.border
                            )}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                              <SelectValue placeholder="Status" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUS_OPTIONS.map((opt) => {
                              const itemCfg = LEAD_STATUS_CONFIG[opt];
                              return (
                                <SelectItem key={opt} value={opt} className="text-xs font-medium cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full", itemCfg.dot)} />
                                    <span>{opt}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* 6. Quick Action Buttons */}
                      <TableCell className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Chat Button */}
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                            title="Message on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Reopen in Quotation Studio */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenQuotation) {
                                onOpenQuotation(lead);
                              } else {
                                setSelectedLead(lead);
                              }
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                            title="Open & Edit Quotation"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Delete Lead */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLead(lead.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Delete quotation lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {LEAD_STATUS_OPTIONS.map((statusKey) => {
            const columnLeads = filteredQuotations.filter((q) => {
              const s = (q.status as QuotationLeadStatus) || "In Progress";
              if (statusKey === "Canceled") return s === "Canceled" || s === "Cancel";
              return s === statusKey;
            });
            const cfg = LEAD_STATUS_CONFIG[statusKey];
            const colTotalValue = columnLeads.reduce(
              (sum, q) => sum + (Number(q.finalQuotationTotal) || 0),
              0
            );

            return (
              <div
                key={statusKey}
                className="bg-slate-100/70 dark:bg-[#0c101a] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-3 min-h-[420px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {statusKey}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {columnLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                    ₹{colTotalValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
                  {columnLeads.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                      No leads in {statusKey}
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const totalAmount = Number(lead.finalQuotationTotal) || 0;
                      return (
                        <Card
                          key={lead.id}
                          onClick={() => {
                            if (onOpenQuotation) {
                              onOpenQuotation(lead);
                            } else {
                              setSelectedLead(lead);
                            }
                          }}
                          className="bg-white dark:bg-[#0e131f] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer group"
                        >
                          <CardContent className="p-3.5 space-y-3">
                            {/* Card Top: Client Name & Quotation Date */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                                  {lead.clientName || "Untitled Client"}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {lead.tripTitle || lead.destination || "Custom Quotation"}
                                </p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {lead.quotationDate || formatDate(lead.createdAt)}
                              </span>
                            </div>

                            {/* Destination & Pax tags */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                              {lead.destination && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {lead.destination}
                                </span>
                              )}
                              {lead.adults && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                  {lead.adults} Pax
                                </span>
                              )}
                            </div>

                            {/* Quoted Price */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Quoted Amount</span>
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                                  ₹{totalAmount.toLocaleString("en-IN")}
                                </span>
                              </div>

                              {/* Reopen Action Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenQuotation) {
                                    onOpenQuotation(lead);
                                  } else {
                                    setSelectedLead(lead);
                                  }
                                }}
                                className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                                title="Open Quotation"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Status changer dropdown on Card */}
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={statusKey}
                                onValueChange={(newStatus: QuotationLeadStatus) =>
                                  handleStatusChange(lead.id, newStatus)
                                }
                              >
                                <SelectTrigger className="h-7 text-[11px] font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {LEAD_STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt} className="text-xs">
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Lead Modal (for quick inspection if not reopening studio) */}
      {selectedLead && (
        <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {selectedLead.quotationRef || "QUOTATION"}
                </Badge>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      LEAD_STATUS_CONFIG[(selectedLead.status as QuotationLeadStatus) || "In Progress"]?.dot
                    )}
                  />
                  <span className="text-xs font-semibold">
                    {selectedLead.status || "In Progress"}
                  </span>
                </div>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                {selectedLead.clientName || "Valued Client"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedLead.tripTitle || selectedLead.destination || "Travel Quotation Lead"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-xs">
              {/* Quoted Amount Highlight */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Quoted Total</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    ₹{(Number(selectedLead.finalQuotationTotal) || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px] font-medium">Date</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedLead.quotationDate || formatDate(selectedLead.createdAt)}
                  </span>
                </div>
              </div>

              {/* Contact details */}
              <div className="space-y-2">
                {selectedLead.clientPhone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.clientPhone}</span>
                  </div>
                )}
                {selectedLead.clientEmail && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.clientEmail}</span>
                  </div>
                )}
                {selectedLead.destination && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.destination}</span>
                  </div>
                )}
              </div>

              {/* Status Selector in Modal */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Update Lead Status
                </label>
                <Select
                  value={
                    selectedLead.status === "Cancel"
                      ? "Canceled"
                      : (selectedLead.status as QuotationLeadStatus) || "In Progress"
                  }
                  onValueChange={(val: QuotationLeadStatus) => handleStatusChange(selectedLead.id, val)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3">
                <a
                  href={getWhatsAppLink(selectedLead)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </Button>
                </a>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onOpenQuotation) {
                      onOpenQuotation(selectedLead);
                      setSelectedLead(null);
                    }
                  }}
                  className="flex-1 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Edit Quotation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
