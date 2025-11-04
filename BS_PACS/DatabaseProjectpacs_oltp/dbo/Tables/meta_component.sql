CREATE TABLE [dbo].[meta_component] (
    [component_id]   INT NOT NULL,
    [component_type] INT NOT NULL,
    [component_verb] INT NOT NULL,
    CONSTRAINT [CPK_meta_component] PRIMARY KEY CLUSTERED ([component_id] ASC)
);


GO


create trigger tr_meta_component_delete_insert_update_MemTable
on meta_component
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
where szTableName = 'meta_component'

GO

