CREATE TABLE [dbo].[sub_type_user_role_assoc] (
    [image_type] CHAR (10) NOT NULL,
    [rect_type]  CHAR (10) NOT NULL,
    [sub_type]   CHAR (10) NOT NULL,
    [role_type]  INT       NOT NULL,
    [role_id]    INT       NOT NULL,
    CONSTRAINT [CPK_sub_type_user_role_assoc] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC, [sub_type] ASC, [role_type] ASC, [role_id] ASC),
    CONSTRAINT [CFK_sub_type_user_role_assoc_image_type_rect_type_sub_type] FOREIGN KEY ([image_type], [rect_type], [sub_type]) REFERENCES [dbo].[sub_type] ([image_type], [rect_type], [sub_type])
);


GO


create trigger tr_sub_type_user_role_assoc_delete_insert_update_MemTable
on sub_type_user_role_assoc
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
where szTableName = 'sub_type_user_role_assoc'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Associates an image sub type with user role', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sub_type_user_role_assoc';


GO

