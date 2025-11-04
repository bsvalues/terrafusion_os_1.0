CREATE TABLE [dbo].[meta_sub_type] (
    [sub_type_id]    INT           IDENTITY (1, 1) NOT NULL,
    [object_type_id] INT           NOT NULL,
    [sub_type]       NVARCHAR (5)  NOT NULL,
    [name]           NVARCHAR (50) NOT NULL,
    [description]    NVARCHAR (50) NULL,
    CONSTRAINT [CPK_meta_sub_type] PRIMARY KEY CLUSTERED ([sub_type_id] ASC),
    CONSTRAINT [CFK_meta_sub_type_object_type_id] FOREIGN KEY ([object_type_id]) REFERENCES [dbo].[meta_object_type] ([object_type_id])
);


GO


create trigger [dbo].[tr_meta_sub_type_delete_insert_update_MemTable]
on [dbo].[meta_sub_type]
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
where szTableName = 'meta_sub_type'

GO

