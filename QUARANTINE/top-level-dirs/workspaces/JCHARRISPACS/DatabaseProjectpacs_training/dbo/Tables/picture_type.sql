CREATE TABLE [dbo].[picture_type] (
    [picture_type] CHAR (5)     NOT NULL,
    [picture_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_picture_type] PRIMARY KEY CLUSTERED ([picture_type] ASC)
);


GO


create trigger tr_picture_type_delete_insert_update_MemTable
on picture_type
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
where szTableName = 'picture_type'

GO

