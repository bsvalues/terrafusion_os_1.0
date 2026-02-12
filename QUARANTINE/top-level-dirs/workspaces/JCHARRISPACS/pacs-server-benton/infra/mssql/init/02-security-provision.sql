-- Basic logins and users for local dev (adjust for real environments)
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = 'pacs_app')
BEGIN
    CREATE LOGIN [pacs_app] WITH PASSWORD = 'P@csAppLocal123!', CHECK_POLICY = OFF;
END

DECLARE @db SYSNAME;
DECLARE @dbs TABLE(name SYSNAME);
INSERT INTO @dbs(name)
VALUES('PACS_Training'), ('TA_AppSvr'), ('CIAPS'), ('Web_Internet_Benton');

DECLARE c CURSOR FOR SELECT name FROM @dbs;
OPEN c; FETCH NEXT FROM c INTO @db;
WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'
    USE ' + QUOTENAME(@db) + N';
    IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = ''pacs_app'')
    BEGIN
        CREATE USER [pacs_app] FOR LOGIN [pacs_app];
        EXEC sp_addrolemember N''db_datareader'', N''pacs_app'';
        EXEC sp_addrolemember N''db_datawriter'', N''pacs_app'';
    END';
    EXEC(@sql);
    FETCH NEXT FROM c INTO @db;
END
CLOSE c; DEALLOCATE c;

-- Minimal execute rights for web procs in Web_Internet_Benton
USE [Web_Internet_Benton];
GRANT EXECUTE TO [pacs_app];

