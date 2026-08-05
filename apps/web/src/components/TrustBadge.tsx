import { ShieldAlert, ShieldCheck, Star } from "lucide-react";
import type React from "react";

interface TrustBadgeProps {
  isVerified: boolean;
  trustScore?: number;
  averageRating?: number;
  totalReviews?: number;
  showDetails?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  isVerified,
  trustScore = 0,
  averageRating = 0,
  totalReviews = 0,
  showDetails = false,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {isVerified ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={14} />
            Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
            <ShieldAlert size={14} />
            Unverified
          </span>
        )}

        {trustScore > 0 && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full border ${
              trustScore >= 80
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : trustScore >= 50
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-rose-700 bg-rose-50 border-rose-200"
            }`}
          >
            Trust Score: {trustScore}
          </span>
        )}
      </div>

      {showDetails && totalReviews > 0 && (
        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span className="font-medium text-slate-900">{averageRating.toFixed(1)}</span>
          <span>({totalReviews} reviews)</span>
        </div>
      )}
    </div>
  );
};
