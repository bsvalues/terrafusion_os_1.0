CREATE TABLE [dbo].[meta_object_type] (
    [object_type_id] INT           IDENTITY (1, 1) NOT NULL,
    [type]           NVARCHAR (5)  NOT NULL,
    [name]           NVARCHAR (50) NOT NULL,
    [description]    NVARCHAR (50) NULL,
    CONSTRAINT [CPK_meta_object_type] PRIMARY KEY CLUSTERED ([object_type_id] ASC)
);


GO


create trigger [dbo].[tr_meta_object_type_delete_insert_update_MemTable]
on [dbo].[meta_object_type]
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
where szTableName = 'meta_object_type'

GO

