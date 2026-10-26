import React, { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInquiries } from "@/hooks/useInquiries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Trash2,
  User,
  Phone,
  MapPin,
  MessageSquare,
  Package,
  ClipboardList,
  Loader2,
  UploadCloud,
  Download,
  Search,
  MessageCircle,
  Mail,
  Table as TableIcon,
  LayoutGrid,
  Facebook,
  Globe,
  FileSpreadsheet,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  TrendingUp,
  Share2,
  Copy,
  Calendar as CalendarIcon,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { Inquiry } from "@/lib/types";
import { LeadImporterModal } from "@/components/LeadImporterModal";
import { LeadCalendarView } from "./LeadCalendarView";
import Papa from "papaparse";

const STATUS_CONFIGS = {
  new: {
    label: "New",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  contacted: {
    label: "Contacted",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  converted: {
    label: "Converted",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
};

export function InquiryDashboard() {
  const { user } = useAuth();
  const { inquiries, isLoading, updateStatus, deleteInquiry, bulkImport, refetch } = useInquiries(user?.id);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "calendar">("table");
  const [importerOpen, setImporterOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Inquiry | null>(null);

  // KPI Metrics calculation
  const metrics = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === "new").length;
    const contactedCount = inquiries.filter((i) => i.status === "contacted").length;
    const convertedCount = inquiries.filter((i) => i.status === "converted").length;
    const closedCount = inquiries.filter((i) => i.status === "closed").length;
    const metaCount = inquiries.filter((i) => i.source === "meta_ads").length;
    const googleCount = inquiries.filter((i) => i.source === "google_ads").length;

    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

    return { total, newCount, contactedCount, convertedCount, closedCount, metaCount, googleCount, conversionRate };
  }, [inquiries]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // Status filter
      if (statusFilter !== "all" && inq.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== "all") {
        if (sourceFilter === "meta_ads" && inq.source !== "meta_ads") return false;
        if (sourceFilter === "google_ads" && inq.source !== "google_ads") return false;
        if (sourceFilter === "website" && inq.source !== "website" && inq.source !== null && inq.source !== undefined && inq.source !== "") return false;
        if (sourceFilter === "csv_import" && (inq.source !== "csv_import" && inq.source !== "pdf_import")) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = inq.customer_name?.toLowerCase().includes(q);
        const matchesPhone = inq.contact_no?.toLowerCase().includes(q);
        const matchesEmail = inq.email?.toLowerCase().includes(q);
        const matchesPackage = inq.products?.name?.toLowerCase().includes(q);
        const matchesCampaign = inq.campaign_name?.toLowerCase().includes(q);
        const matchesMessage = inq.message?.toLowerCase().includes(q);
        const matchesAddress = inq.address?.toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesPackage && !matchesCampaign && !matchesMessage && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [inquiries, statusFilter, sourceFilter, searchQuery]);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: (err: any) => toast.error(err.message || "Failed to update status"),
      }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      deleteInquiry.mutate(id, {
        onSuccess: () => toast.success("Lead deleted"),
        onError: (err: any) => toast.error(err.message || "Failed to delete lead"),
      });
    }
  };

  const exportFilteredLeads = () => {
    if (filteredInquiries.length === 0) {
      toast.error("No leads to export");
      return;
    }

    const dataToExport = filteredInquiries.map((inq) => ({
      "Lead ID": inq.id,
      "Customer Name": inq.customer_name,
      "Phone": inq.contact_no,
      "Email": inq.email || "",
      "Location": inq.address || "",
      "Source": inq.source || "website",
      "Campaign": inq.campaign_name || "",
      "Package": inq.products?.name || "General",
      "Status": inq.status,
      "Message / Requirement": inq.clean_message || inq.message || "",
      "Date": new Date(inq.created_at).toLocaleString("en-IN"),
    }));

    const csvContent = Papa.unparse(dataToExport);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} leads to CSV`);
  };

  const getSourceBadge = (source?: string | null) => {
    if (source === "meta_ads") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 gap-1 text-[11px] font-medium">
          <Facebook className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Meta Ads
        </Badge>
      );
    }
    if (source === "google_ads") {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 gap-1 text-[11px] font-medium">
          <Globe className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Google Ads
        </Badge>
      );
    }
    if (source === "pdf_import") {
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 gap-1 text-[11px] font-medium">
          <FileText className="w-3 h-3 text-rose-500" /> PDF Import
        </Badge>
      );
    }
    if (source === "csv_import") {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 gap-1 text-[11px] font-medium">
          <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Spreadsheet
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 gap-1 text-[11px] font-medium">
        <Globe className="w-3 h-3 text-purple-600" /> Website Form
      </Badge>
    );
  };

  const getCleanWhatsAppLink = (phone: string, customerName: string, packageName?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const greeting = encodeURIComponent(
      `Hello ${customerName}, thank you for your interest${packageName ? ` in our ${packageName}` : ""}. How can I assist you with your booking?`
    );
    return `https://wa.me/${cleanPhone}?text=${greeting}`;
  };

  const inquiryLink = `${window.location.origin}/inquiry/${user?.id}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading inquiries & leads CRM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Metrics Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card shadow-sm border border-border/70 hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Leads</span>
              <Users className="w-4 h-4 text-primary/70" />
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border/70 hover:border-blue-500/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">New Leads</span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight text-blue-700 dark:text-blue-300">{metrics.newCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border/70 hover:border-amber-500/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Contacted</span>
              <Clock className="w-4 h-4 text-amber-500/70" />
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight text-amber-700 dark:text-amber-300">{metrics.contactedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border/70 hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Converted</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight text-emerald-700 dark:text-emerald-300">{metrics.convertedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border/70 hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Ads Leads</span>
              <div className="flex -space-x-1">
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                <Globe className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight">
              {metrics.metaCount + metrics.googleCount}
              <span className="text-[11px] font-normal text-muted-foreground ml-1.5">
                ({metrics.metaCount} Meta, {metrics.googleCount} Google)
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border/70 hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Win Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight">{metrics.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Shareable Public Inquiry Form Strip */}
      <Card className="bg-gradient-to-r from-primary/5 via-muted/40 to-background border-dashed">
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Direct Customer Inquiry Link</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Share this link in your social bios, website or ads to gather inbound leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <code className="text-xs bg-background border rounded px-2.5 py-1 text-muted-foreground overflow-x-auto max-w-xs truncate hidden md:inline-block">
              {inquiryLink}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(inquiryLink);
                toast.success("Inquiry link copied to clipboard!");
              }}
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Toolbar: Search, Filters, Import & Export */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm">
        {/* Left Side: Search + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, phone, email, package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter Dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status ({inquiries.length})</SelectItem>
              <SelectItem value="new">New ({metrics.newCount})</SelectItem>
              <SelectItem value="contacted">Contacted ({metrics.contactedCount})</SelectItem>
              <SelectItem value="converted">Converted ({metrics.convertedCount})</SelectItem>
              <SelectItem value="closed">Closed ({metrics.closedCount})</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter Dropdown */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-9 text-xs w-[145px]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="meta_ads">Meta Ads (FB/IG)</SelectItem>
              <SelectItem value="google_ads">Google Ads</SelectItem>
              <SelectItem value="website">Website Form</SelectItem>
              <SelectItem value="csv_import">Spreadsheet / PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right Side: View Toggle, Export, and Import Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
            <Button
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setViewMode("cards")}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setViewMode("calendar")}
              title="Calendar View"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>

          {/* Export CSV */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={exportFilteredLeads}
            disabled={filteredInquiries.length === 0}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>

          {/* Primary Import Button */}
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            onClick={() => setImporterOpen(true)}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Ads Leads (CSV/Excel/PDF)</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "calendar" ? (
        <LeadCalendarView
          inquiries={filteredInquiries}
          onSelectLead={setSelectedLead}
          onUpdateStatus={handleStatusChange}
        />
      ) : filteredInquiries.length === 0 ? (
        <Card className="border-dashed py-14">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-base">
                {inquiries.length === 0 ? "No inquiries or leads yet" : "No matching leads found"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {inquiries.length === 0
                  ? "Import your lead exports from Meta or Google Ads, or share your inquiry link with customers."
                  : "Try clearing your search query or changing the filter selections."}
              </p>
            </div>
            {inquiries.length === 0 ? (
              <Button size="sm" className="gap-2 mt-2" onClick={() => setImporterOpen(true)}>
                <UploadCloud className="w-4 h-4" /> Upload Leads from Ads (CSV/Excel/PDF)
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-xs mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSourceFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* CRM High-Density Table View */
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs font-semibold">
                  <TableHead className="w-[220px]">Lead / Customer</TableHead>
                  <TableHead className="w-[190px]">Contact Info</TableHead>
                  <TableHead className="w-[170px]">Source & Campaign</TableHead>
                  <TableHead className="w-[180px]">Interested Package</TableHead>
                  <TableHead className="min-w-[180px]">Message / Requirements</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inq) => {
                  const statusCfg = STATUS_CONFIGS[inq.status] || STATUS_CONFIGS.new;
                  const dateFormatted = new Date(inq.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeFormatted = new Date(inq.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <TableRow key={inq.id} className="hover:bg-muted/30 transition-colors text-xs">
                      {/* Customer Info */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                            {inq.customer_name ? inq.customer_name.charAt(0) : "L"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate max-w-[150px]">
                              {inq.customer_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              {dateFormatted} • {timeFormatted}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${inq.contact_no}`}
                              className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              {inq.contact_no}
                            </a>
                            {inq.contact_no && inq.contact_no !== "N/A" && (
                              <a
                                href={getCleanWhatsAppLink(inq.contact_no, inq.customer_name, inq.products?.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {inq.email && (
                            <a
                              href={`mailto:${inq.email}`}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1 truncate max-w-[170px]"
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{inq.email}</span>
                            </a>
                          )}
                          {inq.address && (
                            <div className="text-muted-foreground flex items-center gap-1 truncate max-w-[170px]">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{inq.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Source & Campaign */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <div>{getSourceBadge(inq.source)}</div>
                          {inq.campaign_name && (
                            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]" title={inq.campaign_name}>
                              {inq.campaign_name}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Interested Package */}
                      <TableCell className="align-middle">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground truncate max-w-[160px]" title={inq.products?.name}>
                            {inq.products?.name || "General Lead"}
                          </p>
                          {inq.products?.category && (
                            <Badge variant="secondary" className="text-[10px] py-0 font-normal capitalize">
                              {inq.products.category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Message / Requirements */}
                      <TableCell className="align-middle">
                        <p
                          className="text-muted-foreground text-xs line-clamp-2 max-w-[240px] cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => setSelectedLead(inq)}
                          title="Click to view full notes"
                        >
                          {inq.clean_message || inq.message || "—"}
                        </p>
                      </TableCell>

                      {/* Status Dropdown */}
                      <TableCell className="align-middle">
                        <Select value={inq.status} onValueChange={(val) => handleStatusChange(inq.id, val)}>
                          <SelectTrigger className="h-8 text-xs border bg-background font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass}`} />
                              <span>{statusCfg.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" /> New
                              </span>
                            </SelectItem>
                            <SelectItem value="contacted">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Contacted
                              </span>
                            </SelectItem>
                            <SelectItem value="converted">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Converted
                              </span>
                            </SelectItem>
                            <SelectItem value="closed">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400" /> Closed
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedLead(inq)}
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(inq.id)}
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
        /* Original Cards View (Preserved for alternate visual layout) */
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredInquiries.map((inq) => {
            const statusCfg = STATUS_CONFIGS[inq.status] || STATUS_CONFIGS.new;
            return (
              <Card key={inq.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 pb-3 flex items-center justify-between gap-2 border-b bg-muted/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-xs">
                      {inq.customer_name ? inq.customer_name.charAt(0) : "L"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{inq.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {getSourceBadge(inq.source)}
                </div>

                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`tel:${inq.contact_no}`} className="font-medium hover:underline">
                        {inq.contact_no}
                      </a>
                    </div>
                    {inq.contact_no && inq.contact_no !== "N/A" && (
                      <a
                        href={getCleanWhatsAppLink(inq.contact_no, inq.customer_name, inq.products?.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 text-[11px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>

                  {inq.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{inq.email}</span>
                    </div>
                  )}

                  {inq.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{inq.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs">
                    <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{inq.products?.name || "General Lead"}</span>
                  </div>

                  {(inq.clean_message || inq.message) && (
                    <div className="p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground line-clamp-3">
                      {inq.clean_message || inq.message}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Select value={inq.status} onValueChange={(val) => handleStatusChange(inq.id, val)}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedLead(inq)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(inq.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {selectedLead.customer_name ? selectedLead.customer_name.charAt(0) : "L"}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">{selectedLead.customer_name}</DialogTitle>
                  <DialogDescription className="text-xs">
                    Received on {new Date(selectedLead.created_at).toLocaleString("en-IN")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Source</p>
                  <div className="mt-1">{getSourceBadge(selectedLead.source)}</div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Status</p>
                  <div className="mt-1">
                    <Badge className={STATUS_CONFIGS[selectedLead.status]?.badgeClass || ""}>
                      {STATUS_CONFIGS[selectedLead.status]?.label || selectedLead.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono">{selectedLead.contact_no}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={`tel:${selectedLead.contact_no}`}
                      className="px-2.5 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                    >
                      Call
                    </a>
                    {selectedLead.contact_no && selectedLead.contact_no !== "N/A" && (
                      <a
                        href={getCleanWhatsAppLink(selectedLead.contact_no, selectedLead.customer_name, selectedLead.products?.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {selectedLead.email && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.email}</span>
                    </div>
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="px-2.5 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                    >
                      Email
                    </a>
                  </div>
                )}

                {selectedLead.address && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg border">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{selectedLead.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 p-2.5 rounded-lg border">
                  <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-medium">{selectedLead.products?.name || "General Lead"}</span>
                    {selectedLead.products?.category && (
                      <span className="text-muted-foreground text-xs ml-2">({selectedLead.products.category})</span>
                    )}
                  </div>
                </div>

                {selectedLead.campaign_name && (
                  <div className="p-2.5 rounded-lg border bg-muted/20">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Ad / Campaign Name</p>
                    <p className="font-mono text-xs mt-0.5">{selectedLead.campaign_name}</p>
                  </div>
                )}
              </div>

              {(selectedLead.clean_message || selectedLead.message) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Customer Message / Form Answers:</p>
                  <div className="p-3 bg-muted/50 rounded-xl border text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedLead.clean_message || selectedLead.message}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lead Importer Modal */}
      <LeadImporterModal
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImportSuccess={() => refetch()}
        bulkImportFn={bulkImport.mutateAsync}
      />
    </div>
  );
}
