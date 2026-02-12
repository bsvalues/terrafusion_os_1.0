CREATE TABLE [dbo].[meta_object_view_panel] (
    [meta_object_view_id] INT           NOT NULL,
    [object_type]         INT           NOT NULL,
    [sub_type]            INT           NOT NULL,
    [role_type]           INT           NOT NULL,
    [role]                INT           NOT NULL,
    [workflow]            INT           NOT NULL,
    [activity]            INT           NOT NULL,
    [panel]               VARCHAR (255) NOT NULL,
    [caption]             VARCHAR (255) NOT NULL,
    [primary]             BIT           NOT NULL,
    [row]                 INT           NOT NULL,
    [system]              BIT           NOT NULL,
    CONSTRAINT [CPK_meta_object_view_panel] PRIMARY KEY CLUSTERED ([meta_object_view_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC, [panel] ASC),
    CONSTRAINT [CFK_meta_object_view_panel_meta_object_view_publication] FOREIGN KEY ([meta_object_view_id], [object_type], [sub_type], [role], [role_type], [workflow], [activity]) REFERENCES [dbo].[meta_object_view_publication] ([meta_object_view_id], [object_type], [sub_type], [role], [role_type], [workflow], [activity]) ON DELETE CASCADE
);


GO


create trigger tr_meta_object_view_panel_delete_insert_update_MemTable
on meta_object_view_panel
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
where szTableName = 'meta_object_view_panel'

GO

