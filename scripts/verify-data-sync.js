/**
 * Comprehensive data verification script
 * Checks all members data is properly synced and valid
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDataSync() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Database Sync Verification Tool     ║');
  console.log('╚════════════════════════════════════════╝\n');

  // 1. Check for duplicates
  console.log('📋 Step 1: Checking for duplicate names...');
  const { data: allMembers } = await supabase
    .from('members')
    .select('id, name, role, sekbid_id, is_active')
    .eq('is_active', true);

  const nameMap = new Map();
  allMembers.forEach(m => {
    if (!nameMap.has(m.name)) nameMap.set(m.name, []);
    nameMap.get(m.name).push(m);
  });

  const duplicates = Array.from(nameMap.values()).filter(arr => arr.length > 1);
  if (duplicates.length > 0) {
    console.log(`   ❌ Found ${duplicates.length} duplicate names!`);
    duplicates.forEach(dups => {
      console.log(`      - ${dups[0].name}: ${dups.map(d => `ID ${d.id}`).join(', ')}`);
    });
  } else {
    console.log('   ✅ No duplicates found\n');
  }

  // 2. Check role validity
  console.log('📋 Step 2: Checking role validity...');
  const validRoles = [
    'Ketua OSIS', 'Wakil Ketua', 'Sekretaris', 'Bendahara',
    'Koordinator Sekbid', 'Ketua Sekbid', 'Wakil Ketua Sekbid', 'Anggota'
  ];

  const invalidRoles = allMembers.filter(m => {
    const role = m.role || '';
    return !validRoles.some(v => v.toLowerCase() === role.toLowerCase());
  });

  if (invalidRoles.length > 0) {
    console.log(`   ⚠️  Found ${invalidRoles.length} members with invalid/old roles:`);
    invalidRoles.forEach(m => {
      console.log(`      - ID ${m.id}: ${m.name} → "${m.role}"`);
    });
    console.log('');
  } else {
    console.log('   ✅ All roles are valid\n');
  }

  // 3. Check sekbid_id consistency
  console.log('📋 Step 3: Checking sekbid_id consistency...');
  
  const timInti = ['Ketua OSIS', 'Wakil Ketua', 'Sekretaris', 'Bendahara'];
  const wrongTimInti = allMembers.filter(m => 
    timInti.some(r => r.toLowerCase() === (m.role || '').toLowerCase()) && 
    m.sekbid_id !== null
  );

  if (wrongTimInti.length > 0) {
    console.log(`   ⚠️  Found ${wrongTimInti.length} Tim Inti with sekbid_id (should be NULL):`);
    wrongTimInti.forEach(m => {
      console.log(`      - ID ${m.id}: ${m.name} (${m.role}) → sekbid_id: ${m.sekbid_id}`);
    });
    console.log('');
  } else {
    console.log('   ✅ Tim Inti members have NULL sekbid_id\n');
  }

  // 4. Check orphaned members
  console.log('📋 Step 4: Checking for orphaned members...');
  const orphaned = allMembers.filter(m => {
    const isTimInti = timInti.some(r => r.toLowerCase() === (m.role || '').toLowerCase());
    const isKoordinator = ['Koordinator Sekbid', 'Ketua Sekbid', 'Wakil Ketua Sekbid']
      .some(r => r.toLowerCase() === (m.role || '').toLowerCase());
    
    return !isTimInti && m.role === 'Anggota' && m.sekbid_id === null;
  });

  if (orphaned.length > 0) {
    console.log(`   ⚠️  Found ${orphaned.length} Anggota without sekbid assignment:`);
    orphaned.forEach(m => {
      console.log(`      - ID ${m.id}: ${m.name}`);
    });
    console.log('   💡 These members should be assigned to a sekbid (1-6)\n');
  } else {
    console.log('   ✅ All Anggota have proper sekbid assignment\n');
  }

  // 5. Check invalid sekbid_id
  console.log('📋 Step 5: Checking for invalid sekbid_id values...');
  const invalidSekbid = allMembers.filter(m => 
    m.sekbid_id !== null && (m.sekbid_id < 1 || m.sekbid_id > 6)
  );

  if (invalidSekbid.length > 0) {
    console.log(`   ❌ Found ${invalidSekbid.length} members with invalid sekbid_id:`);
    invalidSekbid.forEach(m => {
      console.log(`      - ID ${m.id}: ${m.name} → sekbid_id: ${m.sekbid_id}`);
    });
    console.log('');
  } else {
    console.log('   ✅ All sekbid_id values are valid (NULL or 1-6)\n');
  }

  // 6. Summary
  console.log('╔════════════════════════════════════════╗');
  console.log('║          VERIFICATION SUMMARY          ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`📊 Total active members: ${allMembers.length}`);
  console.log(`${duplicates.length === 0 ? '✅' : '❌'} Duplicates: ${duplicates.length}`);
  console.log(`${invalidRoles.length === 0 ? '✅' : '⚠️ '} Invalid roles: ${invalidRoles.length}`);
  console.log(`${wrongTimInti.length === 0 ? '✅' : '⚠️ '} Tim Inti with sekbid: ${wrongTimInti.length}`);
  console.log(`${orphaned.length === 0 ? '✅' : '⚠️ '} Orphaned Anggota: ${orphaned.length}`);
  console.log(`${invalidSekbid.length === 0 ? '✅' : '❌'} Invalid sekbid_id: ${invalidSekbid.length}`);
  
  const allGood = duplicates.length === 0 && invalidRoles.length === 0 && 
                  wrongTimInti.length === 0 && invalidSekbid.length === 0;
  
  console.log('\n' + (allGood ? '✅ DATABASE IS FULLY SYNCED!' : '⚠️  Some issues found - check details above'));
  console.log(orphaned.length > 0 ? `\n💡 ${orphaned.length} members need sekbid assignment via admin panel\n` : '\n');
}

verifyDataSync().catch(console.error);
