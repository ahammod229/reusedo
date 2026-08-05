import { ThemeProvider } from "@reusedo/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import {
  AdminCategories,
  AdminExchanges,
  AdminNeeds,
  AdminProducts,
  AdminReports,
  AdminReviews,
  AdminShipping,
  AdminVerification,
  AnalyticsDashboard,
  AuditLogs,
  CMSManagement,
  Dashboard,
  FeatureFlags,
  Login,
  NotFound,
  PlatformSettings,
  UserManagement,
} from "./pages";
import { AuthProvider } from "./providers/AuthProvider";
import { GuestRoute } from "./routes/GuestRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="reusedo-admin-theme">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Guest Only Routes */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/products" element={<AdminProducts />} />
                  <Route path="/needs" element={<AdminNeeds />} />
                  <Route path="/exchanges" element={<AdminExchanges />} />
                  <Route path="/shipping" element={<AdminShipping />} />
                  <Route path="/reviews" element={<AdminReviews />} />
                  <Route path="/reports" element={<AdminReports />} />
                  <Route path="/verification" element={<AdminVerification />} />
                  <Route path="/categories" element={<AdminCategories />} />
                  <Route path="/cms" element={<CMSManagement />} />
                  <Route path="/settings" element={<PlatformSettings />} />
                  <Route path="/feature-flags" element={<FeatureFlags />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
