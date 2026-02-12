CREATE TABLE [dbo].[meta_user_field] (
    [table_name]   VARCHAR (128) NOT NULL,
    [field_name]   VARCHAR (128) NOT NULL,
    [display_name] VARCHAR (128) NULL,
    [field_type]   VARCHAR (128) NULL,
    CONSTRAINT [CPK_meta_user_field] PRIMARY KEY CLUSTERED ([table_name] ASC, [field_name] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_meta_user_field_delete_insert_update_MemTable
on meta_user_field
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
where szTableName = 'meta_user_field'

GO

