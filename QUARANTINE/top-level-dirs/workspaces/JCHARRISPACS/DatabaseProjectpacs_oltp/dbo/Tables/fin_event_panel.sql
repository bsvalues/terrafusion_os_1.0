CREATE TABLE [dbo].[fin_event_panel] (
    [event_panel_cd]          VARCHAR (10) NOT NULL,
    [event_panel_description] VARCHAR (50) NOT NULL,
    [assoc_table_name]        VARCHAR (50) NULL,
    [core_object_type_cd]     VARCHAR (20) NULL,
    CONSTRAINT [CPK_fin_event_panel] PRIMARY KEY CLUSTERED ([event_panel_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fin_event_panel_core_object_type_cd] FOREIGN KEY ([core_object_type_cd]) REFERENCES [dbo].[core_object_type] ([core_object_type_cd])
);


GO


create trigger tr_fin_event_panel_delete_insert_update_MemTable
on fin_event_panel
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
where szTableName = 'fin_event_panel'

GO

