CREATE TABLE [dbo].[core_object_type] (
    [core_object_type_cd]   VARCHAR (20)  NOT NULL,
    [core_object_type_desc] VARCHAR (100) NULL,
    CONSTRAINT [CPK_core_object_type] PRIMARY KEY CLUSTERED ([core_object_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_core_object_type_delete_insert_update_MemTable
on core_object_type
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
where szTableName = 'core_object_type'

GO

