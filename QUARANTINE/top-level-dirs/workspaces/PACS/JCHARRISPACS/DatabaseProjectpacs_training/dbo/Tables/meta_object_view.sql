CREATE TABLE [dbo].[meta_object_view] (
    [meta_object_view_id] INT           IDENTITY (1, 1) NOT NULL,
    [type]                VARCHAR (255) NOT NULL,
    [system]              BIT           NOT NULL,
    CONSTRAINT [CPK_meta_object_view] PRIMARY KEY CLUSTERED ([meta_object_view_id] ASC)
);


GO


create trigger tr_meta_object_view_delete_insert_update_MemTable
on meta_object_view
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
where szTableName = 'meta_object_view'

GO

