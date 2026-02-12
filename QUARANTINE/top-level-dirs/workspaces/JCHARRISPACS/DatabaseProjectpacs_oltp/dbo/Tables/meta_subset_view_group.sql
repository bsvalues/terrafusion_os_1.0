CREATE TABLE [dbo].[meta_subset_view_group] (
    [meta_subset_view_group_id] INT           NOT NULL,
    [type]                      VARCHAR (255) NOT NULL,
    [group_name]                VARCHAR (50)  NOT NULL,
    [object_type]               INT           CONSTRAINT [CDF_meta_subset_view_group_object_type] DEFAULT ((-1)) NOT NULL,
    [sub_type]                  INT           CONSTRAINT [CDF_meta_subset_view_group_sub_type] DEFAULT ((-1)) NOT NULL,
    [role]                      INT           CONSTRAINT [CDF_meta_subset_view_group_role] DEFAULT ((-1)) NOT NULL,
    [role_type]                 INT           CONSTRAINT [CDF_meta_subset_view_group_role_type] DEFAULT ((-1)) NOT NULL,
    [workflow]                  INT           CONSTRAINT [CDF_meta_subset_view_group_workflow] DEFAULT ((-1)) NOT NULL,
    [activity]                  INT           CONSTRAINT [CDF_meta_subset_view_group_activity] DEFAULT ((-1)) NOT NULL,
    [group_description]         VARCHAR (255) NULL,
    [system]                    BIT           DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_meta_subset_view_group] PRIMARY KEY CLUSTERED ([meta_subset_view_group_id] ASC, [type] ASC, [group_name] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC)
);


GO




create trigger tr_meta_subset_view_group_delete_insert_update_MemTable
on meta_subset_view_group
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
where szTableName = 'meta_subset_view_group'

GO

