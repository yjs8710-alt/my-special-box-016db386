import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import { PwaUpdatePrompt } from "./components/PwaUpdatePrompt";

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
const ProtectedAdminRoute = lazy(() => import("./components/ProtectedAdminRoute"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

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

const App = () => (
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

export default App;
