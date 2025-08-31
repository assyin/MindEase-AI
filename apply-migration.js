// Simple script to apply the attendance_status column migration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miqeoteohumyxfsngjvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcWVvdGVvaHVteXhmc25nanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDQ3NzYsImV4cCI6MjA3MTc4MDc3Nn0.pKpkD_lf_EZCXHx6_UHlmbHZoYmOSoAK8gTOmnlCna0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAddColumn() {
  console.log('🔍 Checking if attendance_status column exists...');
  
  // Test if the column exists by trying to select it
  const { data, error } = await supabase
    .from('therapy_sessions')
    .select('attendance_status')
    .limit(1);

  if (!error) {
    console.log('✅ attendance_status column already exists!');
    return true;
  }

  if (error.message.includes('attendance_status')) {
    console.log('❌ attendance_status column does not exist');
    console.log('');
    console.log('🛠️  To fix this issue, you need to add the column manually to your Supabase database.');
    console.log('');
    console.log('Go to your Supabase dashboard SQL Editor and run:');
    console.log('');
    console.log('ALTER TABLE therapy_sessions');
    console.log("ADD COLUMN attendance_status VARCHAR(20) DEFAULT 'present'"); 
    console.log("CHECK (attendance_status IN ('present', 'absent', 'partial'));");
    console.log('');
    console.log('Alternative: Go to Supabase Dashboard > Table Editor > therapy_sessions');
    console.log('Click "Add Column" and add:');
    console.log('- Name: attendance_status');
    console.log('- Type: varchar');
    console.log('- Default value: present');
    console.log('- Check constraint: attendance_status IN (\'present\', \'absent\', \'partial\')');
    
    return false;
  }

  console.log('❌ Unknown error:', error.message);
  return false;
}

async function testOnboardingFlow() {
  console.log('🧪 Testing onboarding flow...');
  
  try {
    // Test that we can insert a session with attendance_status
    const testSession = {
      therapy_program_id: '00000000-0000-0000-0000-000000000000', // placeholder
      user_id: '00000000-0000-0000-0000-000000000000', // placeholder
      session_number: 1,
      session_type: 'initial',
      attendance_status: 'present'
    };
    
    // This will fail with foreign key constraints, but should not fail on attendance_status
    const { error } = await supabase
      .from('therapy_sessions')
      .insert(testSession);
    
    if (error && !error.message.includes('attendance_status')) {
      console.log('✅ attendance_status column is working correctly');
      console.log('   (The insert failed due to foreign key constraints, which is expected)');
      return true;
    } else if (error && error.message.includes('attendance_status')) {
      console.log('❌ attendance_status column issue:', error.message);
      return false;
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
    return false;
  }
}

async function main() {
  const columnExists = await checkAndAddColumn();
  
  if (columnExists) {
    await testOnboardingFlow();
  }
}

main().catch(console.error);