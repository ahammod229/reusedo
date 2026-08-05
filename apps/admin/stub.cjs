const fs = require('fs');
const path = require('path');

const pages = [
  "dashboard/Dashboard.tsx",
  "dashboard/AnalyticsDashboard.tsx",
  "users/UserManagement.tsx",
  "moderation/AdminProducts.tsx",
  "moderation/AdminNeeds.tsx",
  "moderation/AdminExchanges.tsx",
  "moderation/AdminShipping.tsx",
  "cms/AdminCategories.tsx",
  "cms/CMSManagement.tsx",
  "settings/PlatformSettings.tsx",
  "settings/FeatureFlags.tsx",
  "audit/AuditLogs.tsx"
];

pages.forEach(p => {
  const fullPath = path.join("/Users/ahammodali/Library/CloudStorage/GoogleDrive-noklity.ahammod@gmail.com/My Drive/PROJECTS/REUSEDO/apps/admin/src/pages", p);
  const compName = path.basename(p, '.tsx');
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, `export const ${compName} = () => <div>${compName} Component</div>;\n`);
  }
});
