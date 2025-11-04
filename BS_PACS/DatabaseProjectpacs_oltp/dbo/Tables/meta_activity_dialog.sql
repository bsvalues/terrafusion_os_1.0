CREATE TABLE [dbo].[meta_activity_dialog] (
    [dialog_id] INT           IDENTITY (1, 1) NOT NULL,
    [name]      VARCHAR (255) NOT NULL,
    [dialog]    VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_activity_dialog] PRIMARY KEY CLUSTERED ([dialog_id] ASC, [name] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_meta_activity_dialog_delete_insert_update_MemTable
on meta_activity_dialog
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
where szTableName = 'meta_activity_dialog'

GO

