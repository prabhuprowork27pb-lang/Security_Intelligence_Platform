import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import CommandCentreRoute from "@/components/CommandCentreRoute";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import OrganisationForm from "./pages/OrganisationForm";
import OrganisationDetail from "./pages/OrganisationDetail";
import SiteComparison from "./pages/SiteComparison";
import SiteForm from "./pages/SiteForm";
import SiteDetail from "./pages/SiteDetail";
import AssessmentWizard from "./pages/AssessmentWizard";
import AssessmentResults from "./pages/AssessmentResults";
import AssessmentSubmitted from "./pages/AssessmentSubmitted";
import PrintPreview from "./pages/PrintPreview";
import PdfReport from "./pages/PdfReport";
import LeadsManagement from "./pages/LeadsManagement";
import Help from "./pages/Help";
import ReportsList from "./pages/ReportsList";
import ReportStatus from "./pages/ReportStatus";
import NotFound from "./pages/NotFound";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Sample from "./pages/Sample";
import SampleReport from "./pages/SampleReport";
import Trust from "./pages/Trust";
import Unlock from "./pages/Unlock";
import Unsubscribe from "./pages/Unsubscribe";
import DeepDive from "./pages/DeepDive";
import Platform from "./pages/Platform";
import Studio from "./pages/Studio";
import DiagnosticStart from "./pages/DiagnosticStart";
import Welcome from "./pages/Welcome";
import Profile from "./pages/Profile";
import Insights from "./pages/Insights";
import InsightArticle from "./pages/InsightArticle";
import Why from "./pages/Why";
import Founder from "./pages/Founder";
import Community from "./pages/Community";
import Contact from "./pages/Contact";
import GlobalCta from "@/components/GlobalCta";
import SecureFooter from "@/components/SecureFooter";
import RouteAnalytics from "@/components/RouteAnalytics";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteAnalytics />
          <div id="app-shell" className="flex flex-col min-h-dvh">
            <main id="main" className="flex-1">
              <Routes>
                {/* Public */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Landing />} />
                <Route path="/platform" element={<Platform />} />
                <Route path="/deep-dive" element={<DeepDive />} />
                <Route path="/sample" element={<Sample />} />
                <Route path="/sample/:slug" element={<SampleReport />} />
                <Route path="/trust" element={<Trust />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/diagnostic/start" element={<DiagnosticStart />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/insights/:slug" element={<InsightArticle />} />
                <Route path="/why" element={<Why />} />
                <Route path="/founder" element={<Founder />} />
                <Route path="/community" element={<Community />} />
                <Route path="/contact" element={<Contact />} />

                {/* Authenticated */}
                <Route path="/unlock" element={<ProtectedRoute><Unlock /></ProtectedRoute>} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/dashboard" element={<CommandCentreRoute><Dashboard /></CommandCentreRoute>} />
                <Route path="/organisations/new" element={<ProtectedRoute><OrganisationForm /></ProtectedRoute>} />
                <Route path="/organisations/:id" element={<ProtectedRoute><OrganisationDetail /></ProtectedRoute>} />
                <Route path="/organisations/:id/compare" element={<ProtectedRoute><SiteComparison /></ProtectedRoute>} />
                <Route path="/organisations/:orgId/sites/new" element={<ProtectedRoute><SiteForm /></ProtectedRoute>} />
                <Route path="/sites/:id" element={<ProtectedRoute><SiteDetail /></ProtectedRoute>} />
                <Route path="/sites/:siteId/assessment/new" element={<ProtectedRoute><AssessmentWizard /></ProtectedRoute>} />
                <Route path="/assessments/:id/edit" element={<ProtectedRoute><AssessmentWizard /></ProtectedRoute>} />
                <Route path="/assessments/:id/submitted" element={<ProtectedRoute><AssessmentSubmitted /></ProtectedRoute>} />
                <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentResults /></ProtectedRoute>} />
                <Route path="/print-preview" element={<ProtectedRoute><PrintPreview /></ProtectedRoute>} />
                <Route path="/pdf-report" element={<ProtectedRoute><PdfReport /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsList /></ProtectedRoute>} />
                <Route path="/reports/:id/status" element={<ProtectedRoute><ReportStatus /></ProtectedRoute>} />

                {/* Admin only */}
                <Route path="/admin" element={<AdminRoute><Navigate to="/dashboard?tab=admin" replace /></AdminRoute>} />
                <Route path="/leads" element={<AdminRoute><LeadsManagement /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <SecureFooter />
            <GlobalCta />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
