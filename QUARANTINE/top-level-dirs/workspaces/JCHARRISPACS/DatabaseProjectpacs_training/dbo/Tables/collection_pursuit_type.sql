CREATE TABLE [dbo].[collection_pursuit_type] (
    [pursuit_type_code]             VARCHAR (10) NOT NULL,
    [pursuit_type_description]      VARCHAR (50) NOT NULL,
    [pursuit_category_code]         VARCHAR (10) NOT NULL,
    [exclude_deferral_properties]   BIT          DEFAULT ((0)) NOT NULL,
    [exclude_bankruptcy_properties] BIT          DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_collection_pursuit_type] PRIMARY KEY CLUSTERED ([pursuit_type_code] ASC),
    CONSTRAINT [CFK_collection_pursuit_type_collection_pursuit_category] FOREIGN KEY ([pursuit_category_code]) REFERENCES [dbo].[collection_pursuit_category] ([pursuit_category_code])
);


GO


create trigger tr_collection_pursuit_type_delete_insert_update_MemTable
on collection_pursuit_type
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
where szTableName = 'collection_pursuit_type'

GO

