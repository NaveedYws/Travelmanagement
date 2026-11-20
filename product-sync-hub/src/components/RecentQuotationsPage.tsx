import React, { useState, useEffect, useMemo } from "react";
import {
  SavedQuotation,
  QuotationLeadStatus,
} from "@/lib/types";
import {
  getRecentQuotations,
  getStoredQuotations,
  fetchQuotationsFromDb,
  updateQuotationStatus,
  deleteQuotation,
  QUOTATIONS_UPDATED_EVENT,
} from "@/lib/quotationStorage";
import {
  LEAD_STATUS_OPTIONS,
  LEAD_STATUS_CONFIG,
} from "@/components/LeadBoard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Pencil,
  Search,
  Plus,
  Trash2,
  MessageCircle,
  MapPin,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ItineraryMaker } from "./ItineraryMaker";

interface RecentQuotationsPageProps {
  onOpenQuotation: (quotation: SavedQuotation) => void;
  onGoToLeadBoard?: () => void;
}

export function RecentQuotationsPage({
  onOpenQuotation,
  onGoToLeadBoard,
}: RecentQuotationsPageProps) {
  const [quotations, setQuotations] = useState<SavedQuotation[]>(() =>
    getRecentQuotations(5)
  );
  const [totalCount, setTotalCount] = useState<number>(() =>
    getStoredQuotations().length
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Sync with Database & localStorage & custom quotation events
  useEffect(() => {
    fetchQuotationsFromDb().catch(() => {});
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setQuotations(getRecentQuotations(5));
      setTotalCount(getStoredQuotations().length);
    };
    handleUpdate();
    window.addEventListener(QUOTATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(QUOTATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

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
    const total = Number(lead.finalQuotationTotal) || 0;
    const msg = encodeURIComponent(
      `Hi ${name}, this is regarding your quotation for "${title}" (Total: ₹${total.toLocaleString("en-IN")}). Let us know if you have any questions or would like to proceed!`
    );
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  };

  // Status Change handler
  const handleStatusChange = (id: string, newStatus: QuotationLeadStatus) => {
    const lead = quotations.find((q) => q.id === id);
    const updated = updateQuotationStatus(id, newStatus);
    if (updated) {
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      );
      toast.success(
        `Status for "${lead?.clientName || "Quotation"}" updated to ${newStatus}`
      );
    }
  };

  // Delete quotation handler
  const handleDelete = (id: string, clientName?: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete quotation for "${clientName || "Lead"}"?`
      )
    ) {
      deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quotation deleted");
    }
  };

  // Filtered list based on search query
  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) return quotations;
    const q = searchQuery.toLowerCase();
    return quotations.filter(
      (item) =>
        (item.clientName || "").toLowerCase().includes(q) ||
        (item.tripTitle || "").toLowerCase().includes(q) ||
        (item.destination || "").toLowerCase().includes(q) ||
        (item.quotationRef || "").toLowerCase().includes(q) ||
        (item.clientPhone || "").toLowerCase().includes(q) ||
        (item.clientEmail || "").toLowerCase().includes(q)
    );
  }, [quotations, searchQuery]);

  // Total value of the last 5 quotations
  const totalValue = useMemo(() => {
    return quotations.reduce(
      (acc, q) => acc + (Number(q.finalQuotationTotal) || 0),
      0
    );
  }, [quotations]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Last 5 Quotations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View, manage, and edit your 5 most recent quotation drafts and packages.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onGoToLeadBoard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGoToLeadBoard}
              className="text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <span>Lead Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}

          <ItineraryMaker
            trigger={
              <Button
                type="button"
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Quotation</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* KPI Cards Row (Single Blue Unified Color) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-[#0e131f] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Recent Quotations Shown
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            {quotations.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Out of {totalCount} total stored quotations
          </p>
        </div>

        <div className="bg-white dark:bg-[#0e131f] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Quoted Value
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
            ₹{totalValue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Combined total across last {quotations.length} quotes
          </p>
        </div>

        <div className="bg-white dark:bg-[#0e131f] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Latest Activity
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
            {quotations[0] ? `Latest: ${quotations[0].clientName || "Quotation"}` : "No quotations yet"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {quotations[0]?.tripTitle || quotations[0]?.destination || "Ready for new quotes"}
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-[#0e131f] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, destination, trip title, quotation ref..."
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Main Table: Name, Date, Trip, Amount, Status, and Edit Option */}
      <div className="bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No quotations found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No quotation matches "${searchQuery}". Clear your search to see all recent quotes.`
                : "Create your first quotation in the Quotation Studio to see it here."}
            </p>
            {!searchQuery && (
              <div className="pt-2">
                <ItineraryMaker
                  trigger={
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Create Quotation
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-900/60 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 min-w-[220px]">
                    Name (Client / Lead)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 min-w-[130px]">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 min-w-[180px]">
                    Destination & Tour
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 min-w-[140px]">
                    Quoted Amount
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 min-w-[160px]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 text-right min-w-[140px]">
                    Edit Option
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((q) => {
                  const initial = (
                    q.clientName?.[0] ||
                    q.tripTitle?.[0] ||
                    "Q"
                  ).toUpperCase();
                  const total = Number(q.finalQuotationTotal) || 0;
                  const rawStatus = (q.status as QuotationLeadStatus) || "In Progress";
                  const currentStatus = (rawStatus === "Cancel" ? "Canceled" : rawStatus) as QuotationLeadStatus;
                  const statusCfg =
                    LEAD_STATUS_CONFIG[currentStatus] ||
                    LEAD_STATUS_CONFIG["In Progress"];

                  return (
                    <TableRow
                      key={q.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
                      onClick={() => onOpenQuotation(q)}
                    >
                      {/* 1. Name Column */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 transition-colors">
                              {q.clientName || "Untitled Client"}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              {q.quotationRef && (
                                <span className="font-mono text-slate-500 dark:text-slate-400">
                                  {q.quotationRef}
                                </span>
                              )}
                              {q.clientPhone && (
                                <>
                                  <span>·</span>
                                  <span>{q.clientPhone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Date Column */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">
                            {q.quotationDate || formatDate(q.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Destination & Tour Column */}
                      <TableCell className="py-3.5">
                        <div className="max-w-[200px]">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {q.tripTitle || q.destination || "Custom Itinerary"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{q.destination || "Destination TBD"}</span>
                            {q.adults && <span>· {q.adults} Adults</span>}
                          </p>
                        </div>
                      </TableCell>

                      {/* 4. Quoted Amount Column */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                            ₹{total.toLocaleString("en-IN")}
                          </div>
                          {q.amountMode === "manual" ? (
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
                      <TableCell
                        className="py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={currentStatus}
                          onValueChange={(val: QuotationLeadStatus) =>
                            handleStatusChange(q.id, val)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 text-xs font-semibold rounded-lg border transition-all w-[140px]",
                              statusCfg.bg,
                              statusCfg.text,
                              statusCfg.border
                            )}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  statusCfg.dot
                                )}
                              />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUS_OPTIONS.map((opt) => {
                              const itemCfg = LEAD_STATUS_CONFIG[opt];
                              return (
                                <SelectItem
                                  key={opt}
                                  value={opt}
                                  className="text-xs font-medium cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        itemCfg.dot
                                      )}
                                    />
                                    <span>{opt}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* 6. Edit Option & Quick Actions Column */}
                      <TableCell
                        className="py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Main Edit Option Button */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onOpenQuotation(q)}
                            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs transition-all cursor-pointer"
                            title="Edit quotation in Quotation Studio"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>

                          {/* WhatsApp Chat */}
                          <a
                            href={getWhatsAppLink(q)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                            title="Message customer on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id, q.clientName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Delete quotation"
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
        )}
      </div>
    </div>
  );
}
