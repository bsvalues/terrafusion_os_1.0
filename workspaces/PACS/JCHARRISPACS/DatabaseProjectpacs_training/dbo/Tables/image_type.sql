CREATE TABLE [dbo].[image_type] (
    [image_type]         CHAR (10)    NOT NULL,
    [image_desc]         VARCHAR (50) NULL,
    [picture_type]       CHAR (5)     NOT NULL,
    [scanned_user_right] CHAR (1)     NULL,
    [photo_user_right]   CHAR (1)     NULL,
    CONSTRAINT [CPK_image_type] PRIMARY KEY CLUSTERED ([image_type] ASC),
    CONSTRAINT [CFK_image_type_picture_type] FOREIGN KEY ([picture_type]) REFERENCES [dbo].[picture_type] ([picture_type])
);


GO


create trigger tr_image_type_delete_insert_update_MemTable
on image_type
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
where szTableName = 'image_type'

GO

