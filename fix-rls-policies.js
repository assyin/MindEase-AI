// Script to check and fix RLS policies for therapy_sessions table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miqeoteohumyxfsngjvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcWVvdGVvaHVteXhmc25nanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDQ3NzYsImV4cCI6MjA3MTc4MDc3Nn0.pKpkD_lf_EZCXHx6_UHlmbHZoYmOSoAK8gTOmnlCna0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔒 Checking RLS policies for therapy_sessions table...\n');
  
  try {
    // Try to get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ User not authenticated. This might be the issue.');
      console.log('   Make sure you are logged in to your app.');
      return;
    }
    
    console.log(`✅ User authenticated: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    
    // Check if we can read from therapy_sessions
    const { data: readData, error: readError } = await supabase
      .from('therapy_sessions')
      .select('id')
      .limit(1);
      
    if (readError) {
      console.log('❌ Cannot read from therapy_sessions:', readError.message);
    } else {
      console.log('✅ Can read from therapy_sessions');
    }
    
    // Test insert with minimal data to see exact error
    console.log('\n🧪 Testing insert operation...');
    
    const testSession = {
      user_id: user.id,
      session_number: 1,
      session_type: 'initial',
      checkin_data: {},
      attendance_status: 'present'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('therapy_sessions')
      .insert(testSession)
      .select();
      
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('   Error code:', insertError.code);
      
      if (insertError.code === '42501') {
        console.log('\n🛠️  RLS POLICY ISSUE DETECTED');
        console.log('   The table has Row Level Security enabled but no policies allow INSERT.');
        console.log('\n   SOLUTION: Add these RLS policies in Supabase SQL Editor:');
        console.log('   ' + '='.repeat(60));
        
        const policies = generateRLSPolicies();
        console.log(policies);
      }
    } else {
      console.log('✅ Insert successful!');
      console.log('   Session created:', insertData[0]?.id);
      
      // Clean up test data
      if (insertData[0]?.id) {
        await supabase
          .from('therapy_sessions')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

function generateRLSPolicies() {
  return `
-- Enable RLS on therapy_sessions table
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own therapy sessions
CREATE POLICY "Users can insert own therapy sessions" ON therapy_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own therapy sessions  
CREATE POLICY "Users can view own therapy sessions" ON therapy_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own therapy sessions
CREATE POLICY "Users can update own therapy sessions" ON therapy_sessions  
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own therapy sessions
CREATE POLICY "Users can delete own therapy sessions" ON therapy_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: Admin policy (if you have admin users)
-- CREATE POLICY "Admins can manage all therapy sessions" ON therapy_sessions
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
`;
}

checkRLSPolicies().catch(console.error);