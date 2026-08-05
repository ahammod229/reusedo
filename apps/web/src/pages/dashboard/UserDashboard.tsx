import { useUserDashboardSummary } from "../../hooks/useAnalytics";

export const UserDashboard = () => {
  const { data: summary, isLoading, isError } = useUserDashboardSummary();

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load dashboard summary
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Summary</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-500 text-sm font-medium">Active Exchanges</p>
          <p className="text-3xl font-bold mt-2">{summary.active_exchanges}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-500 text-sm font-medium">My Products</p>
          <p className="text-3xl font-bold mt-2">{summary.my_products}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-500 text-sm font-medium">My Need Requests</p>
          <p className="text-3xl font-bold mt-2">{summary.my_needs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-500 text-sm font-medium">Trust Score</p>
          <p className="text-3xl font-bold mt-2">{summary.trust_score}</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Recommended Actions</h2>
        <ul className="space-y-3">
          {summary.unread_notifications > 0 && (
            <li className="flex items-center text-primary">
              <span className="w-2 h-2 bg-primary rounded-full mr-2" />
              You have {summary.unread_notifications} unread notifications.
            </li>
          )}
          {summary.my_products === 0 && (
            <li className="flex items-center text-gray-700">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
              Publish your first product to start exchanging.
            </li>
          )}
          {summary.trust_score < 50 && (
            <li className="flex items-center text-gray-700">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
              Complete your profile verification to boost your trust score.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
