import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import AuthProvider
import { AuthProvider } from "./contexts/AuthContext";

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
import Payment from "./pages/Payment";
import Feedback from "./pages/Feedback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "@/components/ProtectedRoute";
import RedirectIfLoggedIn from "@/components/RedirectIfLoggedIn";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route
              path="/login"
              element={
                <RedirectIfLoggedIn>
                  <Login />
                </RedirectIfLoggedIn>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfLoggedIn>
                  <Signup />
                </RedirectIfLoggedIn>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <RedirectIfLoggedIn>
                  <ForgotPassword />
                </RedirectIfLoggedIn>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/payment" element={<Payment />} />
            <Route path="/feedback" element={<Feedback />} />

            {/* Service Detail Pages */}
            <Route path="/services/living-spaces" element={<LivingSpaces />} />
            <Route path="/services/sustainable-trips" element={<SustainableTrips />} />
            <Route path="/services/organic-products" element={<OrganicProducts />} />
            <Route path="/services/tech-services" element={<TechServices />} />
            <Route path="/services/startup-events" element={<StartupEvents />} />
            <Route path="/services/event-passes" element={<EventPasses />} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard/user"
              element={
                <ProtectedRoute allowedRoles="user">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/add"
              element={
                <ProtectedRoute allowedRoles="user">
                  <AddCoins />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute allowedRoles="user">
                  <BrowseServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute allowedRoles="user">
                  <UserTransactions />
                </ProtectedRoute>
              }
            />

            {/* Protected Org Routes */}
            <Route
              path="/dashboard/org"
              element={
                <ProtectedRoute allowedRoles="org">
                  <OrgDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/services"
              element={
                <ProtectedRoute allowedRoles="org">
                  <OrgServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org/convert"
              element={
                <ProtectedRoute allowedRoles="org">
                  <OrgConvert />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute allowedRoles="admin">
                  <AdminServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/conversions"
              element={
                <ProtectedRoute allowedRoles="admin">
                  <AdminConversions />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;