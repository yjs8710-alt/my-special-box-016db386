import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import MapSearch from "./pages/MapSearch";
import SignupPage from "./pages/Signup";
import Community from "./pages/Community";
import ApartmentRental from "./pages/ApartmentRental";
import ResidentialRental from "./pages/ResidentialRental";
import LandSearch from "./pages/LandSearch";
import NonResidentialRental from "./pages/NonResidentialRental";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/community" element={<Community />} />
          <Route path="/apartment" element={<ApartmentRental />} />
          <Route path="/residential" element={<ResidentialRental />} />
          <Route path="/land" element={<LandSearch />} />
          <Route path="/non-residential" element={<NonResidentialRental />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
