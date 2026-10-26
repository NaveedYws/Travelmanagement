import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";

interface BulkImportProps {
  onImport: (items: any[]) => void;
  itemName: string;
  trigger?: React.ReactNode;
}

export function BulkImport({ onImport, itemName, trigger }: BulkImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleImport = () => {
    if (!file) {
      setError("Please select a CSV file first");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = results.data as any[];
          if (parsed.length > 10) {
            throw new Error(`Maximum 10 ${itemName}s can be imported at once`);
          }
          if (parsed.length === 0) {
            throw new Error("File is empty or invalid CSV format");
          }
          
          // Basic validation and type mapping
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item.name) {
               throw new Error(`Row ${i + 1} is missing required 'name' column`);
            }
            item.price = item.price ? parseFloat(item.price) : 0;
            item.stock = item.stock ? parseInt(item.stock, 10) : 10;
            item.rating = item.rating ? parseFloat(item.rating) : 0;
            item.reviews = item.reviews ? parseInt(item.reviews, 10) : 0;
          }
          
          onImport(parsed);
          setOpen(false);
          setFile(null);
          setError("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
          setError(err.message || "Invalid CSV format");
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const resetState = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setError("");
      setFile(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,title,price,stock,duration,description,image_url,whatsapp,rating,reviews\nKashmir Trip,✨ Kashmir Trip – Meadows of Gold,12000,5,4 Nights / 5 Days,Example description,https://example.com/img.jpg,+1234567890,4.5,120";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${itemName}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={resetState}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-xl border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Bulk Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-[#0e131f] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Bulk Import {itemName}s</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload a CSV file containing your {itemName}s. Maximum 10 items at once.
          </p>
          
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Need sample format?</span>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
              Download Template
            </Button>
          </div>

          <div 
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-7 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <FileText className="w-9 h-9 text-slate-400 dark:text-slate-500 mb-2" />
            {file ? (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{file.name}</p>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Click to upload CSV file</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">.csv spreadsheet files only</p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => resetState(false)} className="rounded-xl border-slate-200 dark:border-slate-700 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleImport} className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white text-white font-medium text-xs shadow-xs" disabled={!file}>
              Import {itemName}s
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
