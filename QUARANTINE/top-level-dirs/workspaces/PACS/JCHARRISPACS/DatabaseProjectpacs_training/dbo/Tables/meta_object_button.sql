CREATE TABLE [dbo].[meta_object_button] (
    [button_id]        INT           IDENTITY (1, 1) NOT NULL,
    [caption]          VARCHAR (255) NOT NULL,
    [parent_button_id] INT           NULL,
    [System]           BIT           CONSTRAINT [CDF_meta_object_button_System] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_meta_object_button] PRIMARY KEY CLUSTERED ([button_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_meta_object_button_delete_insert_update_MemTable
on meta_object_button
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
where szTableName = 'meta_object_button'

GO

