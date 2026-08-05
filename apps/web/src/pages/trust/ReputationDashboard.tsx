import { useAuthStore } from "@reusedo/auth";
import { MessageSquare, Star } from "lucide-react";
import type React from "react";
import { TrustBadge } from "../../components/TrustBadge";
import { useReviews } from "../../hooks/useTrust";

export const ReputationDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: reviews, isLoading } = useReviews(user?.uid);

  if (!user) return <div className="p-8">Please log in to view reputation.</div>;
  if (isLoading) return <div className="p-8 text-center">Loading reputation...</div>;

  // Assuming `user` in authStore has the updated profile fields like trust_score if we fetched the full profile
  // For the sake of this dashboard, we can calculate stats from the reviews or fetch the profile.
  // Here we will calculate average locally for display if the profile isn't fully synced,
  // but ideally it comes from the profile endpoint.
  const totalReviews = reviews?.length || 0;
  const averageRating =
    totalReviews > 0 ? (reviews?.reduce((acc, r) => acc + r.rating, 0) || 0) / totalReviews : 0;

  // Mocking trust score here if not in user object. In a real app, useProfile(user.uid) would supply this.
  const trustScore = 100; // Placeholder
  const isVerified = true; // Placeholder

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Reputation</h1>
          <p className="text-slate-500">
            View your trust score, verification status, and recent reviews.
          </p>
        </div>
        <div className="text-right">
          <TrustBadge isVerified={isVerified} trustScore={trustScore} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-full mb-3 text-emerald-600">
            <Star size={24} className="fill-current" />
          </div>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
            Average Rating
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {averageRating.toFixed(1)}{" "}
            <span className="text-lg font-normal text-slate-400">/ 5.0</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3 text-blue-600">
            <MessageSquare size={24} />
          </div>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
            Total Reviews
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-full mb-3 text-purple-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Trust Score Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Trust Score</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{trustScore}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Reviews</h2>

      {totalReviews === 0 ? (
        <div className="bg-slate-50 p-8 rounded-xl text-center text-slate-500 border border-slate-200 border-dashed">
          You haven't received any reviews yet. Complete an exchange to get your first review!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews?.map((review) => (
            <div
              key={review.id}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-sm font-medium text-slate-600">U</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      User {review.reviewer_id.substring(0, 6)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-amber-800">{review.rating}.0</span>
                </div>
              </div>

              {review.comment && <p className="text-slate-700 italic">"{review.comment}"</p>}

              {review.positive_tags && review.positive_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {review.positive_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
