// Test Auto-Sync System
const testAutoSync = async () => {
  console.log('🔄 Testing Auto-Sync System...\n');

  // Test 1: Health Check API
  console.log('🏥 Testing Health Check API:');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/social-media/health');
    const health = await healthResponse.json();
    
    console.log('Status:', health.status);
    console.log('Instagram:', health.services.instagram.status, '-', health.services.instagram.followers, 'followers');
    console.log('YouTube:', health.services.youtube.status, '-', health.services.youtube.videos, 'videos');
    console.log('Environment:', {
      hasInstagramToken: health.environment.hasInstagramToken,
      hasYouTubeApiKey: health.environment.hasYouTubeApiKey
    });
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
  }

  console.log('\n📊 Testing Instagram API:');
  try {
    const igResponse = await fetch('http://localhost:3000/api/debug/instagram');
    const igData = await igResponse.json();
    
    if (igData.success) {
      console.log('✅ Instagram Stats:', igData.data.stats);
      console.log('✅ Instagram Posts:', igData.data.posts.length, 'posts found');
    } else {
      console.error('❌ Instagram API Error:', igData.error);
    }
  } catch (error) {
    console.error('❌ Instagram Debug failed:', error.message);
  }

  console.log('\n🔄 Testing Auto-Sync Intervals:');
  
  // Simulate auto-sync every 5 seconds for testing
  let syncCount = 0;
  const maxSyncs = 3;
  
  const syncInterval = setInterval(async () => {
    syncCount++;
    console.log(`\n🔄 Auto-Sync #${syncCount}:`);
    
    try {
      const healthResponse = await fetch('http://localhost:3000/api/social-media/health');
      const health = await healthResponse.json();
      
      console.log(`Instagram: ${health.services.instagram.followers} followers (${health.services.instagram.responseTime}ms)`);
      console.log(`YouTube: ${health.services.youtube.videos} videos (${health.services.youtube.responseTime}ms)`);
      console.log(`Overall Status: ${health.status}`);
      
      if (syncCount >= maxSyncs) {
        clearInterval(syncInterval);
        console.log('\n✅ Auto-Sync test completed!');
      }
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
    }
  }, 5000); // Every 5 seconds for testing (normally 30 minutes)

  // Cleanup after 30 seconds
  setTimeout(() => {
    clearInterval(syncInterval);
    console.log('\n⏰ Test timeout completed');
  }, 30000);
};

// Run test if server is running
testAutoSync().catch(console.error);
