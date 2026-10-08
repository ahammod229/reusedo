import { ThemeProvider } from "@/shared/components/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { EmptyLayout } from "./layouts/EmptyLayout";
import { MainLayout } from "./layouts/MainLayout";
import { SettingsLayout } from "./layouts/SettingsLayout";
const About = lazy(() => import("./pages").then((m) => ({ default: m.About })));
const AddressBook = lazy(() => import("./pages").then((m) => ({ default: m.AddressBook })));
const Contact = lazy(() => import("./pages").then((m) => ({ default: m.Contact })));
const EditProfile = lazy(() => import("./pages").then((m) => ({ default: m.EditProfile })));
const Explore = lazy(() => import("./pages").then((m) => ({ default: m.Explore })));
const ForgotPassword = lazy(() => import("./pages").then((m) => ({ default: m.ForgotPassword })));
const GeneralSettings = lazy(() => import("./pages").then((m) => ({ default: m.GeneralSettings })));
const Help = lazy(() => import("./pages").then((m) => ({ default: m.Help })));
const Home = lazy(() => import("./pages").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("./pages").then((m) => ({ default: m.Login })));
const MyNeeds = lazy(() => import("./pages").then((m) => ({ default: m.MyNeeds })));
const MyProducts = lazy(() => import("./pages").then((m) => ({ default: m.MyProducts })));
const MyProfile = lazy(() => import("./pages").then((m) => ({ default: m.MyProfile })));
const NeedDetails = lazy(() => import("./pages").then((m) => ({ default: m.NeedDetails })));
const NeedForm = lazy(() => import("./pages").then((m) => ({ default: m.NeedForm })));
const NeedList = lazy(() => import("./pages").then((m) => ({ default: m.NeedList })));
const NotFound = lazy(() => import("./pages").then((m) => ({ default: m.NotFound })));
const NotificationCenter = lazy(() =>
  import("./pages").then((m) => ({ default: m.NotificationCenter })),
);
const NotificationSettings = lazy(() =>
  import("./pages").then((m) => ({ default: m.NotificationSettings })),
);
const PrivacySettings = lazy(() => import("./pages").then((m) => ({ default: m.PrivacySettings })));
const ProductDetails = lazy(() => import("./pages").then((m) => ({ default: m.ProductDetails })));
const ProductForm = lazy(() => import("./pages").then((m) => ({ default: m.ProductForm })));
const ProductList = lazy(() => import("./pages").then((m) => ({ default: m.ProductList })));
const PublicProfile = lazy(() => import("./pages").then((m) => ({ default: m.PublicProfile })));
const Register = lazy(() => import("./pages").then((m) => ({ default: m.Register })));
const ReputationDashboard = lazy(() =>
  import("./pages").then((m) => ({ default: m.ReputationDashboard })),
);
const SecuritySettings = lazy(() =>
  import("./pages").then((m) => ({ default: m.SecuritySettings })),
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

const ChatLayout = lazy(() =>
  import("./pages/chat/ChatLayout").then((m) => ({ default: m.ChatLayout })),
);
const ConversationDetails = lazy(() =>
  import("./pages/chat/ConversationDetails").then((m) => ({ default: m.ConversationDetails })),
);
const ExchangeList = lazy(() =>
  import("./pages/exchanges/ExchangeList").then((m) => ({ default: m.ExchangeList })),
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
                      <Route path="/help" element={<Help />} />

                      {/* Search Routes */}
                      <Route path="/search" element={<SearchIndex />} />
                      <Route path="/search/products" element={<SearchProducts />} />
                      <Route path="/search/needs" element={<SearchNeeds />} />
                      <Route path="/search/users" element={<SearchUsers />} />

                      {/* Public Profile */}
                      <Route path="/users/:username" element={<PublicProfile />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
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
                        <Route path="exchanges">
                          <Route index element={<ExchangeList />} />
                        </Route>

                        {/* Chat Routes */}
                        <Route path="messages" element={<ChatLayout />}>
                          <Route
                            index
                            element={
                              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    role="img"
                                    aria-label="Messages Icon"
                                  >
                                    <title>Messages</title>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-1">
                                  Your Messages
                                </h3>
                                <p>Select a conversation from the sidebar to start chatting</p>
                              </div>
                            }
                          />
                          <Route path=":id" element={<ConversationDetails />} />
                        </Route>

                        {/* Profile & Account */}
                        <Route path="/profile" element={<MyProfile />} />
                        <Route path="/profile/edit" element={<EditProfile />} />
                        <Route path="/profile/addresses" element={<AddressBook />} />
                        <Route path="/profile/reputation" element={<ReputationDashboard />} />
                        <Route path="/profile/verification" element={<VerificationForm />} />
                        <Route path="/notifications" element={<NotificationCenter />} />
                        <Route path="/search/saved" element={<SavedSearches />} />
                        <Route path="/shipping" element={<ShippingDashboard />} />
                        <Route path="/shipping/:id" element={<ShipmentDetails />} />

                        {/* Settings Layout */}
                        <Route path="settings" element={<SettingsLayout />}>
                          <Route index element={<Navigate to="/settings/general" replace />} />
                          <Route path="general" element={<GeneralSettings />} />
                          <Route path="privacy" element={<PrivacySettings />} />
                          <Route path="security" element={<SecuritySettings />} />
                          <Route path="notifications" element={<NotificationSettings />} />
                        </Route>

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
                      </Route>
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="*" element={<NotFound />} />
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
