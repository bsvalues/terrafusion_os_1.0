CREATE TABLE [dbo].[meta_category] (
    [category_id] INT           IDENTITY (1, 1) NOT NULL,
    [name]        NVARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_meta_category] PRIMARY KEY CLUSTERED ([category_id] ASC)
);


GO


create trigger [dbo].[tr_meta_category_delete_insert_update_MemTable]
on [dbo].[meta_category]
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
where szTableName = 'meta_category'

GO

