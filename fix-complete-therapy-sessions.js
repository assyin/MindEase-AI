// Script to identify and add ALL missing columns to therapy_sessions table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miqeoteohumyxfsngjvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcWVvdGVvaHVteXhmc25nanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDQ3NzYsImV4cCI6MjA3MTc4MDc3Nn0.pKpkD_lf_EZCXHx6_UHlmbHZoYmOSoAK8gTOmnlCna0';

const supabase = createClient(supabaseUrl, supabaseKey);

// List of columns that should exist based on the migration file
const expectedColumns = [
  'id',
  'therapy_program_id', 
  'session_number',
  'scheduled_date',
  'actual_start_time',
  'actual_end_time', 
  'session_duration_minutes',
  'checkin_data',
  'homework_review',
  'main_content',
  'practical_application',
  'session_summary',
  'session_theme',
  'therapeutic_objective',
  'techniques_taught',
  'concepts_covered',
  'pre_session_mood_score',
  'post_session_mood_score', 
  'session_effectiveness_score',
  'user_engagement_level',
  'user_reaction_type',
  'adaptations_made',
  'expert_notes',
  'session_status',
  'attendance_status',
  'homework_assigned'
];

// Test each column to see which ones are missing
async function checkMissingColumns() {
  const missingColumns = [];
  
  console.log('🔍 Checking which columns exist in therapy_sessions table...\n');
  
  for (const column of expectedColumns) {
    try {
      const { error } = await supabase
        .from('therapy_sessions')
        .select(column)
        .limit(1);
        
      if (error && error.message.includes(column)) {
        missingColumns.push(column);
        console.log(`❌ Missing: ${column}`);
      } else {
        console.log(`✅ Exists: ${column}`);
      }
    } catch (err) {
      missingColumns.push(column);
      console.log(`❌ Missing: ${column}`);
    }
  }
  
  console.log(`\n📊 Summary: ${expectedColumns.length - missingColumns.length}/${expectedColumns.length} columns exist`);
  
  if (missingColumns.length > 0) {
    console.log(`\n🚨 Missing ${missingColumns.length} columns:`);
    missingColumns.forEach(col => console.log(`   - ${col}`));
    
    console.log('\n🛠️  SQL to add missing columns:');
    console.log('\nCopy and paste this into Supabase SQL Editor:');
    console.log('=' .repeat(50));
    
    const sqlCommands = generateMigrationSQL(missingColumns);
    console.log(sqlCommands);
    
    return false;
  } else {
    console.log('\n✅ All columns exist! The table is properly configured.');
    return true;
  }
}

function generateMigrationSQL(missingColumns) {
  const columnDefinitions = {
    'checkin_data': 'JSONB DEFAULT \'{}\'',
    'homework_review': 'JSONB DEFAULT \'{}\'', 
    'main_content': 'JSONB DEFAULT \'{}\'',
    'practical_application': 'JSONB DEFAULT \'{}\'',
    'session_summary': 'JSONB DEFAULT \'{}\'',
    'session_theme': 'VARCHAR(255)',
    'therapeutic_objective': 'TEXT',
    'techniques_taught': 'JSONB DEFAULT \'[]\'',
    'concepts_covered': 'JSONB DEFAULT \'[]\'',
    'pre_session_mood_score': 'INTEGER CHECK (pre_session_mood_score >= 1 AND pre_session_mood_score <= 10)',
    'post_session_mood_score': 'INTEGER CHECK (post_session_mood_score >= 1 AND post_session_mood_score <= 10)',
    'session_effectiveness_score': 'INTEGER CHECK (session_effectiveness_score >= 1 AND session_effectiveness_score <= 10)',
    'user_engagement_level': 'INTEGER CHECK (user_engagement_level >= 1 AND user_engagement_level <= 10)',
    'user_reaction_type': 'VARCHAR(50)',
    'adaptations_made': 'JSONB DEFAULT \'[]\'',
    'expert_notes': 'TEXT',
    'session_status': 'VARCHAR(20) DEFAULT \'planned\' CHECK (session_status IN (\'planned\', \'in_progress\', \'completed\', \'missed\', \'cancelled\'))',
    'attendance_status': 'VARCHAR(20) DEFAULT \'present\' CHECK (attendance_status IN (\'present\', \'absent\', \'partial\'))',
    'homework_assigned': 'JSONB DEFAULT \'[]\'',
    'scheduled_date': 'TIMESTAMPTZ',
    'actual_start_time': 'TIMESTAMPTZ',
    'actual_end_time': 'TIMESTAMPTZ',
    'session_duration_minutes': 'INTEGER'
  };
  
  let sql = '-- Add missing columns to therapy_sessions table\n\n';
  
  missingColumns.forEach(column => {
    if (columnDefinitions[column]) {
      sql += `ALTER TABLE therapy_sessions ADD COLUMN ${column} ${columnDefinitions[column]};\n`;
    }
  });
  
  return sql;
}

checkMissingColumns().catch(console.error);