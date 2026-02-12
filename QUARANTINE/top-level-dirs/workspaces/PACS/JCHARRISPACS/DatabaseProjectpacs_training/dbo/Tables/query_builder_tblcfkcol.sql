CREATE TABLE [dbo].[query_builder_tblcfkcol] (
    [lForeignKeyID] INT           NOT NULL,
    [szFColumn]     VARCHAR (127) NOT NULL,
    [szRColumn]     VARCHAR (127) NOT NULL,
    CONSTRAINT [CPK_query_builder_tblcfkcol] PRIMARY KEY CLUSTERED ([lForeignKeyID] ASC, [szFColumn] ASC, [szRColumn] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_tblcfkcol_lForeignKeyID] FOREIGN KEY ([lForeignKeyID]) REFERENCES [dbo].[query_builder_tblcfk] ([lForeignKeyID]) ON DELETE CASCADE
);


GO



create trigger tr_query_builder_tblcfkcol_delete_insert_update_MemTable
on query_builder_tblcfkcol
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
where szTableName = 'query_builder_tblcfkcol'

GO

