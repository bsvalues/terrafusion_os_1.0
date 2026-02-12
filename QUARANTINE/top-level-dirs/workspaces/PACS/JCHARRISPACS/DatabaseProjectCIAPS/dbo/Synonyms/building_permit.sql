CREATE SYNONYM [dbo].[building_permit] FOR [pacs_oltp].[dbo].[building_permit];


GO

sqlcmd -S . -E -i "c:\Users\bsval\OneDrive - Benton County\LocalCIAPS\Database\Scripts\01_CreateDatabase.sql"
sqlcmd -S . -E -i "c:\Users\bsval\OneDrive - Benton County\LocalCIAPS\Database\Scripts\02_CreateStoredProcedures.sql"
