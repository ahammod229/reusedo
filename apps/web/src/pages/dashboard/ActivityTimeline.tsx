export const ActivityTimeline = () => {
  // Mock data for the activity timeline
  const activities = [
    {
      id: 1,
      type: "exchange_completed",
      title: "Exchange Completed",
      description: "You successfully exchanged iPhone 12 with Jane Doe",
      time: "2 hours ago",
      icon: "✅",
      color: "bg-green-100 text-green-600",
    },
    {
      id: 2,
      type: "review_received",
      title: "New Review",
      description: "Jane Doe left a 5-star review",
      time: "5 hours ago",
      icon: "⭐",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      id: 3,
      type: "product_published",
      title: "Product Published",
      description: "Your Mechanical Keyboard is now live",
      time: "1 day ago",
      icon: "📦",
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: 4,
      type: "trust_score_increase",
      title: "Trust Score Increased",
      description: "Your trust score went up by 10 points",
      time: "2 days ago",
      icon: "🛡️",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
      <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-8">
            <div
              className={`absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white ${activity.color}`}
            >
              {activity.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              <p className="text-gray-600 mt-1">{activity.description}</p>
              <span className="text-sm text-gray-400 mt-2 block">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
