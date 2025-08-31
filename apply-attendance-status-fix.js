#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://miqeoteohumyxfsngjvt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcWVvdGVvaHVteXhmc25nanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDQ3NzYsImV4cCI6MjA3MTc4MDc3Nn0.pKpkD_lf_EZCXHx6_UHlmbHZoYmOSoAK8gTOmnlCna0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Checking current therapy_sessions table structure...');
    
    // First check if the column already exists
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'therapy_sessions' })
      .catch(async () => {
        // If RPC doesn't exist, try a direct query to check column existence
        const { error } = await supabase
          .from('therapy_sessions')
          .select('attendance_status')
          .limit(0);
        
        if (error && error.message.includes("attendance_status")) {
          return { data: null, error: { message: 'Column does not exist' } };
        }
        return { data: 'exists', error: null };
      });

    if (columns === 'exists') {
      console.log('✅ attendance_status column already exists');
      return;
    }

    console.log('Adding attendance_status column to therapy_sessions table...');
    
    // Read the SQL migration file
    const migrationSQL = fs.readFileSync('./fix-attendance-status-column.sql', 'utf8');
    
    // Apply the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative approach using direct SQL execution
      console.log('Trying direct SQL execution...');
      
      // Split SQL commands and execute them one by one
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
        
      for (const command of commands) {
        if (command.toLowerCase().includes('comment on column')) {
          // Skip comments as they might not be supported
          continue;
        }
        
        const { error: cmdError } = await supabase.rpc('exec', { sql: command });
        if (cmdError) {
          console.error('Error executing command:', command);
          throw cmdError;
        }
      }
    }
    
    console.log('✅ Migration applied successfully');
    
    // Verify the column was added
    const { error: verifyError } = await supabase
      .from('therapy_sessions')
      .select('attendance_status')
      .limit(1);
      
    if (verifyError) {
      throw new Error('Verification failed: ' + verifyError.message);
    }
    
    console.log('✅ Column verification successful');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();