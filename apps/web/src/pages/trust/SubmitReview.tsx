import { Star } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useCreateReview } from "../../hooks/useTrust";

interface SubmitReviewProps {
  exchangeId: string;
  revieweeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const POSITIVE_TAGS = ["Great Communication", "Item As Described", "On Time", "Friendly"];
const NEGATIVE_TAGS = ["Poor Communication", "Item Not As Described", "Late", "Rude"];

export const SubmitReview: React.FC<SubmitReviewProps> = ({
  exchangeId,
  revieweeId,
  onSuccess,
  onCancel,
}) => {
  const { mutate: createReview, isPending } = useCreateReview();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const isPositive = rating >= 3;
    const availableTags = isPositive ? POSITIVE_TAGS : NEGATIVE_TAGS;

    // Filter tags to ensure they match the sentiment of the rating just in case
    const validTags = selectedTags.filter((tag) => availableTags.includes(tag));

    createReview(
      {
        revieweeId,
        data: {
          exchangeId,
          rating,
          comment,
          positiveTags: isPositive ? validTags : [],
          negativeTags: !isPositive ? validTags : [],
        },
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      },
    );
  };

  const tagsToShow = rating >= 3 ? POSITIVE_TAGS : rating > 0 ? NEGATIVE_TAGS : [];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md w-full">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Leave a Review</h3>
      <p className="text-sm text-slate-500 mb-5">Share your experience with this exchange.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center justify-center py-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={32}
                  className={`${
                    (hoverRating || rating) >= star
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300 fill-transparent"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 h-4">
            {rating === 1 && "Terrible"}
            {rating === 2 && "Poor"}
            {rating === 3 && "Okay"}
            {rating === 4 && "Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        {rating > 0 && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <label
              htmlFor="tags-container"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              What stood out?
            </label>
            <div id="tags-container" className="flex flex-wrap gap-2 mb-4">
              {tagsToShow.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? rating >= 3
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <label
              htmlFor="comments-textarea"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Additional Comments (Optional)
            </label>
            <textarea
              id="comments-textarea"
              rows={3}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={rating === 0 || isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
};
