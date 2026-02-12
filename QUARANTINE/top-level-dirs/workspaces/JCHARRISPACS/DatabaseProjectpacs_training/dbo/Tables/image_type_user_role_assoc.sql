CREATE TABLE [dbo].[image_type_user_role_assoc] (
    [image_type] CHAR (10) NOT NULL,
    [role_type]  TINYINT   NOT NULL,
    CONSTRAINT [CPK_image_type_user_role_assoc] PRIMARY KEY CLUSTERED ([image_type] ASC, [role_type] ASC),
    CONSTRAINT [CFK_image_type_user_role_assoc_image_type] FOREIGN KEY ([image_type]) REFERENCES [dbo].[image_type] ([image_type])
);


GO


create trigger tr_image_type_user_role_assoc_delete_insert_update_MemTable
on image_type_user_role_assoc
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
where szTableName = 'image_type_user_role_assoc'

GO

