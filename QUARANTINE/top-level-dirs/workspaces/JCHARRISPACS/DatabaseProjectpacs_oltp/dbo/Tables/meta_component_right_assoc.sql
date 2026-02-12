CREATE TABLE [dbo].[meta_component_right_assoc] (
    [component_id]   INT NOT NULL,
    [component_type] INT NOT NULL,
    [right_id]       INT NOT NULL,
    CONSTRAINT [CPK_meta_component_right_assoc] PRIMARY KEY CLUSTERED ([component_id] ASC, [component_type] ASC, [right_id] ASC)
);


GO


create trigger tr_meta_component_right_assoc_delete_insert_update_MemTable
on meta_component_right_assoc
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
where szTableName = 'meta_component_right_assoc'

GO

