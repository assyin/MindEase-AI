-- Fix missing attendance_status column in therapy_sessions table
-- This column is required by the application but missing from the current database schema

ALTER TABLE therapy_sessions 
ADD COLUMN attendance_status VARCHAR(20) DEFAULT 'present' 
CHECK (attendance_status IN ('present', 'absent', 'partial'));

-- Add comment to document the column
COMMENT ON COLUMN therapy_sessions.attendance_status IS 'Track whether user attended the session: present, absent, or partial';