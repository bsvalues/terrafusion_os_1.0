CREATE TABLE [dbo].[cycle] (
    [cycle_id] INT NOT NULL,
    CONSTRAINT [CPK_cycle] PRIMARY KEY CLUSTERED ([cycle_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_cycle_delete_insert_update_MemTable
on cycle
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
where szTableName = 'cycle'

GO

