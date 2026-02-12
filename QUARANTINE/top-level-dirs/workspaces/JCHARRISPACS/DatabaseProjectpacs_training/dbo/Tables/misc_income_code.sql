CREATE TABLE [dbo].[misc_income_code] (
    [misc_income_cd]   VARCHAR (10) NOT NULL,
    [misc_income_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_misc_income_code] PRIMARY KEY CLUSTERED ([misc_income_cd] ASC)
);


GO


create trigger tr_misc_income_code_delete_insert_update_MemTable
on misc_income_code
for delete, insert, update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'misc_income_code'

GO

