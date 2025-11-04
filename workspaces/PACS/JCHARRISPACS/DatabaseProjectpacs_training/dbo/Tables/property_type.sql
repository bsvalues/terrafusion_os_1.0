CREATE TABLE [dbo].[property_type] (
    [prop_type_cd]   CHAR (5)     NOT NULL,
    [prop_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_property_type] PRIMARY KEY CLUSTERED ([prop_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_property_type_delete_insert_update_MemTable
on property_type
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
where szTableName = 'property_type'

GO

