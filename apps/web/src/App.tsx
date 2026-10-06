import { ThemeProvider } from "@/shared/components/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { EmptyLayout } from "./layouts/EmptyLayout";
import { MainLayout } from "./layouts/MainLayout";
const ForgotPassword = lazy(() => import("./pages").then((m) => ({ default: m.ForgotPassword })));
const VerifyEmail = lazy(() => import("./pages").then((m) => ({ default: m.VerifyEmail })));
const Home = lazy(() => import("./pages").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("./pages").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages").then((m) => ({ default: m.Register })));

const SearchPage = lazy(() =>
  import("./pages/discover/SearchPage").then((m) => ({ default: m.SearchPage })),
);
const SavedPage = lazy(() =>
  import("./pages/discover/SavedPage").then((m) => ({ default: m.SavedPage })),
);
const MyPostsPage = lazy(() =>
  import("./pages/discover/MyPostsPage").then((m) => ({ default: m.MyPostsPage })),
);
const EditProfilePage = lazy(() =>
  import("./pages/discover/EditProfilePage").then((m) => ({ default: m.EditProfilePage })),
);
const PostDetail = lazy(() =>
  import("./pages/post/PostDetail").then((m) => ({ default: m.PostDetail })),
);
const MessagesPage = lazy(() =>
  import("./pages/messages/MessagesPage").then((m) => ({ default: m.MessagesPage })),
);
const ExchangesPage = lazy(() =>
  import("./pages/exchanges2/ExchangesPage").then((m) => ({ default: m.ExchangesPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/me/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const NotificationsPage = lazy(() =>
  import("./pages/me/NotificationsPage").then((m) => ({ default: m.NotificationsPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/me/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const HelpPage = lazy(() =>
  import("./pages/static/StaticPages").then((m) => ({ default: m.HelpPage })),
);
const AboutPage = lazy(() =>
  import("./pages/static/StaticPages").then((m) => ({ default: m.AboutPage })),
);
const ContactPage = lazy(() =>
  import("./pages/static/StaticPages").then((m) => ({ default: m.ContactPage })),
);
const LegalPage = lazy(() =>
  import("./pages/static/StaticPages").then((m) => ({ default: m.LegalPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/static/StaticPages").then((m) => ({ default: m.NotFoundPage })),
);
const AdSettings = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdSettings })),
);
const Onboarding = lazy(() => import("./pages").then((m) => ({ default: m.Onboarding })));
const FeedPage = lazy(() => import("./pages").then((m) => ({ default: m.FeedPage })));
const QuickPost = lazy(() => import("./pages").then((m) => ({ default: m.QuickPost })));
const CourierRequest = lazy(() => import("./pages").then((m) => ({ default: m.CourierRequest })));
const CourierQueue = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.CourierQueue })),
);

import { AuthProvider } from "./providers/AuthProvider";
import { SocketProvider } from "./providers/SocketProvider";
import { AdminRoute } from "./routes/AdminRoute";
import { GuestRoute } from "./routes/GuestRoute";
import { ToPost } from "./routes/Redirects";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const AdminLayout = lazy(() =>
  import("./features/admin/layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboard = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.Dashboard })),
);
const AdminAnalyticsDashboard = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AnalyticsDashboard })),
);
const AdminUserManagement = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.UserManagement })),
);
const AdminProducts = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminProducts })),
);
const AdminNeeds = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminNeeds })),
);
const AdminExchanges = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminExchanges })),
);
const AdminShipping = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminShipping })),
);
const AdminReviews = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminReviews })),
);
const AdminReports = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminReports })),
);
const AdminVerification = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminVerification })),
);
const AdminCategories = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AdminCategories })),
);
const AdminCMSManagement = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.CMSManagement })),
);
const AdminPlatformSettings = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.PlatformSettings })),
);
const AdminFeatureFlags = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.FeatureFlags })),
);
const AdminAuditLogs = lazy(() =>
  import("./features/admin/pages").then((m) => ({ default: m.AuditLogs })),
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="reusedo-theme">
        <HelmetProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="flex h-screen w-screen items-center justify-center">
                    <div className="animate-pulse">Loading...</div>
                  </div>
                }
              >
                <SocketProvider>
                  <Routes>
                    {/* Main App Layout */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/feed" element={<FeedPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/post/:id" element={<PostDetail />} />
                      <Route path="/users/:username" element={<ProfilePage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/terms" element={<LegalPage kind="terms" />} />
                      <Route path="/privacy" element={<LegalPage kind="privacy" />} />

                      {/* Signed-in pages */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/post/new" element={<QuickPost />} />
                        <Route path="/my-posts" element={<MyPostsPage />} />
                        <Route path="/saved" element={<SavedPage />} />
                        <Route path="/courier" element={<CourierRequest />} />
                        <Route path="/exchanges" element={<ExchangesPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/messages/:id" element={<MessagesPage />} />
                        <Route path="/profile" element={<ProfilePage own />} />
                        <Route path="/profile/edit" element={<EditProfilePage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Route>

                      {/* Legacy URLs → new screens (old API-bound pages stay on disk, unrouted) */}
                      <Route path="/explore" element={<Navigate to="/feed" replace />} />
                      <Route
                        path="/products"
                        element={<Navigate to="/feed?kind=offer" replace />}
                      />
                      <Route path="/needs" element={<Navigate to="/feed?kind=need" replace />} />
                      <Route
                        path="/products/create"
                        element={<Navigate to="/post/new" replace />}
                      />
                      <Route path="/needs/create" element={<Navigate to="/post/new" replace />} />
                      <Route path="/products/:id" element={<ToPost />} />
                      <Route path="/needs/:id" element={<ToPost />} />
                      <Route
                        path="/products/:id/edit"
                        element={<Navigate to="/my-posts" replace />}
                      />
                      <Route path="/needs/:id/edit" element={<Navigate to="/my-posts" replace />} />
                      <Route path="/my-products" element={<Navigate to="/my-posts" replace />} />
                      <Route path="/my-needs" element={<Navigate to="/my-posts" replace />} />
                      <Route path="/search/saved" element={<Navigate to="/saved" replace />} />
                      <Route path="/search/products" element={<Navigate to="/search" replace />} />
                      <Route path="/search/needs" element={<Navigate to="/search" replace />} />
                      <Route path="/search/users" element={<Navigate to="/search" replace />} />
                      <Route
                        path="/profile/addresses"
                        element={<Navigate to="/settings" replace />}
                      />
                      <Route
                        path="/profile/verification"
                        element={<Navigate to="/onboarding" replace />}
                      />
                      <Route
                        path="/profile/reputation"
                        element={<Navigate to="/profile" replace />}
                      />
                      <Route path="/shipping" element={<Navigate to="/courier" replace />} />
                      <Route path="/shipping/:id" element={<Navigate to="/courier" replace />} />
                      <Route path="/dashboard/*" element={<Navigate to="/feed" replace />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="analytics" element={<AdminAnalyticsDashboard />} />
                        <Route path="users" element={<AdminUserManagement />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="needs" element={<AdminNeeds />} />
                        <Route path="exchanges" element={<AdminExchanges />} />
                        <Route path="courier" element={<CourierQueue />} />
                        <Route path="ads" element={<AdSettings />} />
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

                    {/* Guest Only Routes */}
                    <Route element={<EmptyLayout />}>
                      <Route element={<GuestRoute />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                      </Route>
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </SocketProvider>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
