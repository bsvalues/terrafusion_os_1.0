SET NOCOUNT ON;

/*
Exports column-level metadata, including extended properties when present.
Output is pipe-delimited for easy PS parsing.
*/

WITH cols AS (
    SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        c.column_id,
        c.name AS column_name,
        ty.name AS data_type,
        c.max_length,
        c.is_nullable,
        c.is_computed,
        dc.definition AS default_definition
    FROM sys.tables t
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    JOIN sys.columns c ON c.object_id = t.object_id
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = t.object_id AND dc.parent_column_id = c.column_id
    WHERE t.is_ms_shipped = 0
)
SELECT 
    schema_name + '|' +
    table_name + '|' +
    column_name + '|' +
    data_type + '|' +
    CAST(max_length AS VARCHAR(10)) + '|' +
    CASE WHEN is_nullable = 1 THEN 'YES' ELSE 'NO' END + '|' +
    CASE WHEN is_computed = 1 THEN 'YES' ELSE 'NO' END + '|' +
    ISNULL(REPLACE(REPLACE(REPLACE(default_definition, CHAR(10), ' '), CHAR(13), ' '), '|', '/'), '') + '|' +
    ISNULL(CAST(ep.name AS NVARCHAR(128)), '') + '|' +
    ISNULL(CAST(ep.value AS NVARCHAR(4000)), '') AS line
FROM cols
LEFT JOIN sys.extended_properties ep
    ON ep.major_id = OBJECT_ID(QUOTENAME(schema_name) + '.' + QUOTENAME(table_name))
   AND ep.minor_id = column_id
   AND ep.class = 1
ORDER BY schema_name, table_name, column_id, ep.name;
