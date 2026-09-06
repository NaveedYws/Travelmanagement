import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";

interface BulkImportProps {
  onImport: (items: any[]) => void;
  itemName: string;
}

export function BulkImport({ onImport, itemName }: BulkImportProps) {
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
        <Button variant="outline" className="border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/80">
          <UploadCloud className="w-4 h-4 mr-2" /> Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">Bulk Import {itemName}s</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload a CSV file containing your {itemName}s. Maximum 10 items at once.
          </p>
          
          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Need the format?</span>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60">
              Download Template
            </Button>
          </div>

          <div 
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
            {file ? (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{file.name}</p>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Click to upload CSV file</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">.csv files only</p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => resetState(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm" disabled={!file}>
              Import {itemName}s
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
