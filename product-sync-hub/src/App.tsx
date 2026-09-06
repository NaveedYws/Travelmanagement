import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";

// Helper to retry lazy loading if network fails
const lazyRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    for (let i = 0; i < 3; i++) {
      try {
        return await componentImport();
      } catch (error) {
        if (i === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return componentImport();
  });
};

const Index = lazyRetry(() => import("./pages/Index.tsx"));
const InquiryPage = lazyRetry(() => import("./pages/InquiryPage.tsx"));
const NotFound = lazyRetry(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/inquiry/:userId" element={<InquiryPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
