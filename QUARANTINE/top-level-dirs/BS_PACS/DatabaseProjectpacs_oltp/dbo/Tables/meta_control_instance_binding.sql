CREATE TABLE [dbo].[meta_control_instance_binding] (
    [customization_id]    INT           IDENTITY (1, 1) NOT NULL,
    [container_namespace] VARCHAR (256) NOT NULL,
    [paragraph_type]      VARCHAR (256) NOT NULL,
    [paragraph_depth]     VARCHAR (50)  NOT NULL,
    [label_description]   VARCHAR (50)  NOT NULL,
    [bound_control_type]  VARCHAR (256) NOT NULL,
    [field_binding]       NTEXT         NOT NULL,
    [hotkey]              NTEXT         NULL,
    [validation]          NTEXT         NULL,
    [object_type]         INT           NOT NULL,
    [sub_type]            INT           NOT NULL,
    [role]                INT           NOT NULL,
    [role_type]           INT           NOT NULL,
    [workflow]            INT           NOT NULL,
    [activity]            INT           NOT NULL,
    CONSTRAINT [CPK_meta_control_instance_binding] PRIMARY KEY CLUSTERED ([customization_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC)
);


GO




create trigger tr_meta_control_instance_binding_delete_insert_update_MemTable
on meta_control_instance_binding
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
where szTableName = 'meta_control_instance_binding'

GO

