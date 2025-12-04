#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, email_verified, approved, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 Run supabase-super-admin-seed.sql to create admin user:');
      console.log('   Email: admin@osis.sch.id');
      console.log('   Password: SuperAdmin123!');
      process.exit(2);
    }
    
    console.log(`\n✅ Found ${data.length} user(s):\n`);
    console.table(data.map(u => ({
      Email: u.email,
      Name: u.name || '(no name)',
      Role: u.role || 'siswa',
      Verified: u.email_verified ? '✓' : '✗',
      Approved: u.approved ? '✓' : '✗',
    })));
    
    const superAdmins = data.filter(u => u.role === 'super_admin');
    if (superAdmins.length > 0) {
      console.log(`\n🔑 Super Admin accounts (${superAdmins.length}):`);
      superAdmins.forEach(u => {
        console.log(`   - ${u.email} (verified: ${u.email_verified ? '✓' : '✗'}, approved: ${u.approved ? '✓' : '✗'})`);
      });
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error listing users:', e.message || e);
    process.exit(1);
  }
}

listUsers();
