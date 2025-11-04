CREATE TABLE [dbo].[meta_control_instance] (
    [instance_id]    INT           NOT NULL,
    [field_type_id]  INT           NULL,
    [control_usage]  INT           NULL,
    [dialog_or_view] VARCHAR (255) NULL,
    [panel_name]     VARCHAR (255) NULL,
    [path]           VARCHAR (255) NULL,
    [control_name]   VARCHAR (255) NULL,
    [label_text]     VARCHAR (255) NULL,
    [disable]        BIT           NOT NULL,
    [hide]           BIT           NOT NULL,
    CONSTRAINT [CPK_meta_control_instance] PRIMARY KEY CLUSTERED ([instance_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_meta_control_instance_control_usage] FOREIGN KEY ([control_usage]) REFERENCES [dbo].[meta_control_usage] ([control_usage_id]),
    CONSTRAINT [CFK_meta_control_instance_field_type_id] FOREIGN KEY ([field_type_id]) REFERENCES [dbo].[meta_field_type] ([field_type_id])
);


GO




create trigger tr_meta_control_instance_delete_insert_update_MemTable
on meta_control_instance
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
where szTableName = 'meta_control_instance'

GO

