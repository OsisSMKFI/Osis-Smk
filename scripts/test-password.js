/**
 * Test Password Script
 * Tests if a password matches the stored hash for a user
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testPassword(email, password) {
  console.log(`\n🔐 Testing password for: ${email}\n`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, email_verified, approved, role')
    .ilike('email', email)
    .single();

  if (error || !user) {
    console.log('❌ USER NOT FOUND\n');
    return false;
  }

  if (!user.password_hash) {
    console.log('❌ No password set for this user\n');
    return false;
  }

  console.log('✅ User found');
  console.log(`   Email Verified: ${user.email_verified ? '✅' : '❌'}`);
  console.log(`   Approved:       ${user.approved ? '✅' : '❌'}`);
  console.log(`   Role:           ${user.role || '(not set)'}\n`);

  console.log('🔍 Testing password...');
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (isMatch) {
    console.log('✅ PASSWORD CORRECT!\n');
    console.log('🎉 This user CAN login with this password\n');
    return true;
  } else {
    console.log('❌ PASSWORD INCORRECT!\n');
    console.log('⚠️  Possible issues:');
    console.log('   - Wrong password entered');
    console.log('   - Password needs to be reset');
    console.log('   - Hash in database is corrupted\n');
    console.log('💡 To reset password:');
    console.log('   1. Run: npm run hash:pw');
    console.log('   2. Copy the generated hash');
    console.log('   3. Update database:\n');
    console.log(`   UPDATE users SET password_hash = 'YOUR_NEW_HASH' WHERE email = '${email}';\n`);
    return false;
  }
}

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('\n❌ Usage: npm run test:pw <email>\n');
    console.log('Example:');
    console.log('  npm run test:pw osis@osis.sch.id\n');
    rl.close();
    process.exit(1);
  }

  const password = await question('Enter password to test: ');
  
  if (!password) {
    console.log('\n❌ Password cannot be empty\n');
    rl.close();
    process.exit(1);
  }

  await testPassword(email, password);
  rl.close();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  rl.close();
  process.exit(1);
});
