CREATE PROCEDURE [dbo].[PACSBackupTable]

--J3 Usage Format Example:  exec pacsbackuptable pacs_config
--This stored procedure will check for a backup table database and create one if needed.  
--The table backup copy will append the date and time of the system for reference:  pacs_config_20220802_1300

@tableFrom   SYSNAME
AS
DECLARE @sql NVARCHAR(MAX)
DECLARE @destination NVARCHAR(MAX)
SET @destination = 'New Backup Table Name:  pacs_backup_tables.dbo.' + @tableFrom + '_' + (SELECT CONVERT(VARCHAR(8), GETDATE(), 112) + '_' + REPLACE(LEFT(CAST(GETDATE() AS TIME), 5), ':', ''))+''
SET @sql = 'SELECT * INTO pacs_backup_tables.dbo.' + @tableFrom + '_' + (SELECT CONVERT(VARCHAR(8), GETDATE(), 112) + '_' + REPLACE(LEFT(CAST(GETDATE() AS TIME), 5), ':', ''))+'
            FROM ' + @tableFrom

IF EXISTS 
   (
    SELECT name FROM master.dbo.sysdatabases 
    WHERE name = N'pacs_backup_tables'
    )
BEGIN
	PRINT ''
    PRINT 'Backup Table Database Exists:  pacs_backup_tables'
END
ELSE
BEGIN
    CREATE DATABASE [pacs_backup_tables]
	PRINT ''
    PRINT 'Database Created:  pacs_backup_tables'
END

PRINT @destination

EXEC sp_executesql @sql

GO

