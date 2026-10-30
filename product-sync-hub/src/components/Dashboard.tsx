import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useInquiries } from "@/hooks/useInquiries";
import { useBlogs } from "@/hooks/useBlogs";
import { DashboardCharts } from "./DashboardCharts";
import { ProductCard } from "./ProductCard";
import { ApiLinkCard } from "./ApiLinkCard";
import { ProductForm } from "./ProductForm";
import { TravelPackageForm } from "./TravelPackageForm";
import { HotelForm } from "./HotelForm";
import { BlogForm } from "./BlogForm";
import { BlogManager } from "./BlogManager";
import { InquiryDashboard } from "./InquiryDashboard";
import { AdminUsers } from "./AdminUsers";
import { BulkImport } from "./BulkImport";
import { ItineraryMaker } from "./ItineraryMaker";
import { DestinationManager } from "./DestinationManager";
import { CompanyProfileSettings } from "./CompanyProfileSettings";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Settings, 
  Users, 
  LayoutDashboard, 
  Package, 
  LogOut, 
  Loader2, 
  Lock, 
  Menu, 
  X, 
  Plane, 
  Hotel, 
  ShoppingBag, 
  ClipboardList, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Compass, 
  ArrowUpRight, 
  ChevronRight, 
  CheckCircle2, 
  Calendar, 
  UploadCloud, 
  ChevronDown, 
  Rocket, 
  MessageSquare, 
  Bell, 
  PlusCircle, 
  Edit3, 
  Zap,
  ArrowUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const CATEGORY_CONFIG = {
  travel: { label: "Manage Packages", icon: Layers, itemName: "package", plural: "Packages", businessLabel: "Travel Agency & CRM" },
  hotel: { label: "Manage Rooms", icon: Hotel, itemName: "room", plural: "Rooms", businessLabel: "Hotel & Rooms" },
  products: { label: "Manage Store", icon: ShoppingBag, itemName: "item", plural: "Products", businessLabel: "Store" },
} as const;

export function Dashboard() {
  const { user, businessType, role, signOut } = useAuth();
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProducts(user?.id);
  const { inquiries, isLoading: inquiriesLoading } = useInquiries(user?.id);
  const { blogs, addBlog } = useBlogs(user?.id);

  const activeInquiryCount = inquiries.filter((i) => i.status === "new" || i.status === "contacted").length;
  const [activeView, setActiveView] = useState<"dashboard" | "manage" | "blogs" | "inquiries" | "destinations" | "settings" | "admin">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<"today" | "7days" | "30days" | "month">("today");
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const config = CATEGORY_CONFIG[businessType as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.travel;

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setMobileSearchOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
        } else {
          searchInputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const stats = useMemo(() => {
    const converted = inquiries.filter((i) => i.status === "converted").length;
    const conversionRate = inquiries.length > 0 ? Math.round((converted / inquiries.length) * 100) : 0;
    const avgPrice =
      products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + Number(p.price || 0), 0) / products.length)
        : 0;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price || 0), 0);
    return { activeInquiryCount, conversionRate, avgPrice, totalValue };
  }, [products, inquiries, activeInquiryCount]);

  // Real-time filtered products for search
  const filteredProducts = useMemo(() => {
    if (!searchFilter.trim()) return products;
    const q = searchFilter.toLowerCase();
    return products.filter((p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, searchFilter]);

  const handleAdd = (data: any) => {
    addProduct.mutate({ ...data, category: businessType || "travel" }, {
      onSuccess: () => toast.success("Package added successfully"),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleUpdate = (data: any) => {
    updateProduct.mutate(data, {
      onSuccess: () => toast.success("Updated successfully"),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleBulkImport = async (items: any[]) => {
    let successCount = 0;
    let errorCount = 0;

    toast.info(`Starting import of ${items.length} items...`);

    for (const item of items) {
      try {
        await addProduct.mutateAsync({ ...item, category: businessType || "travel" });
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`Successfully imported ${successCount} items`);
    } else {
      toast.warning(`Imported ${successCount} items, but ${errorCount} failed.`);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setIsUpdatingPass(true);
    try {
      await api.post("/api/auth/update-password.php", {
        current_password: passwords.current,
        new_password: passwords.new
      });
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id, {
      onSuccess: () => toast.success("Deleted successfully"),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleAddBlog = (data: any) => {
    addBlog.mutate(data, {
      onSuccess: () => toast.success("Blog article published successfully!"),
      onError: (err: any) => toast.error(err.message || "Failed to publish blog"),
    });
  };

  // Structured Sidebar Navigation Matching Image 2
  const navSections = [
    {
      title: "WORKSPACE",
      items: [
        { id: "dashboard" as const, label: "Overview", icon: TrendingUp },
      ]
    },
    {
      title: "CATALOG & CONTENT",
      items: [
        { id: "manage" as const, label: "Manage Packages", icon: Layers, count: products.length },
        { id: "destinations" as const, label: "Destinations", icon: MapPin },
        { id: "blogs" as const, label: "Manage Blogs", icon: FileText, count: blogs.length },
      ]
    },
    {
      title: "LEADS & CRM",
      items: [
        { id: "inquiries" as const, label: "Inquiries CRM", icon: ClipboardList, badge: activeInquiryCount > 0 ? activeInquiryCount : undefined },
      ]
    },
    {
      title: "SETTINGS",
      items: [
        ...((role === "admin" || user?.email === "adsverse0@gmail.com") ? [{ id: "admin" as const, label: "Admin Access", icon: Users }] : []),
        { id: "settings" as const, label: "Settings & Profile", icon: Settings },
      ]
    }
  ];

  const userInitial = user?.email?.[0]?.toUpperCase() || "A";
  const userPrefix = user?.email?.split("@")[0] || "adsverse0";

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6 sm:space-y-7">
            {/* Scenic Mountain Landscape Hero Banner Matching Image 2 */}
            <div 
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.04)] min-h-[200px] flex items-center p-6 sm:p-7 transition-all"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center right'
              }}
            >
              {/* Soft frosted gradient overlay so text is crystal clear */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent/10 dark:from-[#0B1120] dark:via-[#0B1120]/90 dark:to-transparent/20" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10 w-full">
                <div className="space-y-3 max-w-2xl">
                  {/* Friendly Welcome Pill with Emoji */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50/90 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
                    <span>👋</span>
                    <span>Welcome back, {userPrefix}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Overview Studio
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    You have <strong className="text-slate-900 dark:text-white font-bold">{products.length} packages</strong> active in the catalog, <strong className="text-slate-900 dark:text-white font-bold">{activeInquiryCount} {activeInquiryCount === 1 ? "inquiry" : "inquiries"}</strong> awaiting reply, and <strong className="text-slate-900 dark:text-white font-bold">{blogs.length} articles</strong> synced to your headless API.
                  </p>

                  {/* Date Filter Pills Matching Image 2 */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <button
                      onClick={() => setDateFilter("today")}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        dateFilter === "today"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700"
                      )}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setDateFilter("7days")}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        dateFilter === "7days"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700"
                      )}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setDateFilter("30days")}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        dateFilter === "30days"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700"
                      )}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setDateFilter("month")}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        dateFilter === "month"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700"
                      )}
                    >
                      This Month
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="shrink-0 self-start lg:self-center flex items-center gap-2.5">
                  <ItineraryMaker
                    trigger={
                      <button className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2 shadow-md shadow-blue-500/25 transition-all flex items-center cursor-pointer">
                        <FileText className="w-4 h-4" />
                        <span>Create Quotation</span>
                      </button>
                    }
                  />
                  <TravelPackageForm 
                    onSubmit={handleAdd} 
                    trigger={
                      <button className="h-10 px-4 rounded-xl bg-[#0F172A] hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold gap-2 shadow-md transition-all flex items-center cursor-pointer">
                        <Plus className="w-4 h-4" />
                        <span>Add Package</span>
                      </button>
                    } 
                  />
                </div>
              </div>
            </div>

            {/* 5 Bento Metric Stat Cards Matching Image 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {/* Card 1: Total Packages (Blue Cube) */}
              <div 
                onClick={() => setActiveView("manage")}
                className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Total Packages
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {products.length}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="text-sm leading-none">↗</span> Active in catalog
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {products.length > 0 ? `${products.length} listed` : "Catalog empty"}
                  </p>
                </div>
              </div>

              {/* Card 2: Articles & Stories (Green Document) */}
              <div 
                onClick={() => setActiveView("blogs")}
                className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Articles & Stories
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {blogs.length}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Published • SEO
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {blogs.length > 0 ? `${blogs.length} live posts` : "No articles yet"}
                  </p>
                </div>
              </div>

              {/* Card 3: Active Inquiries (Purple Chat Bubble) */}
              <div 
                onClick={() => setActiveView("inquiries")}
                className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Active Inquiries
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {inquiriesLoading ? "…" : activeInquiryCount}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {activeInquiryCount > 0 ? `${activeInquiryCount} awaiting reply` : "All caught up"}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {activeInquiryCount > 0 ? "Requires action" : "No pending inquiries"}
                  </p>
                </div>
              </div>

              {/* Card 4: Catalog Value (Peach/Amber Currency) */}
              <div className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Catalog Value
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    ₹{stats.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Combined tour catalog
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {products.length > 0 ? `Across ${products.length} packages` : "No packages added"}
                  </p>
                </div>
              </div>

              {/* Card 5: Average Listing Price (Pink Trending) - Spans 2 cols on mobile */}
              <div className="bg-white dark:bg-[#0e131f] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/60 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Average Listing Price
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    ₹{stats.avgPrice.toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Across active packages
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {products.length > 0 ? `Calculated from catalog` : "No packages added"}
                  </p>
                </div>
              </div>
            </div>

            {/* Row 2: Developer REST API & Workflow Launchpad Matching Image 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* API Card (7 cols) */}
              <div className="lg:col-span-7">
                <ApiLinkCard />
              </div>

              {/* Workflow Launchpad (5 cols) Matching Image 2 */}
              <div className="lg:col-span-5 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
                      Workflow Launchpad
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">QUICK ACTIONS</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                    Fast access to proposal generators and content tools
                  </p>

                  <div className="space-y-2">
                    {/* Item 1: Itinerary Studio */}
                    <ItineraryMaker
                      className="w-full"
                      trigger={
                        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Itinerary Studio</p>
                              <p className="text-[11px] text-slate-400 truncate">Create quotation PDF</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      }
                    />

                    {/* Item 2: Add Package */}
                    <TravelPackageForm
                      onSubmit={handleAdd}
                      trigger={
                        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <PlusCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Add Package</p>
                              <p className="text-[11px] text-slate-400 truncate">New catalog listing</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      }
                    />

                    {/* Item 3: Write Article */}
                    <BlogForm
                      onSubmit={handleAddBlog}
                      trigger={
                        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Write Article</p>
                              <p className="text-[11px] text-slate-400 truncate">Dual photos & SEO</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      }
                    />

                    {/* Item 4: Destinations */}
                    <DestinationManager
                      trigger={
                        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Destinations</p>
                              <p className="text-[11px] text-slate-400 truncate">Feed itineraries</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      }
                    />

                    {/* Item 5: Bulk Import via CSV */}
                    <BulkImport
                      onImport={handleBulkImport}
                      itemName={config.itemName}
                      trigger={
                        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <UploadCloud className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Bulk Import via CSV</p>
                              <p className="text-[11px] text-slate-400 truncate">Import packages in batch</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      }
                    />
                  </div>
                </div>

                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Logged in as {userPrefix}
                  </span>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 capitalize">{role || "Admin"}</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics & Activity Matching Image 2 */}
            <DashboardCharts
              products={products}
              inquiries={inquiries}
              isLoading={isLoading || inquiriesLoading}
              itemPlural={config.plural}
              onViewInquiries={() => setActiveView("inquiries")}
              onViewManage={() => setActiveView("manage")}
            />
          </div>
        );

      case "manage":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{config.label}</h2>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {filteredProducts.length} {config.plural}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Manage active catalog listings, live pricing, durations, and headless endpoints
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2.5">
                <BulkImport onImport={handleBulkImport} itemName={config.itemName} />
                {businessType === "hotel" ? (
                  <HotelForm onSubmit={handleAdd} />
                ) : (
                  <TravelPackageForm onSubmit={handleAdd} />
                )}
              </div>
            </div>

            {/* Search Filter Alert / Clear */}
            {searchFilter.trim() && (
              <div className="flex items-center justify-between bg-slate-100/90 dark:bg-slate-800/70 px-4 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span>
                  Filtering {config.plural.toLowerCase()} by &ldquo;<strong>{searchFilter}</strong>&rdquo; ({filteredProducts.length} matched)
                </span>
                <button
                  onClick={() => setSearchFilter("")}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20 bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#0e131f] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">
                    {searchFilter.trim() ? "No matching listings found" : `No ${config.plural.toLowerCase()} listed yet`}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {searchFilter.trim() ? "Try searching with a different term or clear the filter." : "Add your first listing or import them in bulk via CSV."}
                  </p>
                  {searchFilter.trim() && (
                    <Button variant="outline" size="sm" onClick={() => setSearchFilter("")} className="mt-3 text-xs">
                      Clear Search Filter
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        );

      case "blogs":
        return <BlogManager />;

      case "destinations":
        return <DestinationManager inline />;

      case "inquiries":
        return <InquiryDashboard />;

      case "admin":
        return <AdminUsers />;

      case "settings":
        return (
          <div className="space-y-8 max-w-4xl pb-12">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Agency Profile & Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure your company branding and official bank remittance details for generated quotation PDFs.
              </p>
            </div>

            {/* Company Branding & Bank Details for Quotation PDF */}
            <CompanyProfileSettings />

            {/* Account & Security Card */}
            <div className="bg-white dark:bg-[#0e131f] p-5 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                Account & Security
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Account Email</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Business Profile Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">{businessType || "standard"} Mode</p>
                  </div>
                  <Badge className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-50 border border-blue-200 dark:border-blue-800/60 font-medium text-xs">
                    Active
                  </Badge>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" /> Change Password
                  </h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="current-pass" className="text-xs text-slate-700 dark:text-slate-300">Current Password</Label>
                        <Input
                          id="current-pass"
                          type="password"
                          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="new-pass" className="text-xs text-slate-700 dark:text-slate-300">New Password</Label>
                          <Input
                            id="new-pass"
                            type="password"
                            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="confirm-pass" className="text-xs text-slate-700 dark:text-slate-300">Confirm New Password</Label>
                          <Input
                            id="confirm-pass"
                            type="password"
                            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <Button type="submit" disabled={isUpdatingPass} className="mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white text-xs">
                      {isUpdatingPass ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Sign Out</p>
                    <p className="text-[11px] text-slate-400">Log out of your current session</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs cursor-pointer" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#070a10] text-slate-900 dark:text-slate-100 flex transition-colors duration-150">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Rich Midnight Navy Sidebar Matching Image 2 */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#0B132B] border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 shadow-xl lg:shadow-none text-white",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight leading-tight">ProductHub</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white shadow-xs">PRO</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Travel Agency & CRM</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Cluster: Dashboard (Active) & Create Itinerary */}
        <div className="p-3 space-y-1.5 border-b border-slate-800/80">
          <button
            onClick={() => {
              setActiveView("dashboard");
              setSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer",
              activeView === "dashboard"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <ItineraryMaker
            className="w-full"
            trigger={
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 border border-slate-700/80 bg-slate-900/60 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Create Quotation</span>
              </button>
            }
          />
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-slate-400 tracking-wider">
                {sec.title}
              </span>
              <div className="space-y-0.5 pt-1">
                {sec.items.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer group relative",
                        isActive
                          ? "bg-white/15 text-white font-semibold"
                          : "text-slate-400 hover:bg-white/5 hover:text-white font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                        )} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {"badge" in item && item.badge ? (
                        <span className="w-5 h-5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center justify-center shrink-0">
                          {item.badge}
                        </span>
                      ) : "count" in item && item.count !== undefined ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300 shrink-0">
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card in Sidebar Footer Matching Image 2 */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="p-2.5 bg-[#0F1A36] rounded-xl border border-slate-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 border border-slate-700">
              {userInitial}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-400 capitalize truncate">Travel Workspace</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Navbar Matching Image 2 */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#070a10]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
          <div className="h-16 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Centered / Wide Search Pill Matching Image 2 */}
              <div className="relative w-full max-w-md hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search catalog, leads, packages..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-full pl-9 pr-10 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  onClick={() => {
                    if (activeView !== "manage") setActiveView("manage");
                  }}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 pointer-events-none">
                  ⌘K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                  if (!mobileSearchOpen) {
                    setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
                  }
                }}
                className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Live Sync Pill Matching Image 2 */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync</span>
              </div>

              {/* Theme Switcher (Moon/Sun) */}
              <ThemeToggle />

              {/* Notification Bell with red dot */}
              <button 
                onClick={() => setActiveView("inquiries")} 
                title="Notifications" 
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 relative hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {activeInquiryCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* User Profile Pill Matching Image 2 */}
              <div className="flex items-center gap-2 pl-1 cursor-pointer" onClick={() => setActiveView("settings")}>
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="truncate max-w-[120px]">{userPrefix}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Collapsible Search Drawer */}
          {mobileSearchOpen && (
            <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in slide-in-from-top-2 duration-150">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Search catalog, leads, packages..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
                  onClick={() => {
                    if (activeView !== "manage") setActiveView("manage");
                  }}
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/60 dark:bg-[#070a10] transition-colors">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
