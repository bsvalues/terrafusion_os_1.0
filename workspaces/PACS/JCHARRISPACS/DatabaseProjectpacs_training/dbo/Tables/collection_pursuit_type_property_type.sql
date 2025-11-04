CREATE TABLE [dbo].[collection_pursuit_type_property_type] (
    [pursuit_type_code] VARCHAR (10) NOT NULL,
    [prop_type_cd]      CHAR (5)     NOT NULL,
    CONSTRAINT [CPK_collection_pursuit_type_property_type] PRIMARY KEY CLUSTERED ([pursuit_type_code] ASC, [prop_type_cd] ASC),
    CONSTRAINT [CFK_collection_pursuit_type_property_type_collection_pursuit_type] FOREIGN KEY ([pursuit_type_code]) REFERENCES [dbo].[collection_pursuit_type] ([pursuit_type_code]),
    CONSTRAINT [CFK_collection_pursuit_type_property_type_property_type] FOREIGN KEY ([prop_type_cd]) REFERENCES [dbo].[property_type] ([prop_type_cd])
);


GO


create trigger tr_collection_pursuit_type_property_type_delete_insert_update_MemTable
on collection_pursuit_type_property_type
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
where szTableName = 'collection_pursuit_type_property_type'

GO

