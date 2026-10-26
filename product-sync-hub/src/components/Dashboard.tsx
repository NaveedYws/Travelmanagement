import { useState, useMemo } from "react";
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
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const CATEGORY_CONFIG = {
  travel: { label: "Manage Packages", icon: Plane, itemName: "package", plural: "Packages", businessLabel: "Travel Agency" },
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
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const config = CATEGORY_CONFIG[businessType as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.products;
  const BusinessIcon = config.icon;

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

  const handleAdd = (data: any) => {
    addProduct.mutate({ ...data, category: businessType || "products" }, {
      onSuccess: () => toast.success("Added successfully"),
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
        await addProduct.mutateAsync({ ...item, category: businessType || "products" });
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

  // Structured SaaS Navigation
  const navSections = [
    {
      title: "WORKSPACE",
      items: [
        { id: "dashboard" as const, label: "Overview", icon: LayoutDashboard },
      ]
    },
    {
      title: "CATALOG & CONTENT",
      items: [
        { id: "manage" as const, label: config.label, icon: BusinessIcon, count: products.length },
        { id: "blogs" as const, label: "Manage Blogs", icon: BookOpen, count: blogs.length },
        ...(businessType === "travel" ? [{ id: "destinations" as const, label: "Destinations", icon: MapPin }] : []),
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

  const userInitial = user?.email?.[0]?.toUpperCase() || "U";
  const userPrefix = user?.email?.split("@")[0] || "User";

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6 sm:space-y-7">
            {/* Executive Studio Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0e131f] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  {/* Subtle Context Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                      Overview Studio
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
                      {config.businessLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Live Headless Feed
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Welcome back, <strong className="text-slate-900 dark:text-slate-100 font-semibold">{userPrefix}</strong>. You have <strong className="text-slate-900 dark:text-slate-100 font-semibold">{products.length} {config.plural.toLowerCase()}</strong> active in the catalog, <strong className="text-slate-900 dark:text-slate-100 font-semibold">{activeInquiryCount} {activeInquiryCount === 1 ? 'inquiry' : 'inquiries'}</strong> awaiting reply, and <strong className="text-slate-900 dark:text-slate-100 font-semibold">{blogs.length} articles</strong> synced to your headless API.
                  </p>
                </div>

                {/* Unified Studio Action Suite */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {/* Primary Action Button */}
                  {businessType === "travel" ? (
                    <TravelPackageForm 
                      onSubmit={handleAdd} 
                      trigger={
                        <Button size="sm" className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer">
                          <Plus className="w-4 h-4" />
                          <span>Add Package</span>
                        </Button>
                      } 
                    />
                  ) : businessType === "hotel" ? (
                    <HotelForm 
                      onSubmit={handleAdd} 
                      trigger={
                        <Button size="sm" className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer">
                          <Plus className="w-4 h-4" />
                          <span>Add Room</span>
                        </Button>
                      } 
                    />
                  ) : (
                    <ProductForm 
                      onSubmit={handleAdd} 
                      trigger={
                        <Button size="sm" className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white text-xs font-semibold gap-1.5 shadow-sm transition-all cursor-pointer">
                          <Plus className="w-4 h-4" />
                          <span>Add Product</span>
                        </Button>
                      } 
                    />
                  )}

                  {/* Secondary Actions with Consistent Clean Styling */}
                  {businessType === "travel" && (
                    <ItineraryMaker
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3.5 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Create Itinerary</span>
                        </Button>
                      }
                    />
                  )}

                  {businessType === "travel" && (
                    <DestinationManager
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3.5 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Add Destination</span>
                        </Button>
                      }
                    />
                  )}

                  <BlogForm
                    onSubmit={handleAddBlog}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3.5 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Add Article</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* 5 Bento Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Catalog Inventory */}
              <div 
                onClick={() => setActiveView("manage")}
                className="bg-white dark:bg-[#0e131f] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      Total {config.plural}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
                    {products.length}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Active in catalog feed</span>
                </div>
              </div>

              {/* Card 2: Blogs */}
              <div 
                onClick={() => setActiveView("blogs")}
                className="bg-white dark:bg-[#0e131f] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      Articles & Stories
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
                    {blogs.length}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">{blogs.filter(b => b.status === "published").length} published • SEO API</span>
                </div>
              </div>

              {/* Card 3: Inquiries / Leads (Clean, refined card without harsh borders) */}
              <div 
                onClick={() => setActiveView("inquiries")}
                className="bg-white dark:bg-[#0e131f] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      Active Inquiries
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
                    {inquiriesLoading ? "…" : activeInquiryCount}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  {activeInquiryCount > 0 ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate text-amber-600 dark:text-amber-400 font-medium">{activeInquiryCount} awaiting response</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{inquiries.length} total leads logged</span>
                    </>
                  )}
                </div>
              </div>

              {/* Card 4: Catalog Valuation */}
              <div className="bg-white dark:bg-[#0e131f] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Catalog Valuation</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
                    ₹{stats.totalValue > 0 ? stats.totalValue.toLocaleString() : "0"}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Combined tour inventory</span>
                </div>
              </div>

              {/* Card 5: Average Price */}
              <div className="bg-white dark:bg-[#0e131f] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Price</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
                    {stats.avgPrice > 0 ? `₹${stats.avgPrice.toLocaleString()}` : "—"}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="truncate">Per package listing</span>
                </div>
              </div>
            </div>

            {/* Row 2: Developer REST API & Workflow Launchpad */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* API Card (7 cols) */}
              <div className="lg:col-span-7">
                <ApiLinkCard />
              </div>

              {/* Workflow Launchpad (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#0e131f] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Compass className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      Workflow Launchpad
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">QUICK ACTIONS</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Fast access to proposal generators and content tools
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Action 1: Itinerary */}
                    {businessType === "travel" && (
                      <ItineraryMaker
                        className="w-full"
                        trigger={
                          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Itinerary Studio</p>
                                <p className="text-[11px] text-slate-400 truncate">Create quotation PDF</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        }
                      />
                    )}

                    {/* Action 2: Add Package */}
                    {businessType === "travel" ? (
                      <TravelPackageForm
                        onSubmit={handleAdd}
                        trigger={
                          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Add Package</p>
                                <p className="text-[11px] text-slate-400 truncate">New catalog listing</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        }
                      />
                    ) : businessType === "hotel" ? (
                      <HotelForm
                        onSubmit={handleAdd}
                        trigger={
                          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Add Room</p>
                                <p className="text-[11px] text-slate-400 truncate">New room listing</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        }
                      />
                    ) : (
                      <ProductForm
                        onSubmit={handleAdd}
                        trigger={
                          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Add Product</p>
                                <p className="text-[11px] text-slate-400 truncate">New store item</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        }
                      />
                    )}

                    {/* Action 3: Add Blog */}
                    <BlogForm
                      onSubmit={handleAddBlog}
                      trigger={
                        <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Write Article</p>
                              <p className="text-[11px] text-slate-400 truncate">Dual photos & SEO</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      }
                    />

                    {/* Action 4: Destinations */}
                    {businessType === "travel" && (
                      <DestinationManager
                        trigger={
                          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Destinations</p>
                                <p className="text-[11px] text-slate-400 truncate">Feed itineraries</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        }
                      />
                    )}

                    {/* Action 5: Bulk Import */}
                    <div className="w-full sm:col-span-2">
                      <BulkImport
                        onImport={handleBulkImport}
                        itemName={config.itemName}
                        trigger={
                          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <UploadCloud className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">Bulk Import via CSV</p>
                                <p className="text-[11px] text-slate-400 truncate">Import packages in batch</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Logged in as {userPrefix}
                  </span>
                  <span className="font-mono text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">{role || "Admin"}</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics & Activity */}
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
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                    {products.length} {config.plural}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Manage active catalog listings, live pricing, durations, and headless endpoints
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2.5">
                <BulkImport onImport={handleBulkImport} itemName={config.itemName} />
                {businessType === "travel" ? (
                  <TravelPackageForm onSubmit={handleAdd} />
                ) : businessType === "hotel" ? (
                  <HotelForm onSubmit={handleAdd} />
                ) : (
                  <ProductForm onSubmit={handleAdd} />
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20 bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#0e131f] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <BusinessIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">No {config.plural.toLowerCase()} listed yet</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Add your first listing or import them in bulk via CSV.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
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
          <div className="bg-white dark:bg-[#0e131f] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-2xl transition-colors shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Settings & Account</h2>
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
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 font-medium text-xs">
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
                <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs" onClick={signOut}>
                  Sign Out
                </Button>
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
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0c101a] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 shadow-sm",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">ProductHub</span>
                <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">PRO</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Headless Catalog OS</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dedicated Quick Action in Sidebar */}
        {businessType === "travel" && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
            <ItineraryMaker
              className="w-full"
              trigger={
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white font-medium text-xs transition-all cursor-pointer shadow-xs hover:shadow-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Create Itinerary</span>
                </button>
              }
            />
          </div>
        )}

        {/* Categorized Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
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
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-semibold shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive 
                            ? "text-white dark:text-slate-950" 
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                        )} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {"badge" in item && item.badge ? (
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0",
                          isActive
                            ? "bg-amber-400 text-slate-950"
                            : "bg-amber-500 text-white"
                        )}>
                          {item.badge}
                        </span>
                      ) : "count" in item && item.count !== undefined ? (
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.2 rounded-md shrink-0",
                          isActive
                            ? "bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800"
                            : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                        )}>
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

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="p-2.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[10px] text-slate-400 capitalize truncate">{businessType || "standard"} Workspace</span>
              </div>
            </div>
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Glass Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#070a10]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5" />
            </button>

            {/* Clean Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span 
                className="hidden sm:inline hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                onClick={() => setActiveView("dashboard")}
              >
                Workspace
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <span className="capitalize font-semibold text-slate-900 dark:text-slate-100">
                {activeView === "dashboard" ? "Overview Studio" : activeView.replace("-", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Pill */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog, leads..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-8 pr-10 py-1.5 text-xs focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 focus:outline-hidden w-56 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition-all"
                onClick={() => {
                  if (activeView !== "manage") setActiveView("manage");
                }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-1 py-0.2 rounded bg-white dark:bg-slate-800 pointer-events-none">
                ⌘K
              </span>
            </div>

            {/* Clean Live Sync Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>Live Sync</span>
            </div>

            {/* Theme Switcher */}
            <ThemeToggle />

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                {userInitial}
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium hidden sm:inline truncate max-w-[140px]">
                {userPrefix}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/60 dark:bg-[#070a10] transition-colors">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
