import { ThemeProvider } from "@/shared/components/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router";
import { EmptyLayout } from "./layouts/EmptyLayout";
import { MainLayout } from "./layouts/MainLayout";
const AddressBook = lazy(() => import("./pages").then((m) => ({ default: m.AddressBook })));
const EditProfile = lazy(() => import("./pages").then((m) => ({ default: m.EditProfile })));
const Explore = lazy(() => import("./pages").then((m) => ({ default: m.Explore })));
const ForgotPassword = lazy(() => import("./pages").then((m) => ({ default: m.ForgotPassword })));
const VerifyEmail = lazy(() => import("./pages").then((m) => ({ default: m.VerifyEmail })));
const Home = lazy(() => import("./pages").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("./pages").then((m) => ({ default: m.Login })));
const MyNeeds = lazy(() => import("./pages").then((m) => ({ default: m.MyNeeds })));
const MyProducts = lazy(() => import("./pages").then((m) => ({ default: m.MyProducts })));
const NeedDetails = lazy(() => import("./pages").then((m) => ({ default: m.NeedDetails })));
const NeedForm = lazy(() => import("./pages").then((m) => ({ default: m.NeedForm })));
const NeedList = lazy(() => import("./pages").then((m) => ({ default: m.NeedList })));
const ProductDetails = lazy(() => import("./pages").then((m) => ({ default: m.ProductDetails })));
const ProductForm = lazy(() => import("./pages").then((m) => ({ default: m.ProductForm })));
const ProductList = lazy(() => import("./pages").then((m) => ({ default: m.ProductList })));
const Register = lazy(() => import("./pages").then((m) => ({ default: m.Register })));
const ReputationDashboard = lazy(() =>
  import("./pages").then((m) => ({ default: m.ReputationDashboard })),
);
const VerificationForm = lazy(() =>
  import("./pages").then((m) => ({ default: m.VerificationForm })),
);
const UserDashboard = lazy(() => import("./pages").then((m) => ({ default: m.UserDashboard })));
const PersonalAnalytics = lazy(() =>
  import("./pages").then((m) => ({ default: m.PersonalAnalytics })),
);
const ActivityTimeline = lazy(() =>
  import("./pages").then((m) => ({ default: m.ActivityTimeline })),
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

const SearchIndex = lazy(() =>
  import("./pages/search/SearchIndex").then((m) => ({ default: m.SearchIndex })),
);
const SearchProducts = lazy(() =>
  import("./pages/search/SearchProducts").then((m) => ({ default: m.SearchProducts })),
);
const SearchNeeds = lazy(() =>
  import("./pages/search/SearchNeeds").then((m) => ({ default: m.SearchNeeds })),
);
const SearchUsers = lazy(() =>
  import("./pages/search/SearchUsers").then((m) => ({ default: m.SearchUsers })),
);
const SavedSearches = lazy(() =>
  import("./pages/search/SavedSearches").then((m) => ({ default: m.SavedSearches })),
);
import { ShipmentDetails } from "./pages/shipping/ShipmentDetails";
import { ShippingDashboard } from "./pages/shipping/ShippingDashboard";
import { AuthProvider } from "./providers/AuthProvider";
import { SocketProvider } from "./providers/SocketProvider";
import { AdminRoute } from "./routes/AdminRoute";
import { GuestRoute } from "./routes/GuestRoute";
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
                      <Route path="/explore" element={<Explore />} />
                      <Route path="/feed" element={<FeedPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/terms" element={<LegalPage kind="terms" />} />
                      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
                      <Route path="/post/:id" element={<PostDetail />} />

                      {/* Search Routes */}
                      <Route path="/search" element={<SearchIndex />} />
                      <Route path="/search/products" element={<SearchProducts />} />
                      <Route path="/search/needs" element={<SearchNeeds />} />
                      <Route path="/search/users" element={<SearchUsers />} />

                      {/* Public Profile */}
                      <Route path="/users/:username" element={<ProfilePage />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/post/new" element={<QuickPost />} />
                        <Route path="/courier" element={<CourierRequest />} />
                        <Route path="/products" element={<ProductList />} />
                        <Route path="/products/create" element={<ProductForm />} />
                        <Route path="/products/:id" element={<ProductDetails />} />
                        <Route path="/products/:id/edit" element={<ProductForm />} />
                        <Route path="/my-products" element={<MyProducts />} />
                        <Route path="/needs" element={<NeedList />} />
                        <Route path="/needs/create" element={<NeedForm />} />
                        <Route path="/needs/:id" element={<NeedDetails />} />
                        <Route path="/needs/:id/edit" element={<NeedForm />} />
                        <Route path="/my-needs" element={<MyNeeds />} />

                        {/* Exchange Routes */}
                        <Route path="exchanges" element={<ExchangesPage />} />

                        {/* Chat Routes */}
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="messages/:id" element={<MessagesPage />} />

                        {/* Profile & Account */}
                        <Route path="/profile" element={<ProfilePage own />} />
                        <Route path="/profile/edit" element={<EditProfile />} />
                        <Route path="/profile/addresses" element={<AddressBook />} />
                        <Route path="/profile/reputation" element={<ReputationDashboard />} />
                        <Route path="/profile/verification" element={<VerificationForm />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/search/saved" element={<SavedSearches />} />
                        <Route path="/shipping" element={<ShippingDashboard />} />
                        <Route path="/shipping/:id" element={<ShipmentDetails />} />

                        {/* Settings */}
                        <Route path="/settings" element={<SettingsPage />} />

                        {/* Dashboard Routes */}
                        <Route path="/dashboard" element={<UserDashboard />} />
                        <Route path="/dashboard/analytics" element={<PersonalAnalytics />} />
                        <Route path="/dashboard/activity" element={<ActivityTimeline />} />
                      </Route>
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
