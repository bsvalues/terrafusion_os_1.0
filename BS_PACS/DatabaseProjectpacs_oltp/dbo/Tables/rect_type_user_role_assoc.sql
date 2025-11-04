CREATE TABLE [dbo].[rect_type_user_role_assoc] (
    [image_type] CHAR (10) NOT NULL,
    [rect_type]  CHAR (10) NOT NULL,
    [role_type]  TINYINT   NOT NULL,
    CONSTRAINT [CPK_rect_type_user_role_assoc] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC, [role_type] ASC),
    CONSTRAINT [CFK_rect_type_user_role_assoc_image_type_rect_type] FOREIGN KEY ([image_type], [rect_type]) REFERENCES [dbo].[rect_type] ([image_type], [rect_type])
);


GO


create trigger tr_rect_type_user_role_assoc_delete_insert_update_MemTable
on rect_type_user_role_assoc
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
where szTableName = 'rect_type_user_role_assoc'

GO

