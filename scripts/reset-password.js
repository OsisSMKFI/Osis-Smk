/**
 * Reset Password Script
 * Usage:
 *   npm run reset:pw <email> "NewPassword123!"
 *
 * This will hash the new password and update the user's password_hash.
 */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('\n❌ Usage: npm run reset:pw <email> "NewPassword123!"\n');
    process.exit(1);
  }

  // Check user exists
  const { data: user, error: findErr } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', email)
    .single();

  if (findErr || !user) {
    console.error('❌ User not found for email:', email);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);

  const { error: updErr } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('id', user.id);

  if (updErr) {
    console.error('❌ Failed to update password:', updErr.message);
    process.exit(1);
  }

  console.log('✅ Password reset successfully for:', user.email);
  console.log('👉 You can now login with the new password.');
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
