import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useInquiries } from "@/hooks/useInquiries";
import { DashboardCharts } from "./DashboardCharts";
import { ProductCard } from "./ProductCard";
import { ApiLinkCard } from "./ApiLinkCard";
import { ProductForm } from "./ProductForm";
import { TravelPackageForm } from "./TravelPackageForm";
import { HotelForm } from "./HotelForm";
import { InquiryDashboard } from "./InquiryDashboard";
import { AdminUsers } from "./AdminUsers";
import { BulkImport } from "./BulkImport";
import { ItineraryMaker } from "./ItineraryMaker";
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
  FileText
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

  const activeInquiryCount = inquiries.filter((i) => i.status === "new" || i.status === "contacted").length;
  const [activeView, setActiveView] = useState<"dashboard" | "manage" | "inquiries" | "settings" | "admin">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "manage", label: config.label, icon: BusinessIcon, count: products.length },
    { id: "inquiries", label: "Inquiries", icon: ClipboardList, badge: activeInquiryCount > 0 ? activeInquiryCount : undefined },
    ...((role === "admin" || user?.email === "adsverse0@gmail.com") ? [{ id: "admin", label: "Admin", icon: Users }] : []),
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Clean Page Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Overview</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {config.businessLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Catalog inventory, customer inquiry volume, and live API status.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {businessType === "travel" && (
                  <ItineraryMaker
                    trigger={
                      <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Create Itinerary</span>
                      </button>
                    }
                  />
                )}

                {businessType === "travel" ? (
                  <TravelPackageForm 
                    onSubmit={handleAdd} 
                    trigger={
                      <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add Package
                      </Button>
                    } 
                  />
                ) : businessType === "hotel" ? (
                  <HotelForm 
                    onSubmit={handleAdd} 
                    trigger={
                      <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add Room
                      </Button>
                    } 
                  />
                ) : (
                  <ProductForm 
                    onSubmit={handleAdd} 
                    trigger={
                      <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                      </Button>
                    } 
                  />
                )}
              </div>
            </div>

            {/* 4 Crisp KPI Cards (Stripe / Linear style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1 */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-medium">Total {config.plural}</span>
                  <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{products.length}</div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Active in catalog</p>
              </div>

              {/* Metric 2 */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-medium">Active Inquiries</span>
                  <ClipboardList className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {inquiriesLoading ? "…" : activeInquiryCount}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {activeInquiryCount > 0 ? `${activeInquiryCount} awaiting response` : `${inquiries.length} total leads`}
                </p>
              </div>

              {/* Metric 3 */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-medium">Catalog Valuation</span>
                  <DollarSign className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  ₹{stats.totalValue > 0 ? stats.totalValue.toLocaleString() : "0"}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Combined listing prices</p>
              </div>

              {/* Metric 4 */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-medium">Average Price</span>
                  <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {stats.avgPrice > 0 ? `₹${stats.avgPrice.toLocaleString()}` : "—"}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Across all listings</p>
              </div>
            </div>

            {/* Row 2: API Link Card & Quick Actions Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ApiLinkCard />
              </div>

              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Quick Actions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Frequently used shortcuts</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {businessType === "travel" && (
                      <ItineraryMaker
                        className="w-full"
                        trigger={
                          <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer">
                            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Itinerary Studio</p>
                              <p className="text-[10px] text-slate-400 truncate">Create quotation</p>
                            </div>
                          </div>
                        }
                      />
                    )}

                    {businessType === "travel" ? (
                      <TravelPackageForm
                        onSubmit={handleAdd}
                        trigger={
                          <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer">
                            <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Add Package</p>
                              <p className="text-[10px] text-slate-400 truncate">New tour listing</p>
                            </div>
                          </div>
                        }
                      />
                    ) : businessType === "hotel" ? (
                      <HotelForm
                        onSubmit={handleAdd}
                        trigger={
                          <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer">
                            <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Add Room</p>
                              <p className="text-[10px] text-slate-400 truncate">New room listing</p>
                            </div>
                          </div>
                        }
                      />
                    ) : (
                      <ProductForm
                        onSubmit={handleAdd}
                        trigger={
                          <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer">
                            <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Add Product</p>
                              <p className="text-[10px] text-slate-400 truncate">Store item</p>
                            </div>
                          </div>
                        }
                      />
                    )}

                    <div
                      onClick={() => setActiveView("inquiries")}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Inquiries</p>
                          {activeInquiryCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                              {activeInquiryCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">View leads</p>
                      </div>
                    </div>

                    <div className="w-full">
                      <BulkImport onImport={handleBulkImport} itemName={config.itemName} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Logged in as {user?.email?.split('@')[0]}</span>
                  <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{role || "User"}</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics */}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{config.label}</h2>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {products.length} {config.plural}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Manage your active catalog listings, pricing, and availability
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
              <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
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

      case "inquiries":
        return <InquiryDashboard />;

      case "admin":
        return <AdminUsers />;

      case "settings":
        return (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">Settings & Account</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Account Email</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.email}</p>
                </div>
                <Badge variant="outline" className="text-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                  Verified
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
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
                  <Button type="submit" disabled={isUpdatingPass} className="mt-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white text-xs">
                    {isUpdatingPass ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Sign Out</p>
                  <p className="text-[11px] text-slate-400">Log out of your current session</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs" onClick={signOut}>
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-150">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">Product Hub</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">v2.0</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Itinerary Sidebar Action */}
        {businessType === "travel" && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <ItineraryMaker
              className="w-full"
              trigger={
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Create Itinerary</span>
                </button>
              }
            />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )} />
                  <span className="truncate">{item.label}</span>
                </div>

                {"badge" in item && item.badge ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white shrink-0">
                    {item.badge}
                  </span>
                ) : "count" in item && item.count !== undefined ? (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* User Profile Card in Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize truncate">{businessType || "standard"}</p>
            </div>
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search listings..."
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-12 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 focus:border-slate-400 w-60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                onClick={() => {
                  if (activeView !== "manage") setActiveView("manage");
                }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-1 rounded bg-white dark:bg-slate-800 pointer-events-none">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Sync
            </div>

            {/* Dark & Light Theme Switcher */}
            <ThemeToggle />

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
              {user?.email}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#fafafa] dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
