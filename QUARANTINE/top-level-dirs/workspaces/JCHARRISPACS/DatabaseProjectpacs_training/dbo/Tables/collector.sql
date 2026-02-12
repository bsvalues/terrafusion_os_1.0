CREATE TABLE [dbo].[collector] (
    [collector_id] INT NOT NULL,
    CONSTRAINT [CPK_collector] PRIMARY KEY CLUSTERED ([collector_id] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_collector_delete_insert_update_MemTable
on collector
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
where szTableName = 'collector'

GO

