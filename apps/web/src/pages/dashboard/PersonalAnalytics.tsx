import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePersonalAnalytics } from "../../hooks/useAnalytics";

export const PersonalAnalytics = () => {
  const { data: analytics, isLoading, isError } = usePersonalAnalytics();

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return <div className="p-6 text-red-500 text-center">Failed to load personal analytics</div>;
  }

  // Mock data for charts, as backend only returns current aggregate totals for now
  const activityData = [
    { name: "Mon", exchanges: 1, needs: 2 },
    { name: "Tue", exchanges: 2, needs: 1 },
    { name: "Wed", exchanges: 0, needs: 0 },
    { name: "Thu", exchanges: 3, needs: 2 },
    { name: "Fri", exchanges: 1, needs: 0 },
    { name: "Sat", exchanges: 4, needs: 3 },
    { name: "Sun", exchanges: 2, needs: 1 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Personal Analytics</h1>
        <p className="text-gray-500">Track your performance and engagement on Reusedo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Products Published" value={analytics.products_published} />
        <StatCard title="Total Exchanges" value={analytics.total_exchanges} />
        <StatCard title="Need Requests" value={analytics.need_requests_created} />
        <StatCard title="Profile Views" value={analytics.profile_views} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Weekly Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="exchanges" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Exchanges" />
                <Bar dataKey="needs" fill="#10b981" radius={[4, 4, 0, 0]} name="Needs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Exchange Success Rate</h2>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <title>Analytics progress</title>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeDasharray={`${analytics.exchange_success_rate * 2.83} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{analytics.exchange_success_rate}%</span>
              </div>
            </div>
            <p className="mt-4 text-gray-500">
              Avg. Response Time: {analytics.average_response_time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);
