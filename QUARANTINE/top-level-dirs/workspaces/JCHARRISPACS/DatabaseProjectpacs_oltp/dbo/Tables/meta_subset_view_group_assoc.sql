CREATE TABLE [dbo].[meta_subset_view_group_assoc] (
    [meta_subset_view_group_id] INT           NOT NULL,
    [control_type]              VARCHAR (255) NOT NULL,
    [control_name]              VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_subset_view_group_assoc] PRIMARY KEY CLUSTERED ([meta_subset_view_group_id] ASC, [control_type] ASC, [control_name] ASC)
);


GO




create trigger tr_meta_subset_view_group_assoc_delete_insert_update_MemTable
on meta_subset_view_group_assoc
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

