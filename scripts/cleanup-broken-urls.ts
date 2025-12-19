/**
 * Script to clean up broken photo URLs from database
 * Run with: npx tsx scripts/cleanup-broken-urls.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Old Supabase domains that are no longer valid
const OLD_DOMAINS = [
  'eilrnslorvfrtwjwvbaw.supabase.co',
];

async function checkUrlAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal 
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function cleanupMembers() {
  console.log('\n📋 Checking members table...');
  
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, photo_url, foto_url')
    .not('photo_url', 'is', null);

  if (error) {
    console.error('Error fetching members:', error);
    return;
  }

  const brokenMembers: any[] = [];
  
  for (const member of members || []) {
    const url = member.photo_url;
    
    // Check if URL uses old domain
    const usesOldDomain = OLD_DOMAINS.some(domain => url?.includes(domain));
    
    if (usesOldDomain) {
      brokenMembers.push(member);
      continue;
    }
    
    // Check if URL is accessible
    if (url && !(await checkUrlAccessible(url))) {
      brokenMembers.push(member);
    }
  }

  console.log(`Found ${brokenMembers.length} members with broken photos`);

  for (const member of brokenMembers) {
    console.log(`  🧹 Cleaning: ID ${member.id} - ${member.name}`);
    
    const { error: updateError } = await supabase
      .from('members')
      .update({ photo_url: null })
      .eq('id', member.id);

    if (updateError) {
      console.error(`    ❌ Failed to update member ${member.id}:`, updateError.message);
    } else {
      console.log(`    ✅ Cleaned`);
    }
  }

  return brokenMembers.length;
}

async function cleanupEvents() {
  console.log('\n📋 Checking events table...');
  
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, image_url')
    .not('image_url', 'is', null);

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  const brokenEvents: any[] = [];
  
  for (const event of events || []) {
    const url = event.image_url;
    
    const usesOldDomain = OLD_DOMAINS.some(domain => url?.includes(domain));
    
    if (usesOldDomain) {
      brokenEvents.push(event);
      continue;
    }
    
    if (url && !(await checkUrlAccessible(url))) {
      brokenEvents.push(event);
    }
  }

  console.log(`Found ${brokenEvents.length} events with broken images`);

  for (const event of brokenEvents) {
    console.log(`  🧹 Cleaning: ID ${event.id} - ${event.title}`);
    
    const { error: updateError } = await supabase
      .from('events')
      .update({ image_url: null })
      .eq('id', event.id);

    if (updateError) {
      console.error(`    ❌ Failed:`, updateError.message);
    } else {
      console.log(`    ✅ Cleaned`);
    }
  }

  return brokenEvents.length;
}

async function cleanupGallery() {
  console.log('\n📋 Checking gallery table...');
  
  const { data: items, error } = await supabase
    .from('gallery')
    .select('id, title, image_url, video_url')
    .or('image_url.not.is.null,video_url.not.is.null');

  if (error) {
    console.error('Error fetching gallery:', error);
    return;
  }

  const brokenItems: any[] = [];
  
  for (const item of items || []) {
    const imageUrl = item.image_url;
    const videoUrl = item.video_url;
    
    let imageBroken = false;
    let videoBroken = false;
    
    if (imageUrl) {
      const usesOldDomain = OLD_DOMAINS.some(domain => imageUrl?.includes(domain));
      if (usesOldDomain || !(await checkUrlAccessible(imageUrl))) {
        imageBroken = true;
      }
    }
    
    if (videoUrl) {
      const usesOldDomain = OLD_DOMAINS.some(domain => videoUrl?.includes(domain));
      if (usesOldDomain || !(await checkUrlAccessible(videoUrl))) {
        videoBroken = true;
      }
    }
    
    if (imageBroken || videoBroken) {
      brokenItems.push({ ...item, imageBroken, videoBroken });
    }
  }

  console.log(`Found ${brokenItems.length} gallery items with broken URLs`);

  for (const item of brokenItems) {
    console.log(`  🧹 Cleaning: ID ${item.id} - ${item.title || 'Untitled'}`);
    
    const updates: any = {};
    if (item.imageBroken) updates.image_url = null;
    if (item.videoBroken) updates.video_url = null;
    
    const { error: updateError } = await supabase
      .from('gallery')
      .update(updates)
      .eq('id', item.id);

    if (updateError) {
      console.error(`    ❌ Failed:`, updateError.message);
    } else {
      console.log(`    ✅ Cleaned`);
    }
  }

  return brokenItems.length;
}

async function cleanupPosts() {
  console.log('\n📋 Checking posts table...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, image_url')
    .not('image_url', 'is', null);

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  const brokenPosts: any[] = [];
  
  for (const post of posts || []) {
    const url = post.image_url;
    
    const usesOldDomain = OLD_DOMAINS.some(domain => url?.includes(domain));
    
    if (usesOldDomain) {
      brokenPosts.push(post);
      continue;
    }
    
    if (url && !(await checkUrlAccessible(url))) {
      brokenPosts.push(post);
    }
  }

  console.log(`Found ${brokenPosts.length} posts with broken images`);

  for (const post of brokenPosts) {
    console.log(`  🧹 Cleaning: ID ${post.id} - ${post.title}`);
    
    const { error: updateError } = await supabase
      .from('posts')
      .update({ image_url: null })
      .eq('id', post.id);

    if (updateError) {
      console.error(`    ❌ Failed:`, updateError.message);
    } else {
      console.log(`    ✅ Cleaned`);
    }
  }

  return brokenPosts.length;
}

async function main() {
  console.log('🧹 Starting cleanup of broken URLs...');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`🚫 Old domains to clean: ${OLD_DOMAINS.join(', ')}`);
  
  const membersCount = await cleanupMembers();
  const eventsCount = await cleanupEvents();
  const galleryCount = await cleanupGallery();
  const postsCount = await cleanupPosts();

  console.log('\n' + '='.repeat(50));
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(50));
  console.log(`Members cleaned: ${membersCount}`);
  console.log(`Events cleaned: ${eventsCount}`);
  console.log(`Gallery cleaned: ${galleryCount}`);
  console.log(`Posts cleaned: ${postsCount}`);
  console.log('='.repeat(50));
  console.log('✅ Cleanup complete!');
}

main().catch(console.error);
