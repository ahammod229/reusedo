import os

filepath = 'apps/web/src/App.tsx'

with open(filepath, 'r') as f:
    content = f.read()

imports = """
const AdminLayout = lazy(() => import("./features/admin/layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.Dashboard })));
const AdminAnalyticsDashboard = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AnalyticsDashboard })));
const AdminUserManagement = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.UserManagement })));
const AdminProducts = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminProducts })));
const AdminNeeds = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminNeeds })));
const AdminExchanges = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminExchanges })));
const AdminShipping = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminShipping })));
const AdminReviews = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminReviews })));
const AdminReports = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminReports })));
const AdminVerification = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminVerification })));
const AdminCategories = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AdminCategories })));
const AdminCMSManagement = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.CMSManagement })));
const AdminPlatformSettings = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.PlatformSettings })));
const AdminFeatureFlags = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.FeatureFlags })));
const AdminAuditLogs = lazy(() => import("./features/admin/pages").then((m) => ({ default: m.AuditLogs })));
"""

routes = """
                    {/* Admin Routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="analytics" element={<AdminAnalyticsDashboard />} />
                        <Route path="users" element={<AdminUserManagement />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="needs" element={<AdminNeeds />} />
                        <Route path="exchanges" element={<AdminExchanges />} />
                        <Route path="shipping" element={<AdminShipping />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="verification" element={<AdminVerification />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="cms" element={<AdminCMSManagement />} />
                        <Route path="settings" element={<AdminPlatformSettings />} />
                        <Route path="features" element={<AdminFeatureFlags />} />
                        <Route path="audit" element={<AdminAuditLogs />} />
                      </Route>
                    </Route>

"""

content = content.replace(
    'import { GuestRoute } from "./routes/GuestRoute";',
    'import { GuestRoute } from "./routes/GuestRoute";\nimport { AdminRoute } from "./routes/AdminRoute";'
)

content = content.replace(
    'const queryClient = new QueryClient();',
    imports + '\nconst queryClient = new QueryClient();'
)

content = content.replace(
    '{/* Guest Only Routes */}',
    routes + '                    {/* Guest Only Routes */}'
)

with open(filepath, 'w') as f:
    f.write(content)
