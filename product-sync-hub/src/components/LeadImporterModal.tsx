import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2, 
  Sparkles, 
  X,
  Layers,
  Facebook,
  Globe
} from "lucide-react";
import { parseLeadsFile, downloadSampleTemplate, ParsedLead, ParseResult } from "@/lib/leadParsers";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LeadImporterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
  bulkImportFn: (leads: any[]) => Promise<any>;
}

export function LeadImporterModal({
  open,
  onOpenChange,
  onImportSuccess,
  bulkImportFn,
}: LeadImporterModalProps) {
  const { user } = useAuth();
  const { products } = useProducts(user?.id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [initialStatus, setInitialStatus] = useState<string>("new");

  // Auto-select first product if available when modal opens or products load
  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(String(products[0].id));
    }
  }, [products, selectedProductId]);

  const handleReset = () => {
    setParseResult(null);
    setIsParsing(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await parseLeadsFile(file);
      setParseResult(result);

      if (result.leads.length === 0) {
        toast.error("No valid leads found in the file", {
          description: result.errors[0] || "Check that your file has at least a Name or Phone column.",
        });
      } else {
        toast.success(`Found ${result.leads.length} leads in ${file.name}`, {
          description: `Auto-detected format: ${result.detectedSource}`,
        });
      }
    } catch (err: any) {
      toast.error("Failed to parse file", {
        description: err.message || "An unexpected error occurred while parsing the file.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmitImport = async () => {
    if (!parseResult || parseResult.leads.length === 0) {
      toast.error("No leads to import");
      return;
    }

    if (!selectedProductId && products.length > 0) {
      toast.error("Please select a package/product to assign these leads to");
      return;
    }

    const productIdToUse = selectedProductId || (products.length > 0 ? products[0].id : "1");

    setIsSubmitting(true);
    try {
      const payload = parseResult.leads.map((lead) => ({
        product_id: productIdToUse,
        customer_name: lead.customer_name,
        contact_no: lead.contact_no,
        email: lead.email || null,
        address: lead.address || null,
        campaign_name: lead.campaign_name || null,
        source: lead.source,
        message: lead.message || null,
        status: initialStatus,
      }));

      await bulkImportFn(payload);
      toast.success(`Successfully imported ${payload.length} leads!`);
      handleReset();
      onOpenChange(false);
      onImportSuccess();
    } catch (err: any) {
      toast.error("Failed to import leads", {
        description: err.message || "Please check your server connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    if (source.includes("Meta")) {
      return <Badge className="bg-blue-600 hover:bg-blue-600 text-white gap-1"><Facebook className="w-3 h-3" /> Meta Ads</Badge>;
    }
    if (source.includes("Google")) {
      return <Badge className="bg-amber-600 hover:bg-amber-600 text-white gap-1"><Globe className="w-3 h-3" /> Google Ads</Badge>;
    }
    if (source.includes("PDF")) {
      return <Badge className="bg-rose-600 hover:bg-rose-600 text-white gap-1"><FileText className="w-3 h-3" /> PDF Export</Badge>;
    }
    return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1"><FileSpreadsheet className="w-3 h-3" /> Spreadsheet</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleReset(); onOpenChange(val); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Layers className="w-5 h-5 text-primary" />
            Import Leads from Ads & Spreadsheets
          </DialogTitle>
          <DialogDescription>
            Upload lead exports from <strong>Meta Ads (Facebook & Instagram)</strong>, <strong>Google Ads Lead Forms</strong>, Excel sheets (<code>.xlsx</code>, <code>.xls</code>), CSV files, or PDF documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Package Assignment & Defaults */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Assign to Package / Product <span className="text-destructive">*</span>
              </Label>
              {products.length > 0 ? (
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="Select package..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} {p.category ? `(${p.category})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground italic pt-1">
                  General Leads (No specific package created yet)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Initial Lead Status</Label>
              <Select value={initialStatus} onValueChange={setInitialStatus}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Lead</SelectItem>
                  <SelectItem value="contacted">Already Contacted</SelectItem>
                  <SelectItem value="converted">Converted / Booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Dropzone */}
          {!parseResult ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? "border-primary bg-primary/5 scale-[0.99]" 
                  : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv, .xlsx, .xls, .pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {isParsing ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="font-semibold text-sm">Analyzing and parsing your lead file...</p>
                  <p className="text-xs text-muted-foreground">Auto-detecting Meta / Google Ads column mappings</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      Click to browse or drag and drop your file here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports <strong>CSV</strong>, <strong>Excel (.xlsx, .xls)</strong>, and <strong>PDF</strong> lead reports
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <Badge variant="secondary" className="text-[11px] gap-1 px-2.5 py-0.5">
                      <Facebook className="w-3 h-3 text-blue-500" /> Meta Ads Export
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] gap-1 px-2.5 py-0.5">
                      <Globe className="w-3 h-3 text-amber-500" /> Google Ads Leads
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] gap-1 px-2.5 py-0.5">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-500" /> Excel / CSV
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] gap-1 px-2.5 py-0.5">
                      <FileText className="w-3 h-3 text-rose-500" /> PDF Tables
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Preview Section */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate max-w-[200px]">{parseResult.fileName}</span>
                      {getSourceBadge(parseResult.detectedSource)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Detected <strong>{parseResult.totalFound}</strong> valid leads ready to import
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs gap-1">
                  <X className="w-3.5 h-3.5" /> Choose Different File
                </Button>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Parsing Notice: </span>
                    {parseResult.errors.join(", ")}
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground flex justify-between items-center border-b">
                  <span>Lead Preview (First 5 of {parseResult.totalFound})</span>
                  <span>Auto-Mapped Fields</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs bg-muted/20">
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Phone / Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location / City</TableHead>
                        <TableHead>Campaign / Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.leads.slice(0, 5).map((lead, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-medium">{lead.customer_name}</TableCell>
                          <TableCell className="font-mono text-primary">{lead.contact_no}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.email || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.address || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {lead.campaign_name ? (
                              <Badge variant="outline" className="text-[10px] mr-1.5 py-0">
                                {lead.campaign_name}
                              </Badge>
                            ) : null}
                            {lead.message || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Sample Templates Helper */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Need a sample template to format your leads?
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[11px] gap-1"
                  onClick={() => downloadSampleTemplate("meta")}
                >
                  <Download className="w-3 h-3" /> Meta Ads CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[11px] gap-1"
                  onClick={() => downloadSampleTemplate("google")}
                >
                  <Download className="w-3 h-3" /> Google Ads CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[11px] gap-1"
                  onClick={() => downloadSampleTemplate("standard")}
                >
                  <Download className="w-3 h-3" /> Standard CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitImport} 
            disabled={!parseResult || parseResult.leads.length === 0 || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> 
                {parseResult && parseResult.leads.length > 0 
                  ? `Import ${parseResult.leads.length} Leads` 
                  : "Import Leads"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
