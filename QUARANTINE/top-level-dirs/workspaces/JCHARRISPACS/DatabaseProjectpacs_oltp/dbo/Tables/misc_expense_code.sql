CREATE TABLE [dbo].[misc_expense_code] (
    [misc_expense_cd]   VARCHAR (10) NOT NULL,
    [misc_expense_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_misc_expense_code] PRIMARY KEY CLUSTERED ([misc_expense_cd] ASC)
);


GO


create trigger tr_misc_expense_code_delete_insert_update_MemTable
on misc_expense_code
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
where szTableName = 'misc_expense_code'

GO

