CREATE TABLE [dbo].[meta_records_object_type] (
    [records_uid]  VARCHAR (23)  NOT NULL,
    [records_name] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_records_object_type] PRIMARY KEY CLUSTERED ([records_uid] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_meta_records_object_type_delete_insert_update_MemTable
on meta_records_object_type
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
where szTableName = 'meta_records_object_type'

GO

