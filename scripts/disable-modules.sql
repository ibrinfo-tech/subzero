-- SQL script to disable modules that have been removed from the project
-- Run this script to set is_active = false for Students, Notes, Projects, and Tasks modules

UPDATE modules 
SET is_active = false, 
    updated_at = NOW()
WHERE code IN ('students', 'notes', 'projects', 'tasks')
  AND is_active = true;

-- Verify the update
SELECT id, name, code, is_active, updated_at 
FROM modules 
WHERE code IN ('students', 'notes', 'projects', 'tasks')
ORDER BY code;

