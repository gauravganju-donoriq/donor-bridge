import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import PreScreenForm from "./pages/PreScreenForm";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";
import StatusLookup from "./pages/StatusLookup";
import Questionnaire from "./pages/Questionnaire";
import ConsentForm from "./pages/ConsentForm";

// Admin imports
import Login from "./pages/admin/Login";
import ResetPassword from "./pages/admin/ResetPassword";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import Donors from "./pages/admin/Donors";
import DonorDetail from "./pages/admin/DonorDetail";
import DonorApproval from "./pages/admin/DonorApproval";
import Appointments from "./pages/admin/Appointments";
import FollowUps from "./pages/admin/FollowUps";
import Reports from "./pages/admin/Reports";
import Users from "./pages/admin/Users";
import Logs from "./pages/admin/Logs";
import ScreeningRules from "./pages/admin/ScreeningRules";
import VoiceAISettings from "./pages/admin/VoiceAISettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/apply" element={<PreScreenForm />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/status" element={<StatusLookup />} />
            <Route path="/questionnaire/:token" element={<Questionnaire />} />
            <Route path="/consent/:token" element={<ConsentForm />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="donors" element={<Donors />} />
              <Route path="donors/:id" element={<DonorDetail />} />
              <Route path="donor-approval" element={<DonorApproval />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="reports" element={<Reports />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requireAdmin>
                    <Users />
                  </ProtectedRoute>
                }
                />
              <Route path="logs" element={<Logs />} />
              <Route path="screening-rules" element={<ScreeningRules />} />
              <Route path="voice-ai-settings" element={<VoiceAISettings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
