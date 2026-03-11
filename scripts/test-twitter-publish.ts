import 'dotenv/config';
import { supabaseService } from '../server/supabase-service';
import { TwitterApi } from 'twitter-api-v2';

async function testTwitter() {
    console.log('🔍 Fetching social params from DB for site 10...');
    const client = supabaseService.getClientWithAccessToken();
    const { data: site, error } = await client
        .from('sites')
        .select('social_params')
        .eq('id', 10)
        .single();
        
    if (error || !site || !site.social_params?.xtwitter) {
        console.error('❌ Failed to get site configs');
        return;
    }

    const xtwitter = site.social_params.xtwitter;
    
    try {
        console.log('\n📡 Testing Twitter API v2.tweet()...');
        const twitterClient = new TwitterApi({
            appKey: xtwitter.app_key?.trim(),
            appSecret: xtwitter.app_secret?.trim(),
            accessToken: xtwitter.access_token?.trim(),
            accessSecret: xtwitter.access_secret?.trim(),
        });

        // The v2.tweet endpoint should be available on the Free tier!
        // The error "does not have any credits" usually happens if the developer portal app is NOT set to the "Free" tier explicitly, 
        // or if they are calling v1.1 endpoints (v1.1 is mostly paid now except for media upload).
        // Let's test the v2 tweet explicitly.
        
        const tweet = await twitterClient.v2.tweet('Ceci est un test de publication automatisée via l\'API V2 (Free Tier) !');
        console.log('✅ Tweet published!', tweet.data.id);

    } catch (err: any) {
        console.error('❌ API Error:');
        console.error(err?.data || err?.message || err);
    }
}

testTwitter();
