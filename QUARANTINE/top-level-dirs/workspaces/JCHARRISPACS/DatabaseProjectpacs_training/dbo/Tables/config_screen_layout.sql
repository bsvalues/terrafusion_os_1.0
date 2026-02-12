CREATE TABLE [dbo].[config_screen_layout] (
    [screen_name]   VARCHAR (63)  NOT NULL,
    [table_name]    VARCHAR (127) NOT NULL,
    [column_name]   VARCHAR (127) NOT NULL,
    [display_order] INT           NOT NULL,
    CONSTRAINT [CPK_config_screen_layout] PRIMARY KEY CLUSTERED ([screen_name] ASC, [table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_config_screen_layout_delete_insert_update_MemTable
on config_screen_layout
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
where szTableName = 'config_screen_layout'

GO

