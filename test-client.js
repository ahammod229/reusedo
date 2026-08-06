const fs = require('fs');
const content = fs.readFileSync('packages/database/src/client.ts', 'utf8');
console.log(content.includes('process.env.SUPABASE_SERVICE_ROLE_KEY'));
