import type React from "react";
import { useState } from "react";
import { useSubmitReport } from "../hooks/useTrust";

interface ReportModalProps {
  entityType: "product" | "need" | "user" | "review" | "message";
  entityId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  entityType,
  entityId,
  isOpen,
  onClose,
}) => {
  const { mutate: submitReport, isPending } = useSubmitReport();

  const [reason, setReason] = useState<
    "spam" | "fraud" | "abuse" | "fake_item" | "inappropriate" | "other"
  >("spam");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(
      {
        entityType,
        entityId,
        reason,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            onClose();
            setSuccess(false);
            setDescription("");
          }, 2000);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Success Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Report Submitted</h3>
            <p className="text-slate-500">
              Thank you. Our moderation team will review this shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Report {entityType}</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Close Modal</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="report-reason"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value as
                        | "spam"
                        | "fraud"
                        | "abuse"
                        | "fake_item"
                        | "inappropriate"
                        | "other",
                    )
                  }
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                >
                  <option value="spam">Spam</option>
                  <option value="fraud">Fraud or Scam</option>
                  <option value="abuse">Abusive Content</option>
                  <option value="fake_item">Fake Item</option>
                  <option value="inappropriate">Inappropriate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="report-description"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Additional Details (Optional)
                </label>
                <textarea
                  id="report-description"
                  rows={4}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  placeholder="Please provide any extra context that might help us investigate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-md hover:bg-rose-700 disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
