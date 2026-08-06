import { Card, CardContent, CardHeader, CardTitle } from "@reusedo/ui";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Box, Flag, ShoppingCart, Users } from "lucide-react";
import { Link } from "react-router";

import { AnalyticsService } from "@reusedo/api-client";

export const Dashboard = () => {
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin_dashboard_metrics"],
    queryFn: () => AnalyticsService.getAdminKpiSummary(),
  });

  if (isLoading) return <div className="p-8">Loading dashboard metrics...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading metrics</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
            <p className="text-xs text-slate-500">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Products</CardTitle>
            <Box className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_products || 0}</div>
            <p className="text-xs text-slate-500">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Exchanges</CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_exchanges || 0}</div>
            <p className="text-xs text-slate-500">+2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">All caught up</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-md text-slate-500">
              <Box className="h-8 w-8 mb-2 text-slate-300" />
              <p>Activity chart will be available soon.</p>
              <p className="text-sm text-slate-400">Collect more data to generate insights.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Review Reported Users</p>
                  <p className="text-sm text-slate-500">5 pending reviews</p>
                </div>
                <Link to="/reports" className="text-emerald-600 hover:text-emerald-700">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Approve Verification Requests</p>
                  <p className="text-sm text-slate-500">12 pending verifications</p>
                </div>
                <Link to="/verification" className="text-emerald-600 hover:text-emerald-700">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
