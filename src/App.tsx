
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/user/Dashboard";
import AddCoins from "./pages/user/AddCoins";
import BrowseServices from "./pages/user/BrowseServices";
import UserTransactions from "./pages/user/Transactions";
import OrgDashboard from "./pages/org/Dashboard";
import OrgServices from "./pages/org/Services";
import OrgConvert from "./pages/org/Convert";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminServices from "./pages/admin/Services";
import AdminConversions from "./pages/admin/Conversions";
import LivingSpaces from "./pages/services/LivingSpaces";
import SustainableTrips from "./pages/services/SustainableTrips";
import OrganicProducts from "./pages/services/OrganicProducts";
import TechServices from "./pages/services/TechServices";
import StartupEvents from "./pages/services/StartupEvents";
import EventPasses from "./pages/services/EventPasses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Service Detail Pages */}
          <Route path="/services/living-spaces" element={<LivingSpaces />} />
          <Route path="/services/sustainable-trips" element={<SustainableTrips />} />
          <Route path="/services/organic-products" element={<OrganicProducts />} />
          <Route path="/services/tech-services" element={<TechServices />} />
          <Route path="/services/startup-events" element={<StartupEvents />} />
          <Route path="/services/event-passes" element={<EventPasses />} />
          
          {/* User Routes */}
          <Route path="/dashboard/user" element={<UserDashboard />} />
          <Route path="/wallet/add" element={<AddCoins />} />
          <Route path="/services" element={<BrowseServices />} />
          <Route path="/transactions" element={<UserTransactions />} />
          
          {/* Organization Routes */}
          <Route path="/dashboard/org" element={<OrgDashboard />} />
          <Route path="/org/services" element={<OrgServices />} />
          <Route path="/org/convert" element={<OrgConvert />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/conversions" element={<AdminConversions />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
