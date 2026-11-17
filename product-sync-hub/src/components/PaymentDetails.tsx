import React, { useState, useEffect, useMemo } from "react";
import { SavedQuotation } from "@/lib/types";
import {
  getStoredQuotations,
  updateQuotation,
  saveQuotation,
  QUOTATIONS_UPDATED_EVENT,
} from "@/lib/quotationStorage";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  CreditCard,
  Download,
  Search,
  Calendar,
  IndianRupee,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  ArrowUpDown,
  Building,
  Sparkles,
  Kanban,
  Eye,
  Clock,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  downloadPaymentReceiptPdf,
  downloadPaymentsSummaryPdf,
} from "@/lib/paymentPdf";
import { getCompanyProfile } from "@/components/ItineraryPdfDocument";

interface PaymentDetailsProps {
  onGoToLeadBoard?: () => void;
  onOpenQuotation?: (quotation: SavedQuotation) => void;
}

const PAYMENT_METHODS = [
  "UPI / QR Code",
  "Bank NEFT / RTGS / IMPS",
  "Credit / Debit Card",
  "Cash",
  "Cheque",
  "Net Banking",
];

export function PaymentDetails({
  onGoToLeadBoard,
  onOpenQuotation,
}: PaymentDetailsProps) {
  const { user } = useAuth();
  const company = useMemo(() => getCompanyProfile(user), [user]);
  const [quotations, setQuotations] = useState<SavedQuotation[]>(() =>
    getStoredQuotations()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "amount_desc" | "amount_asc" | "name"
  >("newest");
  const [selectedReceipt, setSelectedReceipt] = useState<SavedQuotation | null>(
    null
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Add Payment Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("UPI / QR Code");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [tripTitle, setTripTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  // Sync reactively with localStorage and quotation update events
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

  // Only quotations where payment has actually been recorded from the Add Payment drawer
  const recordedPayments = useMemo(() => {
    return quotations.filter((q) => q.paymentRecorded === true);
  }, [quotations]);

  // Only customers with Converted, Active, or Completed status for the Add Payment dropdown
  const eligibleCustomers = useMemo(() => {
    return quotations.filter(
      (q) => q.status === "Converted" || q.status === "Active" || q.status === "Completed"
    );
  }, [quotations]);

  // Open drawer handler
  const handleOpenAddDrawer = (preselectedLead?: SavedQuotation) => {
    if (preselectedLead) {
      setSelectedCustomerId(preselectedLead.id);
      setCustomerName(preselectedLead.clientName || "");
      setPaymentAmount(String(preselectedLead.finalQuotationTotal || ""));
      setTripTitle(preselectedLead.tripTitle || preselectedLead.destination || "");
      setDestination(preselectedLead.destination || "");
      setClientPhone(preselectedLead.clientPhone || "");
      setClientEmail(preselectedLead.clientEmail || "");
      setPaymentMethod(preselectedLead.paymentMethod || "UPI / QR Code");
      setPaymentDate(preselectedLead.paymentDate || new Date().toISOString().split("T")[0]);
      setTransactionRef(preselectedLead.transactionRef || "");
      setPaymentStatus(preselectedLead.paymentStatus || "Paid");
    } else if (eligibleCustomers.length > 0) {
      // Prioritize the first eligible lead whose payment has not been recorded yet
      const targetLead =
        eligibleCustomers.find((q) => !q.paymentRecorded) ||
        eligibleCustomers[0];
      setSelectedCustomerId(targetLead.id);
      setCustomerName(targetLead.clientName || "");
      setPaymentAmount(String(targetLead.finalQuotationTotal || ""));
      setTripTitle(targetLead.tripTitle || targetLead.destination || "");
      setDestination(targetLead.destination || "");
      setClientPhone(targetLead.clientPhone || "");
      setClientEmail(targetLead.clientEmail || "");
      setPaymentMethod(targetLead.paymentMethod || "UPI / QR Code");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setTransactionRef("");
      setPaymentStatus("Paid");
    } else {
      setSelectedCustomerId("custom_new");
      setCustomerName("");
      setPaymentAmount("");
      setTripTitle("");
      setDestination("");
      setClientPhone("");
      setClientEmail("");
      setPaymentMethod("UPI / QR Code");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setTransactionRef("");
      setPaymentStatus("Paid");
    }
    setIsAddDrawerOpen(true);
  };

  // Change selected customer in drawer dropdown
  const handleSelectCustomer = (val: string) => {
    setSelectedCustomerId(val);
    if (val === "custom_new") {
      setCustomerName("");
      setPaymentAmount("");
      setTripTitle("");
      setDestination("");
      setClientPhone("");
      setClientEmail("");
      return;
    }
    const found = eligibleCustomers.find((q) => q.id === val);
    if (found) {
      setCustomerName(found.clientName || "");
      setPaymentAmount(String(found.finalQuotationTotal || ""));
      setTripTitle(found.tripTitle || found.destination || "");
      setDestination(found.destination || "");
      setClientPhone(found.clientPhone || "");
      setClientEmail(found.clientEmail || "");
      if (found.paymentMethod) setPaymentMethod(found.paymentMethod);
    }
  };

  // Submit payment in drawer
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      toast.error("Please enter a customer name");
      return;
    }
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid payment amount greater than 0");
      return;
    }

    if (selectedCustomerId && selectedCustomerId !== "custom_new") {
      const existing = quotations.find((q) => q.id === selectedCustomerId);
      if (existing) {
        updateQuotation(existing.id, {
          clientName: trimmedName,
          status: "Converted",
          finalQuotationTotal: amt,
          paidAmount: amt,
          paymentMethod,
          paymentDate,
          paymentStatus,
          paymentRecorded: true,
          transactionRef: transactionRef.trim(),
          tripTitle: tripTitle.trim() || existing.tripTitle,
          destination: destination.trim() || existing.destination,
          clientPhone: clientPhone.trim() || existing.clientPhone,
          clientEmail: clientEmail.trim() || existing.clientEmail,
        });
        toast.success(
          `Payment of ₹${amt.toLocaleString("en-IN")} recorded for ${trimmedName}`
        );
        setIsAddDrawerOpen(false);
        return;
      }
    }

    // Creating new record directly
    saveQuotation({
      quotationRef: `QT-${Date.now().toString().slice(-6)}`,
      quotationDate: paymentDate,
      validUntilDate: "",
      clientName: trimmedName,
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: "",
      adults: "1",
      children: "0",
      infants: "0",
      roomsCount: "1",
      mealPlan: "EP",
      packageType: "Full Package",
      tripTitle: tripTitle.trim() || "Tour Package",
      destination: destination.trim() || "Tour",
      startDate: paymentDate,
      endDate: paymentDate,
      theme: "Standard",
      heroImage: "",
      days: [],
      hotels: [],
      transports: [],
      sightseeings: [],
      flights: [],
      trains: [],
      otherServices: [],
      inclusions: [],
      exclusions: [],
      clientNotes: transactionRef.trim() ? `Ref: ${transactionRef.trim()}` : "",
      selectedTheme: "teal",
      includeCoverPage: false,
      gstRate: 0,
      tcsRate: 0,
      discountAmount: 0,
      finalQuotationTotal: amt,
      status: "Converted",
      paymentMethod,
      paymentDate,
      paymentStatus,
      paidAmount: amt,
      paymentRecorded: true,
      transactionRef: transactionRef.trim(),
    });

    toast.success(
      `Payment of ₹${amt.toLocaleString("en-IN")} recorded for ${trimmedName}`
    );
    setIsAddDrawerOpen(false);
  };

  // Remove/Reset recorded payment
  const handleRemovePayment = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to remove the payment record for "${name}"? The quotation will remain available on the Lead Board.`
      )
    ) {
      updateQuotation(id, {
        paymentRecorded: false,
        paidAmount: 0,
        paymentStatus: undefined,
      });
      toast.success(
        `Payment record removed for "${name}". It remains on your Lead Board.`
      );
    }
  };

  // Search & Sort
  const filteredPayments = useMemo(() => {
    return recordedPayments
      .filter((lead) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchName = (lead.clientName || "").toLowerCase().includes(q);
        const matchTrip = (lead.tripTitle || "").toLowerCase().includes(q);
        const matchDest = (lead.destination || "").toLowerCase().includes(q);
        const matchRef = (lead.quotationRef || "").toLowerCase().includes(q);
        const matchPhone = (lead.clientPhone || "").toLowerCase().includes(q);
        return matchName || matchTrip || matchDest || matchRef || matchPhone;
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
          return (
            (Number(b.paidAmount || b.finalQuotationTotal) || 0) -
            (Number(a.paidAmount || a.finalQuotationTotal) || 0)
          );
        }
        if (sortBy === "amount_asc") {
          return (
            (Number(a.paidAmount || a.finalQuotationTotal) || 0) -
            (Number(b.paidAmount || b.finalQuotationTotal) || 0)
          );
        }
        if (sortBy === "name") {
          return (a.clientName || "").localeCompare(b.clientName || "");
        }
        return 0;
      });
  }, [recordedPayments, searchQuery, sortBy]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = recordedPayments.length;
    const totalCollected = recordedPayments.reduce(
      (sum, q) => sum + (Number(q.paidAmount || q.finalQuotationTotal) || 0),
      0
    );
    const avgBookingValue =
      totalCount > 0 ? Math.round(totalCollected / totalCount) : 0;
    const recentBooking = recordedPayments[0];

    return { totalCount, totalCollected, avgBookingValue, recentBooking };
  }, [recordedPayments]);

  // Single PDF Receipt Download
  const handleDownloadPdf = (lead: SavedQuotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(lead.id);
      const filename = downloadPaymentReceiptPdf(lead, company);
      toast.success(`Downloaded Payment Receipt: ${filename}`);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
      toast.error("Failed to generate PDF receipt. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Full Payments Report Download
  const handleDownloadReportPdf = () => {
    try {
      if (recordedPayments.length === 0) {
        toast.warning("No recorded payments to export.");
        return;
      }
      const filename = downloadPaymentsSummaryPdf(recordedPayments, company);
      toast.success(`Downloaded Payments Ledger Report: ${filename}`);
    } catch (err) {
      console.error("Failed to generate summary PDF:", err);
      toast.error("Failed to generate report PDF.");
    }
  };

  // Update Payment Method
  const handleUpdatePaymentMethod = (id: string, method: string) => {
    updateQuotation(id, { paymentMethod: method });
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, paymentMethod: method } : q))
    );
    if (selectedReceipt?.id === id) {
      setSelectedReceipt((prev) =>
        prev ? { ...prev, paymentMethod: method } : null
      );
    }
    toast.success(`Updated payment method to ${method}`);
  };

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

  // WhatsApp link
  const getWhatsAppLink = (lead: SavedQuotation) => {
    const phone = (lead.clientPhone || "").replace(/[^0-9]/g, "");
    const name = lead.clientName || "Valued Client";
    const title = lead.tripTitle || lead.destination || "Tour Package";
    const amount = (Number(lead.finalQuotationTotal) || 0).toLocaleString("en-IN");
    const text = encodeURIComponent(
      `Dear ${name}, thank you for booking with us! We have received your payment of ₹${amount} for ${title}. Your booking is confirmed and official vouchers will be shared shortly.`
    );
    return phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Payment Details
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {recordedPayments.length}{" "}
                  {recordedPayments.length === 1 ? "Payment Recorded" : "Payments Recorded"}
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Financial ledger of payments recorded via Add Payment drawer — track customer names, received amounts, dates, and download official PDF receipts
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Add Payment Button (Opens Drawer) */}
          <Button
            onClick={() => handleOpenAddDrawer()}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </Button>

          {/* Download All Payments PDF Report */}
          <Button
            variant="outline"
            onClick={handleDownloadReportPdf}
            disabled={recordedPayments.length === 0}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download All Report (PDF)</span>
          </Button>

          {/* Jump to Lead Board */}
          {onGoToLeadBoard && (
            <Button
              onClick={onGoToLeadBoard}
              className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
            >
              <Kanban className="w-4 h-4" />
              <span>Lead Board</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Total Revenue Collected */}
        <div className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Revenue Collected
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
              ₹{metrics.totalCollected.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Converted & Verified Payments</span>
          </div>
        </div>

        {/* Payments Recorded */}
        <div className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Payments Recorded
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
              {metrics.totalCount}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            {metrics.totalCount > 0
              ? `${metrics.totalCount} payment(s) recorded from drawer`
              : "No payments recorded yet"}
          </div>
        </div>

        {/* Average Booking Value */}
        <div className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Avg. Booking Ticket Size
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
              ₹{metrics.avgBookingValue.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Calculated across all converted payments
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e131f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by customer name, trip, destination, phone, quotation ref..."
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900"
          />
        </div>

        {/* Sort Selector */}
        <div className="shrink-0 flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-9 text-xs w-[180px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Date First</SelectItem>
              <SelectItem value="oldest">Oldest Date First</SelectItem>
              <SelectItem value="amount_desc">Amount: High to Low</SelectItem>
              <SelectItem value="amount_asc">Amount: Low to High</SelectItem>
              <SelectItem value="name">Customer Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payment Details Table */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0e131f] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 font-bold text-base">
              {recordedPayments.length === 0
                ? "No Payments Recorded Yet"
                : "No matching payment records found"}
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
              {recordedPayments.length === 0
                ? "To show customer payments and download official receipts, click 'Add Payment' and record the payment for a Converted or Active lead."
                : "Try clearing your search query to see all recorded payment records."}
            </p>
            {recordedPayments.length === 0 && eligibleCustomers.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                ✨ {eligibleCustomers.length} converted/active lead{eligibleCustomers.length > 1 ? "s are" : " is"} ready for payment recording.
              </p>
            )}
          </div>

          {recordedPayments.length === 0 ? (
            <div className="flex items-center justify-center gap-2.5">
              <Button
                onClick={() => handleOpenAddDrawer()}
                className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Payment
              </Button>
              {onGoToLeadBoard && (
                <Button
                  variant="outline"
                  onClick={onGoToLeadBoard}
                  className="text-xs rounded-xl gap-2 cursor-pointer"
                >
                  <Kanban className="w-4 h-4" />
                  Go to Lead Board
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs rounded-xl"
            >
              Clear Search Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-900/60 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Customer Name
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Quotation / Receipt Date
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Package & Destination
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Amount Received
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Payment Method
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 py-3.5 text-right">
                    Download PDF & Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((lead) => {
                  const initial = (
                    lead.clientName?.[0] ||
                    lead.tripTitle?.[0] ||
                    "C"
                  ).toUpperCase();
                  const totalAmount = Number(lead.finalQuotationTotal) || 0;
                  const currentMethod =
                    lead.paymentMethod || "UPI / QR Code";

                  return (
                    <TableRow
                      key={lead.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
                      onClick={() => setSelectedReceipt(lead)}
                    >
                      {/* 1. Customer Name */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:text-emerald-600 transition-colors">
                              {lead.clientName || "Untitled Customer"}
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

                      {/* 2. Date */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {lead.paymentDate ||
                              lead.quotationDate ||
                              formatDate(lead.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Package & Destination */}
                      <TableCell className="py-3.5">
                        <div className="max-w-[220px]">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {lead.tripTitle ||
                              lead.destination ||
                              "Tour Package"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {lead.destination || "Destination"}
                            {lead.adults && ` · ${lead.adults} Adults`}
                          </p>
                        </div>
                      </TableCell>

                      {/* 4. Quoted / Received Amount */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums flex items-center gap-0.5">
                            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Full Settlement
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Payment Method selector */}
                      <TableCell
                        className="py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={currentMethod}
                          onValueChange={(method) =>
                            handleUpdatePaymentMethod(lead.id, method)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs font-medium rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-[150px]">
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((m) => (
                              <SelectItem key={m} value={m} className="text-xs">
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* 6. Status badge */}
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>PAID</span>
                        </span>
                      </TableCell>

                      {/* 7. Download PDF & Actions */}
                      <TableCell
                        className="py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PRIMARY ACTION: Download PDF Receipt */}
                          <Button
                            size="sm"
                            onClick={(e) => handleDownloadPdf(lead, e)}
                            disabled={downloadingId === lead.id}
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                            title="Download Official Payment Receipt PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </Button>

                          {/* WhatsApp Confirmation */}
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                            title="Send Receipt confirmation on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Preview Receipt Dialog */}
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Receipt Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Remove Payment Record */}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemovePayment(lead.id, lead.clientName || "Customer")
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remove Payment Record (Reverts lead to unpaid)"
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
      )}

      {/* Receipt Modal Preview */}
      {selectedReceipt && (
        <Dialog
          open={Boolean(selectedReceipt)}
          onOpenChange={(open) => !open && setSelectedReceipt(null)}
        >
          <DialogContent className="max-w-xl rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* 1. Quotation Template Style Company Header */}
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
              <div className="flex items-start gap-3 min-w-0">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="h-12 w-auto max-w-[120px] object-contain rounded shrink-0 bg-white dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {company.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "PH"}
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    {company.name}
                  </h4>
                  {company.website && (
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                      {company.website}
                    </p>
                  )}
                  {company.phone && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Phone: {company.phone}
                    </p>
                  )}
                  {company.email && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                      Email: {company.email}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    {company.address || "Jammu & Kashmir, India"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <Badge className="bg-teal-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  OFFICIAL RECEIPT
                </Badge>
                <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  RCP-{selectedReceipt.quotationRef?.replace(/^QT-?/, "") || selectedReceipt.id.slice(0, 8)}
                </p>
                <p className="text-[10px] text-slate-400">
                  Ref: {selectedReceipt.quotationRef || "QT-REF"}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded mt-1 border border-emerald-200 dark:border-emerald-800">
                  ● PAID IN FULL
                </span>
              </div>
            </div>

            <div className="space-y-3.5 pt-1 text-xs">
              {/* Highlight Amount & Date Box */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                    Total Amount Received
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    ₹
                    {(
                      Number(selectedReceipt.paidAmount || selectedReceipt.finalQuotationTotal) || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                    Date of Receipt
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedReceipt.paymentDate ||
                      selectedReceipt.quotationDate ||
                      formatDate(selectedReceipt.createdAt)}
                  </span>
                </div>
              </div>

              {/* Customer and Booking Information */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Customer Information
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedReceipt.clientName}
                  </p>
                  <p className="text-slate-500">{selectedReceipt.clientPhone || "No phone"}</p>
                  <p className="text-slate-500">{selectedReceipt.clientEmail || "No email"}</p>
                  {selectedReceipt.clientAddress && (
                    <p className="text-slate-500 text-[11px]">{selectedReceipt.clientAddress}</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Booking Summary
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedReceipt.destination || "Destination"}
                  </p>
                  <p className="text-slate-500">
                    {selectedReceipt.startDate || "Dates"} – {selectedReceipt.endDate || "TBD"}
                  </p>
                  <p className="text-slate-500">
                    {selectedReceipt.adults || 1} Adults · {selectedReceipt.packageType || "Package"}
                  </p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Payment Mode
                </label>
                <Select
                  value={selectedReceipt.paymentMethod || "UPI / QR Code"}
                  onValueChange={(val) =>
                    handleUpdatePaymentMethod(selectedReceipt.id, val)
                  }
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AUTHORIZED SIGN-OFF & OFFICIAL STAMP */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                {/* Authentic Circular Official Stamp */}
                <div className="relative w-28 h-28 rounded-full border-2 border-rose-600/85 p-1 flex items-center justify-center text-center select-none rotate-[-4deg] shadow-2xs bg-rose-50/20 dark:bg-rose-950/10">
                  <div className="w-full h-full rounded-full border border-dashed border-rose-600/80 flex flex-col items-center justify-center p-1 text-rose-700 dark:text-rose-400">
                    <span className="text-[7.5px] font-black uppercase tracking-tight line-clamp-1 max-w-[90px]">
                      {company.name}
                    </span>
                    <div className="my-0.5 px-2 py-0.5 bg-rose-600 text-white rounded font-black text-[10px] tracking-wider shadow-2xs">
                      PAID
                    </div>
                    <span className="text-[6.5px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                      OFFICIAL SEAL
                    </span>
                    <span className="text-[6.5px] font-mono text-rose-500">
                      {selectedReceipt.paymentDate ||
                        selectedReceipt.quotationDate ||
                        formatDate(selectedReceipt.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Authorized Sign & Seal Box matching quotation template */}
                <div className="text-center space-y-1">
                  <div className="w-36 h-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-400 bg-white dark:bg-slate-900">
                    Authorized Sign &amp; Seal
                  </div>
                  <p className="text-[9px] text-slate-400">
                    Official Travel Specialist Signature
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {company.name}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  onClick={() => handleDownloadPdf(selectedReceipt)}
                  className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Receipt</span>
                </Button>
                <a
                  href={getWhatsAppLink(selectedReceipt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button
                    variant="outline"
                    className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRemovePayment(
                      selectedReceipt.id,
                      selectedReceipt.clientName || "Customer"
                    );
                    setSelectedReceipt(null);
                  }}
                  className="text-xs gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Remove this payment record"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Payment Drawer (Slide-Over Panel) */}
      <Sheet open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col bg-white dark:bg-[#0e131f] border-slate-200 dark:border-slate-800"
        >
          <SheetHeader className="p-5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <CreditCard className="w-4 h-4" />
              </div>
              <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Add Payment
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-slate-500">
              Record customer payment for active or converted leads to generate official receipts
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSavePayment}
            className="flex-1 flex flex-col justify-between overflow-y-auto"
          >
            <div className="p-5 space-y-4 text-xs">
              {/* 1. Customer Selection Dropdown (Only Active & Converted leads) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Customer (Converted & Active Leads Only)
                </Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={handleSelectCustomer}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 font-medium">
                    <SelectValue placeholder="Choose a lead or enter new..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleCustomers.map((lead) => (
                      <SelectItem
                        key={lead.id}
                        value={lead.id}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              lead.status === "Converted"
                                ? "bg-emerald-500"
                                : lead.status === "Completed"
                                ? "bg-indigo-500"
                                : "bg-sky-500"
                            )}
                          />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {lead.clientName || "Untitled"}
                          </span>
                          <span className="text-slate-400">
                            · ₹
                            {(
                              Number(lead.finalQuotationTotal) || 0
                            ).toLocaleString("en-IN")}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold",
                              lead.status === "Converted"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : lead.status === "Completed"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            )}
                          >
                            {lead.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="custom_new"
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold"
                    >
                      + Enter New Customer Manually
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">
                  Filtering leads where status is <strong>Converted</strong> or{" "}
                  <strong>Active</strong> ({eligibleCustomers.length} available).
                </p>
              </div>

              {/* 2. Customer Name (Editable Input) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="customer-name-field"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Customer Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="customer-name-field"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahil or Rohan Verma"
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 font-medium"
                  required
                />
              </div>

              {/* 3. Amount Received (Editable) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="payment-amount-field"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Amount Received (₹) <span className="text-rose-500">*</span>
                  </Label>
                  {paymentAmount && !isNaN(Number(paymentAmount)) && (
                    <span className="text-[11px] font-mono font-bold text-emerald-600">
                      ₹{Number(paymentAmount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="payment-amount-field"
                    type="number"
                    min="1"
                    step="any"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 18900"
                    className="pl-9 h-10 text-xs rounded-xl font-bold border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
              </div>

              {/* 4. Payment Date & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Date
                  </Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m} className="text-xs">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 5. Trip / Package Title & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Trip / Package Title
                  </Label>
                  <Input
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    placeholder="e.g. 5 days 4 night"
                    className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Destination
                  </Label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Kashmir"
                    className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* 6. Contact Information (Phone & Email) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone / WhatsApp
                  </Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* 7. Transaction Ref / Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transaction Ref / Notes (Optional)
                </Label>
                <Input
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI Ref / UTR # / Bank Txn ID"
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <SheetFooter className="p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddDrawerOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Record Payment</span>
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
