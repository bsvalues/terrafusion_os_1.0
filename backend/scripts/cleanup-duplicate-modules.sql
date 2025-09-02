-- TerraFusion OS - Module Deduplication Script
-- Removes duplicate modules keeping the one with the lowest ID

-- Step 1: Show duplicates before cleanup
SELECT name, COUNT(*) as duplicate_count 
FROM Modules 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates keeping the one with minimum ID
DELETE FROM Modules 
WHERE Id NOT IN (
    SELECT MIN(Id) 
    FROM Modules 
    GROUP BY Name
);

-- Step 3: Verify no duplicates remain
SELECT 'Total modules after cleanup: ' || COUNT(*) FROM Modules;
SELECT 'Unique module names: ' || COUNT(DISTINCT Name) FROM Modules;
