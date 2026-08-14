import type React from "react";

export const AdminReports: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Moderation Queue (Reports)</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500">
        <p>This module will be fully implemented in M12.</p>
        <p className="mt-2 text-sm">
          Here admins will be able to view reports, investigate items, and resolve issues.
        </p>
      </div>
    </div>
  );
};
