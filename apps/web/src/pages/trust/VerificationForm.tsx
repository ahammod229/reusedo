import type React from "react";
import { useState } from "react";
import { useSubmitVerification, useVerificationStatus } from "../../hooks/useTrust";

export const VerificationForm: React.FC = () => {
  const { data: verification, isLoading } = useVerificationStatus();
  const { mutate: submitVerification, isPending } = useSubmitVerification();

  const [documentType, setDocumentType] = useState<"national_id" | "passport" | "driving_license">(
    "national_id",
  );
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");

  if (isLoading) return <div className="p-8 text-center">Loading verification status...</div>;

  if (verification) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-8">
        <h2 className="text-2xl font-semibold mb-6">Identity Verification</h2>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-6">
          <p className="text-sm text-slate-500 mb-1">Current Status</p>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                verification.status === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : verification.status === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {verification.status}
            </span>
          </div>
          {verification.admin_notes && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-800 text-sm rounded-md border border-rose-100">
              <strong>Admin Note:</strong> {verification.admin_notes}
            </div>
          )}
        </div>

        {verification.status !== "rejected" && (
          <p className="text-slate-600">
            Your documents have been submitted and are currently in the{" "}
            <strong>{verification.status}</strong> state. You cannot update them right now.
          </p>
        )}

        {verification.status === "rejected" && (
          <p className="text-slate-600 mb-6">
            Your previous submission was rejected. You can submit new documents below.
          </p>
        )}
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVerification({
      documentType,
      documentFrontUrl: frontUrl,
      documentBackUrl: backUrl || undefined,
    });
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-8">
      <h2 className="text-2xl font-semibold mb-2">Verify Your Identity</h2>
      <p className="text-slate-500 mb-6">
        Submit your government-issued ID to get a verified badge and increase your trust score.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="document-type" className="block text-sm font-medium text-slate-700 mb-1">
            Document Type
          </label>
          <select
            id="document-type"
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as "national_id" | "passport" | "driving_license")
            }
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
          </select>
        </div>

        <div>
          <label htmlFor="front-image" className="block text-sm font-medium text-slate-700 mb-1">
            Front Image URL
          </label>
          <input
            id="front-image"
            type="url"
            required
            placeholder="https://storage.../front.jpg"
            value={frontUrl}
            onChange={(e) => setFrontUrl(e.target.value)}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Provide a clear image of the front of your document.
          </p>
        </div>

        <div>
          <label htmlFor="back-image" className="block text-sm font-medium text-slate-700 mb-1">
            Back Image URL (Optional)
          </label>
          <input
            id="back-image"
            type="url"
            placeholder="https://storage.../back.jpg"
            value={backUrl}
            onChange={(e) => setBackUrl(e.target.value)}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Required for National ID and Driving License.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit for Verification"}
        </button>
      </form>
    </div>
  );
};
