import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Home from "./pages/Home";
import { PwaUpdatePrompt } from "./components/PwaUpdatePrompt";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ChatInquiryWidget from "./components/ChatInquiryWidget";

// 첫 화면(Home)은 즉시 로딩, 나머지 라우트는 lazy 로딩으로 초기 번들 최소화
const LoginPage = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SignupPage = lazy(() => import("./pages/Signup"));
const Community = lazy(() => import("./pages/Community"));
const ResidentialRental = lazy(() => import("./pages/ResidentialRental"));
const LandSearch = lazy(() => import("./pages/LandSearch"));
const NonResidentialRental = lazy(() => import("./pages/NonResidentialRental"));
const CommercialRental = lazy(() => import("./pages/CommercialRental"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicProperty = lazy(() => import("./pages/PublicProperty"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const MyProperties = lazy(() => import("./pages/MyProperties"));
const MyPage = lazy(() => import("./pages/MyPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
    불러오는 중…
  </div>
);

const LegacyPropertyRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  return <Navigate to={`/share/${id ?? ""}${location.search}`} replace />;
};

const BOMNAL_LICENSE_NO = "43112-2024-00034";

const useGlobalProtect = () => {
  useEffect(() => {
    let cancelled = false;
    let exempt = false;

    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const onContext = (e: MouseEvent) => { if (exempt) return; if (!isEditable(e.target)) e.preventDefault(); };
    const onDrag = (e: DragEvent) => { if (exempt) return; e.preventDefault(); };
    const onCopy = (e: ClipboardEvent) => { if (exempt) return; if (!isEditable(e.target)) e.preventDefault(); };

    const applyProtect = (on: boolean) => {
      exempt = !on;
      if (typeof document !== "undefined") {
        document.body.classList.toggle("protect-on", on);
      }
    };

    // 기본은 보호 ON
    applyProtect(true);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("copy", onCopy);

    const checkExempt = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        // 관리자 체크
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) { if (!cancelled) applyProtect(false); return; }
        // 봄날부동산 체크
        const { data: ap } = await supabase
          .from("agent_profiles")
          .select("license_number, status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && ap?.license_number === BOMNAL_LICENSE_NO && ap?.status === "approved") {
          applyProtect(false);
        }
      } catch { /* ignore */ }
    };
    checkExempt();

    // 로그인/로그아웃 시 재평가
    let unsub: (() => void) | undefined;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = supabase.auth.onAuthStateChange(() => {
        applyProtect(true);
        checkExempt();
      });
      unsub = () => data.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("copy", onCopy);
      document.body.classList.remove("protect-on");
      unsub?.();
    };
  }, []);
};

const App = () => {
  useGlobalProtect();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PwaUpdatePrompt />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* 공개 페이지 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/property/:id" element={<LegacyPropertyRedirect />} />
            <Route path="/share/:id" element={<PublicProperty />} />

            {/* 첫 화면은 eager */}
            <Route path="/" element={<Home />} />

            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/apartment" element={<ProtectedRoute><ResidentialRental /></ProtectedRoute>} />
            <Route path="/residential" element={<ProtectedRoute><ResidentialRental /></ProtectedRoute>} />
            <Route path="/land" element={<ProtectedRoute><LandSearch /></ProtectedRoute>} />
            <Route path="/non-residential" element={<ProtectedRoute><NonResidentialRental /></ProtectedRoute>} />
            <Route path="/collective-sale" element={<ProtectedRoute><NonResidentialRental mode="collective-sale" /></ProtectedRoute>} />
            <Route path="/commercial" element={<ProtectedRoute><CommercialRental /></ProtectedRoute>} />
            <Route path="/my-properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
            <Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />

            {/* 관리자 */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
