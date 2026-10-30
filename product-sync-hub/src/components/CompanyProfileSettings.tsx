import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Landmark,
  CreditCard,
  QrCode,
  CheckCircle2,
  Sparkles,
  Camera,
  Loader2
} from "lucide-react";

export function CompanyProfileSettings() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    company_logo: "",
    company_phone: "",
    company_email: "",
    company_address: "",
    company_website: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_no: "",
    bank_ifsc: "",
    bank_upi_id: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    let localProfile: any = {};
    try {
      const raw = localStorage.getItem("agency_company_profile");
      if (raw) localProfile = JSON.parse(raw);
    } catch {}

    setFormData({
      company_name: user?.company_name || localProfile.company_name || "",
      company_logo: user?.company_logo || localProfile.company_logo || "",
      company_phone: user?.company_phone || localProfile.company_phone || "",
      company_email: user?.company_email || user?.email || localProfile.company_email || "",
      company_address: user?.company_address || localProfile.company_address || "",
      company_website: user?.company_website || localProfile.company_website || "",
      bank_name: user?.bank_name || localProfile.bank_name || "",
      bank_account_name: user?.bank_account_name || localProfile.bank_account_name || "",
      bank_account_no: user?.bank_account_no || localProfile.bank_account_no || "",
      bank_ifsc: user?.bank_ifsc || localProfile.bank_ifsc || "",
      bank_upi_id: user?.bank_upi_id || localProfile.bank_upi_id || ""
    });
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    // Instant local base64 preview so it works 100% reliably
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData((prev) => {
        const next = { ...prev, company_logo: dataUrl };
        try {
          localStorage.setItem("agency_company_profile", JSON.stringify(next));
          window.dispatchEvent(new Event("agency_profile_updated"));
        } catch {}
        return next;
      });
      toast.success("Logo loaded successfully!");
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingLogo(true);
      const res = await api.upload(file);
      if (res.publicUrl) {
        setFormData((prev) => {
          const next = { ...prev, company_logo: res.publicUrl };
          try {
            localStorage.setItem("agency_company_profile", JSON.stringify(next));
            window.dispatchEvent(new Event("agency_profile_updated"));
          } catch {}
          return next;
        });
      }
    } catch (err: any) {
      // Local Data URL is already saved, so upload failure won't break it
      console.warn("Server upload skipped, using local data URL:", err.message);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      try {
        localStorage.setItem("agency_company_profile", JSON.stringify(next));
        window.dispatchEvent(new Event("agency_profile_updated"));
      } catch {}
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      // Persist to local storage immediately
      try {
        localStorage.setItem("agency_company_profile", JSON.stringify(formData));
        window.dispatchEvent(new Event("agency_profile_updated"));
      } catch {}

      await updateProfile(formData);
      toast.success("Company profile & bank details saved successfully!");
    } catch (err: any) {
      toast.success("Profile saved locally!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Company Branding Section */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Agency & Quotation Branding
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            Shows on Quotations & PDFs
          </span>
        </div>

        {/* Logo Upload & Preview */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
          <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            {formData.company_logo ? (
              <img
                src={formData.company_logo}
                alt="Company Logo"
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <div className="text-center p-2 text-slate-400">
                <Camera className="w-6 h-6 mx-auto mb-1 opacity-60" />
                <span className="text-[9px] font-semibold block leading-tight">No Logo</span>
              </div>
            )}
            {isUploadingLogo && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2.5">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {formData.company_logo ? "Change Logo" : "Upload Logo"}
                </span>
              </label>

              {formData.company_logo && (
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...formData, company_logo: "" };
                    setFormData(next);
                    try {
                      localStorage.setItem("agency_company_profile", JSON.stringify(next));
                      window.dispatchEvent(new Event("agency_profile_updated"));
                    } catch {}
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="pt-1">
              <Input
                placeholder="Or paste direct Image / Logo URL (https://...)"
                className="text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-8"
                value={formData.company_logo?.startsWith("data:") ? "" : formData.company_logo || ""}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  const next = { ...formData, company_logo: val };
                  setFormData(next);
                  try {
                    localStorage.setItem("agency_company_profile", JSON.stringify(next));
                    window.dispatchEvent(new Event("agency_profile_updated"));
                  } catch {}
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Recommended: Transparent PNG or high-res JPG. Will appear prominently on quotation covers and PDF headers.
            </p>
          </div>
        </div>

        {/* Form Fields: Company Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          <div className="space-y-1">
            <Label htmlFor="company_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Company / Agency Name
            </Label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="company_name"
                placeholder="e.g. Holidays Bindas"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_name}
                onChange={(e) => updateFormField("company_name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="company_phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Helpline / Phone Number
            </Label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="company_phone"
                placeholder="e.g. +91 98765 43210"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_phone}
                onChange={(e) => updateFormField("company_phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="company_email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quotation / Support Email
            </Label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="company_email"
                placeholder="e.g. info@holidaysbindas.com"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_email}
                onChange={(e) => updateFormField("company_email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="company_website" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Website URL
            </Label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="company_website"
                placeholder="e.g. https://www.holidaysbindas.com"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_website}
                onChange={(e) => updateFormField("company_website", e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="company_address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Office / Branch Address
            </Label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                id="company_address"
                placeholder="e.g. Office No. 204, City Plaza, Main Road, New Delhi, India"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_address}
                onChange={(e) => updateFormField("company_address", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bank & Payment Details Section */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Official Bank & Payment Details
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Printed on Quotation Invoices
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Enter your official agency bank account details. These will be neatly printed on the investment and terms page of your quotation PDFs so clients can make advance deposits.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <Label htmlFor="bank_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bank Name
            </Label>
            <div className="relative">
              <Landmark className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="bank_name"
                placeholder="e.g. HDFC Bank Ltd."
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bank_account_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Beneficiary / Account Name
            </Label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="bank_account_name"
                placeholder="e.g. Holidays Bindas Travels"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.bank_account_name}
                onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bank_account_no" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Account Number
            </Label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="bank_account_no"
                placeholder="e.g. 50200012345678"
                className="pl-9 font-mono text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.bank_account_no}
                onChange={(e) => setFormData({ ...formData, bank_account_no: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bank_ifsc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              IFSC / Branch Code
            </Label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="bank_ifsc"
                placeholder="e.g. HDFC0001234"
                className="pl-9 font-mono uppercase text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="bank_upi_id" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              UPI ID / VPA (GPay / PhonePe / Paytm)
            </Label>
            <div className="relative">
              <QrCode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="bank_upi_id"
                placeholder="e.g. holidaysbindas@okhdfcbank"
                className="pl-9 font-mono text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.bank_upi_id}
                onChange={(e) => setFormData({ ...formData, bank_upi_id: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Changes apply to all generated Quotations & PDF proposals instantly
        </p>

        <Button
          type="submit"
          disabled={isSaving}
          className="rounded-xl px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Saving Profile...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Save Profile & Bank Details
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
