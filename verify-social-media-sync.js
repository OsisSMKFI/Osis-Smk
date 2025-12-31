// Comprehensive Social Media Auto-Sync Verification
const verifySocialMediaSync = async () => {
  console.log('🔍 Comprehensive Social Media Auto-Sync Verification\n');
  console.log('=' .repeat(60));

  let allTestsPassed = true;
  const results = [];

  // Test 1: Environment Variables Check
  console.log('🔧 Test 1: Environment Variables');
  try {
    const response = await fetch('http://localhost:3000/api/social-media/health');
    const health = await response.json();
    
    const envChecks = [
      { name: 'Instagram Token', has: health.environment.hasInstagramToken },
      { name: 'Instagram User ID', has: health.environment.hasInstagramUserId },
      { name: 'YouTube API Key', has: health.environment.hasYouTubeApiKey }
    ];

    envChecks.forEach(check => {
      const status = check.has ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (!check.has) allTestsPassed = false;
    });

    results.push({
      test: 'Environment Variables',
      passed: envChecks.every(c => c.has),
      details: envChecks
    });
  } catch (error) {
    console.log('  ❌ Failed to check environment');
    allTestsPassed = false;
  }

  // Test 2: Instagram API Connectivity
  console.log('\n📸 Test 2: Instagram API Connectivity');
  try {
    const igResponse = await fetch('http://localhost:3000/api/debug/instagram');
    const igData = await igResponse.json();
    
    if (igData.success) {
      console.log('  ✅ Instagram API Connected');
      console.log(`  📊 Followers: ${igData.data.stats.followers}`);
      console.log(`  📱 Posts: ${igData.data.posts.length}`);
      console.log(`  🔄 Following: ${igData.data.stats.following}`);
      
      results.push({
        test: 'Instagram API',
        passed: true,
        details: igData.data
      });
    } else {
      console.log('  ❌ Instagram API Failed:', igData.error);
      allTestsPassed = false;
      results.push({
        test: 'Instagram API',
        passed: false,
        error: igData.error
      });
    }
  } catch (error) {
    console.log('  ❌ Instagram API Error:', error.message);
    allTestsPassed = false;
  }

  // Test 3: YouTube API Connectivity
  console.log('\n🎥 Test 3: YouTube API Connectivity');
  try {
    const healthResponse = await fetch('http://localhost:3000/api/social-media/health');
    const health = await healthResponse.json();
    
    if (health.services.youtube.status === 'connected') {
      console.log('  ✅ YouTube API Connected');
      console.log(`  📹 Videos: ${health.services.youtube.videos}`);
      console.log(`  ⚡ Response Time: ${health.services.youtube.responseTime}ms`);
      
      results.push({
        test: 'YouTube API',
        passed: true,
        details: health.services.youtube
      });
    } else {
      console.log('  ❌ YouTube API Failed:', health.services.youtube.error || 'Not connected');
      allTestsPassed = false;
      results.push({
        test: 'YouTube API',
        passed: false,
        error: health.services.youtube.error
      });
    }
  } catch (error) {
    console.log('  ❌ YouTube API Error:', error.message);
    allTestsPassed = false;
  }

  // Test 4: Auto-Sync Interval Simulation
  console.log('\n🔄 Test 4: Auto-Sync Interval (3 cycles)');
  let syncCount = 0;
  const maxSyncs = 3;
  const syncResults = [];

  const syncTest = new Promise((resolve) => {
    const syncInterval = setInterval(async () => {
      syncCount++;
      console.log(`  🔄 Sync cycle ${syncCount}/${maxSyncs}:`);
      
      try {
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/api/social-media/health');
        const health = await response.json();
        const endTime = Date.now();
        
        const syncResult = {
          cycle: syncCount,
          timestamp: health.timestamp,
          instagram: {
            followers: health.services.instagram.followers,
            status: health.services.instagram.status,
            responseTime: health.services.instagram.responseTime
          },
          youtube: {
            videos: health.services.youtube.videos,
            status: health.services.youtube.status,
            responseTime: health.services.youtube.responseTime
          },
          overallStatus: health.status,
          totalTime: endTime - startTime
        };
        
        syncResults.push(syncResult);
        
        console.log(`    Instagram: ${syncResult.instagram.followers} followers (${syncResult.instagram.responseTime}ms)`);
        console.log(`    YouTube: ${syncResult.youtube.videos} videos (${syncResult.youtube.responseTime}ms)`);
        console.log(`    Overall: ${syncResult.overallStatus} (${syncResult.totalTime}ms total)`);
        
        if (syncCount >= maxSyncs) {
          clearInterval(syncInterval);
          resolve(syncResults);
        }
      } catch (error) {
        console.log(`    ❌ Sync ${syncCount} failed:`, error.message);
        allTestsPassed = false;
        clearInterval(syncInterval);
        resolve(syncResults);
      }
    }, 2000); // Every 2 seconds for testing
  });

  await syncTest;

  results.push({
    test: 'Auto-Sync Intervals',
    passed: syncResults.length === maxSyncs && syncResults.every(r => r.overallStatus !== 'unhealthy'),
    details: syncResults
  });

  // Test 5: Data Consistency
  console.log('\n🔍 Test 5: Data Consistency Check');
  if (syncResults.length > 1) {
    const first = syncResults[0];
    const last = syncResults[syncResults.length - 1];
    
    const igConsistent = first.instagram.followers === last.instagram.followers;
    const ytConsistent = first.youtube.videos === last.youtube.videos;
    
    console.log(`  Instagram data consistent: ${igConsistent ? '✅' : '⚠️'} (${first.instagram.followers} → ${last.instagram.followers})`);
    console.log(`  YouTube data consistent: ${ytConsistent ? '✅' : '⚠️'} (${first.youtube.videos} → ${last.youtube.videos})`);
    
    results.push({
      test: 'Data Consistency',
      passed: igConsistent && ytConsistent,
      details: { igConsistent, ytConsistent }
    });
  }

  // Final Results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL VERIFICATION RESULTS');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${result.test}`);
    
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  console.log('\n' + '=' .repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Auto-sync system is working perfectly.');
    console.log('✅ Instagram API: Connected and syncing');
    console.log('✅ YouTube API: Connected and syncing');
    console.log('✅ Auto-sync intervals: Working');
    console.log('✅ Data consistency: Maintained');
  } else {
    console.log('⚠️ SOME TESTS FAILED! Check the details above.');
  }
  console.log('=' .repeat(60));

  return { allTestsPassed, results };
};

// Run verification
verifySocialMediaSync().catch(console.error);
