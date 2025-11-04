CREATE TABLE [dbo].[query_builder_tblcfk] (
    [lForeignKeyID] INT           NOT NULL,
    [szFTable]      VARCHAR (127) NOT NULL,
    [szRTable]      VARCHAR (127) NOT NULL,
    CONSTRAINT [CPK_query_builder_tblcfk] PRIMARY KEY CLUSTERED ([lForeignKeyID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_tblcfk_szFTable] FOREIGN KEY ([szFTable]) REFERENCES [dbo].[query_builder_tbl] ([szTable]),
    CONSTRAINT [CFK_query_builder_tblcfk_szRTable] FOREIGN KEY ([szRTable]) REFERENCES [dbo].[query_builder_tbl] ([szTable])
);


GO



create trigger tr_query_builder_tblcfk_delete_insert_update_MemTable
on query_builder_tblcfk
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
where szTableName = 'query_builder_tblcfk'

GO

