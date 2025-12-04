/**
 * Clean Instagram usernames in database
 * Remove @ symbol if exists at the start
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanInstagramUsernames() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Instagram Username Cleanup Tool      ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Check members table
  console.log('📋 Checking members table...\n');
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name, instagram')
    .not('instagram', 'is', null);

  if (membersError) {
    console.error('❌ Error fetching members:', membersError);
    return;
  }

  const membersToUpdate = members.filter(m => m.instagram?.startsWith('@'));
  
  if (membersToUpdate.length > 0) {
    console.log(`⚠️  Found ${membersToUpdate.length} members with @ in instagram:\n`);
    
    for (const member of membersToUpdate) {
      const cleanUsername = member.instagram.replace(/^@/, '');
      console.log(`   ${member.name}: "${member.instagram}" → "${cleanUsername}"`);
      
      const { error } = await supabase
        .from('members')
        .update({ instagram: cleanUsername })
        .eq('id', member.id);
      
      if (error) {
        console.error(`   ❌ Failed to update ${member.name}:`, error.message);
      } else {
        console.log(`   ✅ Updated ${member.name}`);
      }
    }
  } else {
    console.log('✅ All member Instagram usernames are clean (no @ prefix)\n');
  }

  // Check users table
  console.log('\n📋 Checking users table...\n');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, instagram_username')
    .not('instagram_username', 'is', null);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  const usersToUpdate = users.filter(u => u.instagram_username?.startsWith('@'));
  
  if (usersToUpdate.length > 0) {
    console.log(`⚠️  Found ${usersToUpdate.length} users with @ in instagram_username:\n`);
    
    for (const user of usersToUpdate) {
      const cleanUsername = user.instagram_username.replace(/^@/, '');
      console.log(`   ${user.name}: "${user.instagram_username}" → "${cleanUsername}"`);
      
      const { error } = await supabase
        .from('users')
        .update({ instagram_username: cleanUsername })
        .eq('id', user.id);
      
      if (error) {
        console.error(`   ❌ Failed to update ${user.name}:`, error.message);
      } else {
        console.log(`   ✅ Updated ${user.name}`);
      }
    }
  } else {
    console.log('✅ All user Instagram usernames are clean (no @ prefix)\n');
  }

  // Check comments table
  console.log('\n📋 Checking comments table...\n');
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, author_name, instagram_username')
    .not('instagram_username', 'is', null);

  if (commentsError) {
    console.error('❌ Error fetching comments:', commentsError);
    return;
  }

  const commentsToUpdate = comments.filter(c => c.instagram_username?.startsWith('@'));
  
  if (commentsToUpdate.length > 0) {
    console.log(`⚠️  Found ${commentsToUpdate.length} comments with @ in instagram_username:\n`);
    
    for (const comment of commentsToUpdate) {
      const cleanUsername = comment.instagram_username.replace(/^@/, '');
      console.log(`   Comment by ${comment.author_name}: "${comment.instagram_username}" → "${cleanUsername}"`);
      
      const { error } = await supabase
        .from('comments')
        .update({ instagram_username: cleanUsername })
        .eq('id', comment.id);
      
      if (error) {
        console.error(`   ❌ Failed to update comment ${comment.id}:`, error.message);
      } else {
        console.log(`   ✅ Updated comment ${comment.id}`);
      }
    }
  } else {
    console.log('✅ All comment Instagram usernames are clean (no @ prefix)\n');
  }

  console.log('\n✅ Instagram username cleanup complete!\n');
}

cleanInstagramUsernames().catch(console.error);
