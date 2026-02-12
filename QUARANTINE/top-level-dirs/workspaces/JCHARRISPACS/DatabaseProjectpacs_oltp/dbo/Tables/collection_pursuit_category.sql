CREATE TABLE [dbo].[collection_pursuit_category] (
    [pursuit_category_code]        VARCHAR (10) NOT NULL,
    [pursuit_category_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_collection_pursuit_category] PRIMARY KEY CLUSTERED ([pursuit_category_code] ASC)
);


GO


create trigger tr_collection_pursuit_category_delete_insert_update_MemTable
on collection_pursuit_category
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
where szTableName = 'collection_pursuit_category'

GO

