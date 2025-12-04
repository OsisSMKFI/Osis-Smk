/**
 * Check User Status Script
 * Checks if a user exists in database and their verification/approval status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserStatus(email) {
  console.log(`\n🔍 Checking status for: ${email}\n`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, email_verified, approved, created_at, password_hash')
    .ilike('email', email)
    .single();

  if (error || !user) {
    console.log('❌ USER NOT FOUND');
    console.log('📝 Possible reasons:');
    console.log('   - Email not registered yet (please register first)');
    console.log('   - Typo in email address');
    console.log('   - User was deleted from database');
    console.log('\n💡 Solution: Register at /register first\n');
    return null;
  }

  console.log('✅ USER FOUND IN DATABASE\n');
  console.log('📊 User Details:');
  console.log('─────────────────────────────────────────');
  console.log(`   Email:          ${user.email}`);
  console.log(`   Name:           ${user.name || '(not set)'}`);
  console.log(`   Role:           ${user.role || '(not assigned yet)'}`);
  console.log(`   Created:        ${new Date(user.created_at).toLocaleString('id-ID')}`);
  console.log('─────────────────────────────────────────\n');

  console.log('🔐 Account Status:');
  console.log('─────────────────────────────────────────');
  
  // Check password
  if (!user.password_hash) {
    console.log('   ❌ Password:     NOT SET');
    console.log('      → Run: npm run hash:pw to create password');
    console.log('      → Then update database manually');
  } else {
    console.log('   ✅ Password:     SET');
  }

  // Check email verification
  if (user.email_verified) {
    console.log('   ✅ Email:        VERIFIED');
  } else {
    console.log('   ❌ Email:        NOT VERIFIED');
    console.log('      → User needs to click verification link in email');
    console.log('      → Or manually set email_verified = true in database');
  }

  // Check approval
  if (user.approved) {
    console.log('   ✅ Approved:     YES');
  } else {
    console.log('   ❌ Approved:     NO');
    console.log('      → Super admin needs to approve in /admin/users');
    console.log('      → Or manually set approved = true in database');
  }

  console.log('─────────────────────────────────────────\n');

  // Login readiness check
  const canLogin = user.password_hash && user.email_verified && user.approved;
  
  if (canLogin) {
    console.log('🎉 LOGIN STATUS: READY TO LOGIN');
    console.log('   User can login at /admin/login\n');
  } else {
    console.log('⚠️  LOGIN STATUS: CANNOT LOGIN YET');
    console.log('\n📋 Checklist to enable login:');
    if (!user.password_hash) console.log('   [ ] Set password');
    if (!user.email_verified) console.log('   [ ] Verify email');
    if (!user.approved) console.log('   [ ] Get admin approval');
    console.log('');
  }

  // SQL commands for quick fix
  if (!canLogin) {
    console.log('🔧 Quick Fix SQL Commands:');
    console.log('─────────────────────────────────────────');
    console.log('-- Run this in Supabase SQL Editor:\n');
    console.log(`UPDATE users SET`);
    const updates = [];
    if (!user.email_verified) updates.push(`  email_verified = true`);
    if (!user.approved) updates.push(`  approved = true`);
    if (!user.role) updates.push(`  role = 'admin'`);
    console.log(updates.join(',\n'));
    console.log(`WHERE email = '${user.email}';\n`);
    console.log('─────────────────────────────────────────\n');
  }

  return user;
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('\n❌ Usage: node scripts/check-user-status.js <email>\n');
  console.log('Example:');
  console.log('  node scripts/check-user-status.js osis@osis.sch.id\n');
  process.exit(1);
}

checkUserStatus(email).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
