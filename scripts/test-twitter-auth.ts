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
        
    if (error || !site) {
        console.error('❌ Failed to get site', error);
        return;
    }

    const xtwitter = site.social_params?.xtwitter;
    if (!xtwitter) {
        console.error('❌ No xtwitter config found');
        return;
    }

    console.log('🔑 Keys found:');
    console.log(`- app_key length: ${xtwitter.app_key?.length}`);
    console.log(`- app_secret length: ${xtwitter.app_secret?.length}`);
    console.log(`- access_token length: ${xtwitter.access_token?.length}`);
    console.log(`- access_secret length: ${xtwitter.access_secret?.length}`);

    // Check for obvious whitespace issues
    const hasWhitespace = [xtwitter.app_key, xtwitter.app_secret, xtwitter.access_token, xtwitter.access_secret]
        .some(token => token && (token.trim() !== token || /\s/.test(token)));
    
    if (hasWhitespace) {
        console.log('⚠️ WARNING: Whitespace detected in one of the keys! This will cause authentication to fail.');
    }

    try {
        console.log('\n📡 Testing Twitter API connection...');
        const twitterClient = new TwitterApi({
            appKey: xtwitter.app_key?.trim(),
            appSecret: xtwitter.app_secret?.trim(),
            accessToken: xtwitter.access_token?.trim(),
            accessSecret: xtwitter.access_secret?.trim(),
        });

        const user = await twitterClient.v2.me();
        console.log('✅ Connected successfully as:', user.data.username);
        
        // Check permissions by trying to create a draft or just seeing if we have write access? 
        // Twitter v2 /me doesn't explicitly return scopes, but getting here means the keys are valid for basic read.
        console.log('If publishing still fails, it might be due to missing WRITE permissions on the Twitter App settings.');

    } catch (err: any) {
        console.error('❌ API Error:');
        console.error(err?.data || err?.message || err);
    }
}

testTwitter();
