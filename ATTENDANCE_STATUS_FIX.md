# Fix for Missing attendance_status Column

## Problem
The application is failing during onboarding with the error:
```
Could not find the 'attendance_status' column of 'therapy_sessions' in the schema cache
```

## Root Cause
The `attendance_status` column is missing from the `therapy_sessions` table in your Supabase database, but the application code expects it to exist.

## Solution

### Method 1: Supabase Dashboard SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
ALTER TABLE therapy_sessions 
ADD COLUMN attendance_status VARCHAR(20) DEFAULT 'present' 
CHECK (attendance_status IN ('present', 'absent', 'partial'));
```

### Method 2: Supabase Table Editor
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** 
3. Select the `therapy_sessions` table
4. Click **Add Column**
5. Configure:
   - **Name**: `attendance_status`
   - **Type**: `varchar`
   - **Default value**: `present`
   - **Check constraint**: `attendance_status IN ('present', 'absent', 'partial')`

## Verification
After applying the fix, run:
```bash
node apply-migration.js
```

This will verify the column exists and test that the onboarding flow can proceed.

## Files Updated
- `database/schema.sql` - Updated schema for future installations
- `database/install-clean-simple.sql` - Updated simplified schema
- `fix-attendance-status-column.sql` - Migration script
- `apply-migration.js` - Verification script

## What This Column Does
The `attendance_status` column tracks whether a user attended their therapy session:
- `'present'` - User attended the full session
- `'absent'` - User missed the session entirely  
- `'partial'` - User attended part of the session

This is required for the therapeutic integration service to properly schedule and track therapy sessions.