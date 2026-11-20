import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { resolveImageUrl } from "./ItineraryPdfDocument";
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
  Loader2,
  Facebook,
  Instagram
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
    company_facebook: "",
    company_instagram: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_no: "",
    bank_ifsc: "",
    bank_upi_id: "",
    bank_qr: "",
    reviews_banner: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [isUploadingReviews, setIsUploadingReviews] = useState(false);

  useEffect(() => {
    let localProfile: any = {};
    let cachedLogo = "";
    try {
      const raw = localStorage.getItem("agency_company_profile");
      if (raw) localProfile = JSON.parse(raw);
      cachedLogo = localStorage.getItem("agency_company_logo_data") || "";
    } catch {}

    setFormData({
      company_name: user?.company_name || localProfile.company_name || "",
      company_logo: user?.company_logo || localProfile.company_logo || cachedLogo || "",
      company_phone: user?.company_phone || localProfile.company_phone || "",
      company_email: user?.company_email || user?.email || localProfile.company_email || "",
      company_address: user?.company_address || localProfile.company_address || "",
      company_website: user?.company_website || localProfile.company_website || "",
      company_facebook: user?.company_facebook || localProfile.company_facebook || localProfile.facebook || "",
      company_instagram: user?.company_instagram || localProfile.company_instagram || localProfile.instagram || "",
      bank_name: user?.bank_name || localProfile.bank_name || "",
      bank_account_name: user?.bank_account_name || localProfile.bank_account_name || "",
      bank_account_no: user?.bank_account_no || localProfile.bank_account_no || "",
      bank_ifsc: user?.bank_ifsc || localProfile.bank_ifsc || "",
      bank_upi_id: user?.bank_upi_id || localProfile.bank_upi_id || "",
      bank_qr: user?.bank_qr || localProfile.bank_qr || "",
      reviews_banner: user?.reviews_banner || localProfile.reviews_banner || ""
    });
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    setIsUploadingLogo(true);
    try {
      // 1. Read base64 for instant local display and fallback
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Update immediate preview
      setFormData((prev) => ({ ...prev, company_logo: dataUrl }));

      // 2. Upload to server to get permanent public URL
      let finalLogo = dataUrl;
      try {
        const res = await api.upload(file);
        if (res && res.publicUrl) {
          finalLogo = res.publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Server file upload endpoint error, saving base64 directly to database:", uploadErr);
      }

      // 3. Persist to state and storage
      const updatedProfile = { ...formData, company_logo: finalLogo };
      setFormData(updatedProfile);
      try {
        localStorage.setItem("agency_company_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("agency_company_logo_data", finalLogo);
        window.dispatchEvent(new Event("agency_profile_updated"));
      } catch {}

      // 4. Save directly to database so all tabs, browsers, and devices immediately reflect it!
      await updateProfile(updatedProfile);
      toast.success("Logo uploaded and saved to database successfully!");
    } catch (err: any) {
      console.error("Error saving logo:", err);
      toast.error(err?.message || "Failed to save logo to database");
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    setIsUploadingQr(true);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setFormData((prev) => ({ ...prev, bank_qr: dataUrl }));

      let finalQr = dataUrl;
      try {
        const res = await api.upload(file);
        if (res && res.publicUrl) {
          finalQr = res.publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Server upload skipped, using direct data URL:", uploadErr);
      }

      const updatedProfile = { ...formData, bank_qr: finalQr };
      setFormData(updatedProfile);
      try {
        localStorage.setItem("agency_company_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("agency_bank_qr_data", finalQr);
        window.dispatchEvent(new Event("agency_profile_updated"));
      } catch {}

      await updateProfile(updatedProfile);
      toast.success("Payment QR code uploaded and saved to database successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save QR code to database");
    } finally {
      setIsUploadingQr(false);
      e.target.value = "";
    }
  };

  const handleReviewsBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    setIsUploadingReviews(true);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setFormData((prev) => ({ ...prev, reviews_banner: dataUrl }));

      let finalBanner = dataUrl;
      try {
        const res = await api.upload(file);
        if (res && res.publicUrl) {
          finalBanner = res.publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Server upload skipped, using direct data URL:", uploadErr);
      }

      const updatedProfile = { ...formData, reviews_banner: finalBanner };
      setFormData(updatedProfile);
      try {
        localStorage.setItem("agency_company_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("agency_reviews_banner_data", finalBanner);
        window.dispatchEvent(new Event("agency_profile_updated"));
      } catch {}

      await updateProfile(updatedProfile);
      toast.success("Reviews banner uploaded and saved to database successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save reviews banner to database");
    } finally {
      setIsUploadingReviews(false);
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
        if (formData.company_logo) {
          localStorage.setItem("agency_company_logo_data", formData.company_logo);
        } else {
          localStorage.removeItem("agency_company_logo_data");
        }
        window.dispatchEvent(new Event("agency_profile_updated"));
      } catch {}

      await updateProfile(formData);
      toast.success("Company profile & bank details saved to database successfully!");
    } catch (err: any) {
      console.error("Failed to save profile to database:", err);
      toast.error(err?.message || "Failed to save profile to database");
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
                src={resolveImageUrl(formData.company_logo)}
                alt="Company Logo"
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== formData.company_logo && formData.company_logo) {
                    target.src = formData.company_logo;
                  }
                }}
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
                  onClick={async () => {
                    const next = { ...formData, company_logo: "" };
                    setFormData(next);
                    try {
                      localStorage.setItem("agency_company_profile", JSON.stringify(next));
                      localStorage.removeItem("agency_company_logo_data");
                      window.dispatchEvent(new Event("agency_profile_updated"));
                      await updateProfile(next);
                      toast.success("Logo removed from database");
                    } catch (err) {
                      console.warn("Could not sync logo removal to server:", err);
                    }
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

          <div className="space-y-1">
            <Label htmlFor="company_facebook" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Facebook Page / Link
            </Label>
            <div className="relative">
              <Facebook className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
              <Input
                id="company_facebook"
                placeholder="e.g. facebook.com/holidaysbindas or @holidaysbindas"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_facebook}
                onChange={(e) => updateFormField("company_facebook", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="company_instagram" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Instagram Profile / Link
            </Label>
            <div className="relative">
              <Instagram className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pink-600 dark:text-pink-400" />
              <Input
                id="company_instagram"
                placeholder="e.g. instagram.com/holidaysbindas or @holidaysbindas"
                className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                value={formData.company_instagram}
                onChange={(e) => updateFormField("company_instagram", e.target.value)}
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

          {/* Payment QR Code Upload */}
          <div className="sm:col-span-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Upload Official Payment QR Code (PhonePe / GPay / Paytm / Bank QR)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Shows directly on Quotation PDFs
              </span>
            </Label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {formData.bank_qr ? (
                  <img
                    src={resolveImageUrl(formData.bank_qr)}
                    alt="Payment QR Code"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-1.5 text-slate-400">
                    <QrCode className="w-6 h-6 mx-auto mb-1 opacity-60 text-emerald-600" />
                    <span className="text-[8.5px] font-semibold block leading-tight">No QR Code</span>
                  </div>
                )}
                {isUploadingQr && (
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
                      onChange={handleQrUpload}
                      disabled={isUploadingQr}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {formData.bank_qr ? "Change QR Code" : "Upload QR Code"}
                    </span>
                  </label>

                  {formData.bank_qr && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...formData, bank_qr: "" };
                        setFormData(next);
                        try {
                          localStorage.setItem("agency_company_profile", JSON.stringify(next));
                          localStorage.removeItem("agency_bank_qr_data");
                          window.dispatchEvent(new Event("agency_profile_updated"));
                        } catch {}
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="pt-0.5">
                  <Input
                    placeholder="Or paste direct QR Code Image URL (https://...)"
                    className="text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-8 font-mono"
                    value={formData.bank_qr?.startsWith("data:") ? "" : formData.bank_qr || ""}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const next = { ...formData, bank_qr: val };
                      setFormData(next);
                      try {
                        localStorage.setItem("agency_company_profile", JSON.stringify(next));
                        window.dispatchEvent(new Event("agency_profile_updated"));
                      } catch {}
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload screenshot or image of your UPI / Merchant QR code. Clients can scan this directly from the quotation PDF.
                </p>
              </div>
            </div>
          </div>

          {/* Google Reviews / Feedback Banner Upload */}
          <div className="sm:col-span-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Google Reviews &amp; Client Feedback Widget (Printed after payment on final page)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Shows on last page of Quotation PDFs
              </span>
            </Label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="relative w-40 h-16 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img
                  src={resolveImageUrl(formData.reviews_banner || "/google-reviews-banner.png")}
                  alt="Reviews Banner Preview"
                  className="w-full h-full object-contain p-1"
                />
                {isUploadingReviews && (
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
                      onChange={handleReviewsBannerUpload}
                      disabled={isUploadingReviews}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {formData.reviews_banner ? "Change Reviews Banner" : "Upload Custom Reviews Banner"}
                    </span>
                  </label>

                  {formData.reviews_banner && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...formData, reviews_banner: "" };
                        setFormData(next);
                        try {
                          localStorage.setItem("agency_company_profile", JSON.stringify(next));
                          localStorage.removeItem("agency_reviews_banner_data");
                          window.dispatchEvent(new Event("agency_profile_updated"));
                        } catch {}
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Default Google reviews banner with review QR code is automatically included on the last page. You can customize it by uploading your own banner anytime.
                </p>
              </div>
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
