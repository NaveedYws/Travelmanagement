import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Package, Plane, Hotel, ShoppingBag } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "travel", label: "Travel Agency", icon: Plane },
  { value: "hotel", label: "Hotel Business", icon: Hotel },
  { value: "products", label: "Products / Store", icon: ShoppingBag },
] as const;

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const { signIn, signUp, verifyOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !businessType && !isVerifyingOtp) {
      toast.error("Please select a business type");
      return;
    }
    setLoading(true);
    try {
      if (isVerifyingOtp) {
        await verifyOtp(email, otp);
        toast.success("Email verified successfully!");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      if (err.message.includes("verify your email")) {
        setIsVerifyingOtp(true);
        toast.info("Please enter the verification code sent to your email.");
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white">
      {/* Left Side: Decorative Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-sm font-medium">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            Empowering modern businesses
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
              Manage your business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Precision.</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Product Hub is the all-in-one platform for travel agencies, hotels, and online stores to sync, track, and scale operations effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8">
            {[
              { icon: Plane, label: "Travel" },
              { icon: Hotel, label: "Hotels" },
              { icon: ShoppingBag, label: "E-com" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                <item.icon className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-200">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isVerifyingOtp ? "Verify your email" : isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-slate-500">
              {isVerifyingOtp 
                ? `We've sent a 6-digit code to ${email}` 
                : isLogin 
                  ? "Please enter your details to sign in." 
                  : "Join thousands of businesses managing their inventory today."}
            </p>
          </div>

          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {isVerifyingOtp ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input 
                        id="otp"
                        type="text" 
                        placeholder="000000" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        required 
                        maxLength={6}
                        className="h-14 text-center text-2xl font-bold tracking-[0.5em] bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify & Continue"}
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setIsVerifyingOtp(false)}
                      className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Back to registration
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input 
                          id="email"
                          type="email" 
                          placeholder="name@company.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                          className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all pl-10"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password"
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6} 
                        className="h-12 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all pl-10"
                      />
                    </div>

                    {!isLogin && (
                      <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Label>Business Type</Label>
                        <Select value={businessType} onValueChange={setBusinessType}>
                          <SelectTrigger className="h-12 bg-gray-50 border-gray-100">
                            <SelectValue placeholder="What do you manage?" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((bt) => {
                              const Icon = bt.icon;
                              return (
                                <SelectItem key={bt.value} value={bt.value}>
                                  <span className="flex items-center gap-3">
                                    <div className="p-1 bg-gray-100 rounded-md">
                                      <Icon className="w-4 h-4 text-slate-600" />
                                    </div>
                                    {bt.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading ? "Processing..." : isLogin ? "Sign In" : "Get Started"}
                    </Button>
                  </>
                )}
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-medium tracking-widest">or continue with</span>
                </div>
              </div>

              {isLogin && !isVerifyingOtp && (
                <p className="text-center text-slate-500">
                  New here? Contact an administrator to create your account.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-xs text-slate-400">
            &copy; 2026 Product Hub Inc. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
