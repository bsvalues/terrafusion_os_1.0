CREATE TABLE [dbo].[income_prop_type] (
    [prop_type_cd]   VARCHAR (10) NOT NULL,
    [prop_type_desc] CHAR (20)    NULL,
    CONSTRAINT [CPK_income_prop_type] PRIMARY KEY CLUSTERED ([prop_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_income_prop_type_delete_insert_update_MemTable
on income_prop_type
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
where szTableName = 'income_prop_type'

GO

