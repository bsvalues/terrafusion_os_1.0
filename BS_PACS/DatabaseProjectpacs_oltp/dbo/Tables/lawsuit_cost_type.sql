CREATE TABLE [dbo].[lawsuit_cost_type] (
    [cost_cd]   CHAR (5)  NOT NULL,
    [cost_desc] CHAR (20) NULL,
    CONSTRAINT [CPK_lawsuit_cost_type] PRIMARY KEY CLUSTERED ([cost_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_lawsuit_cost_type_delete_insert_update_MemTable
on lawsuit_cost_type
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
where szTableName = 'lawsuit_cost_type'

GO

