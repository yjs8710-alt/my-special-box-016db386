import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import SignupPage from "./pages/Signup";
import Community from "./pages/Community";
import ApartmentRental from "./pages/ApartmentRental";
import ResidentialRental from "./pages/ResidentialRental";
import LandSearch from "./pages/LandSearch";
import NonResidentialRental from "./pages/NonResidentialRental";
import CommercialRental from "./pages/CommercialRental";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 인증 필요 페이지 */}
          <Route path="/" element={<Home />} />
          
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/apartment" element={<ProtectedRoute><ApartmentRental /></ProtectedRoute>} />
          <Route path="/residential" element={<ProtectedRoute><ResidentialRental /></ProtectedRoute>} />
          <Route path="/land" element={<ProtectedRoute><LandSearch /></ProtectedRoute>} />
          <Route path="/non-residential" element={<ProtectedRoute><NonResidentialRental /></ProtectedRoute>} />
          <Route path="/commercial" element={<ProtectedRoute><CommercialRental /></ProtectedRoute>} />

          {/* 관리자 */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
