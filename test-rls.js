require('dotenv').config({ path: 'apps/api/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  console.log('Select:', { data, error });
}

test();
