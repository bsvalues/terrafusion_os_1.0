CREATE TABLE [dbo].[penpad_config_update_fields] (
    [table_name] VARCHAR (255) NOT NULL,
    [field_name] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_penpad_config_update_fields] PRIMARY KEY CLUSTERED ([table_name] ASC, [field_name] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_penpad_config_update_fields_delete_insert_update_MemTable
on penpad_config_update_fields
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
where szTableName = 'penpad_config_update_fields'

GO

