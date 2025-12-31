// Test Instagram API locally
const accessToken = "IGAATdZBfLW75hBZAFlQTWpoczVIdkQ5UkJfREhnWkw2VFpyZAldNb0R5dTlYSktrVktTdDVJamxsYXI5SC1vbUJuTEFsRmhvTWdqeW0wWmM5RGFueXp3Q294MnlhNmFuZAU5GMUpzRk9vS0ZACcjROMURIeFUzdFNRa1AxaG5VOFJCTQZDZD";
const userId = "25481924444802667";

async function testInstagramAPI() {
  console.log('🔍 Testing Instagram API...\n');
  
  // Test 1: Get User Stats
  console.log('📊 Testing Instagram Stats API:');
  try {
    const statsUrl = `https://graph.instagram.com/${userId}?fields=followers_count,follows_count,media_count&access_token=${accessToken}`;
    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();
    
    console.log('Status:', statsResponse.status);
    console.log('Response:', JSON.stringify(statsData, null, 2));
    
    if (statsData.followers_count) {
      console.log(`✅ Followers: ${statsData.followers_count}`);
      console.log(`✅ Following: ${statsData.follows_count}`);
      console.log(`✅ Posts: ${statsData.media_count}`);
    }
  } catch (error) {
    console.error('❌ Stats API Error:', error.message);
  }
  
  console.log('\n📸 Testing Instagram Media API:');
  
  // Test 2: Get Media Posts
  try {
    const mediaUrl = `https://graph.instagram.com/${userId}/media?fields=id,media_url,caption,like_count,comments_count,timestamp,permalink,media_type&limit=3&access_token=${accessToken}`;
    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();
    
    console.log('Status:', mediaResponse.status);
    console.log('Response:', JSON.stringify(mediaData, null, 2));
    
    if (mediaData.data && mediaData.data.length > 0) {
      console.log(`✅ Found ${mediaData.data.length} posts`);
      mediaData.data.forEach((post, index) => {
        console.log(`Post ${index + 1}: ${post.caption?.substring(0, 50)}...`);
      });
    }
  } catch (error) {
    console.error('❌ Media API Error:', error.message);
  }
}

testInstagramAPI();
