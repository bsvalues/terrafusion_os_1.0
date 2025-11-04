CREATE TABLE [dbo].[query_builder_element_type] (
    [lElementType]  INT          NOT NULL,
    [szElementType] VARCHAR (23) NOT NULL,
    CONSTRAINT [CPK_query_builder_element_type] PRIMARY KEY CLUSTERED ([lElementType] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_query_builder_element_type_lElementType] CHECK ([lElementType] > 0)
);


GO



create trigger tr_query_builder_element_type_delete_insert_update_MemTable
on query_builder_element_type
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
where szTableName = 'query_builder_element_type'

GO

