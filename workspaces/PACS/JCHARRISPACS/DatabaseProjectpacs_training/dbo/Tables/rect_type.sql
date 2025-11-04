CREATE TABLE [dbo].[rect_type] (
    [image_type]     CHAR (10)    NOT NULL,
    [rect_type]      CHAR (10)    NOT NULL,
    [rect_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_rect_type] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC),
    CONSTRAINT [CFK_rect_type_image_type] FOREIGN KEY ([image_type]) REFERENCES [dbo].[image_type] ([image_type])
);


GO


create trigger tr_rect_type_delete_insert_update_MemTable
on rect_type
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
where szTableName = 'rect_type'

GO

