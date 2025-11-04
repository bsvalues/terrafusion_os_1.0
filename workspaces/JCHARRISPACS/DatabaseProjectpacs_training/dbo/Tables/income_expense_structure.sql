CREATE TABLE [dbo].[income_expense_structure] (
    [expense_structure_cd]   VARCHAR (10) NOT NULL,
    [expense_structure_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_expense_structure] PRIMARY KEY CLUSTERED ([expense_structure_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_income_expense_structure_delete_insert_update_MemTable
on income_expense_structure
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
where szTableName = 'income_expense_structure'

GO

