CREATE TABLE [dbo].[query_builder_tbl] (
    [szTable]         VARCHAR (127) NOT NULL,
    [szHumanLanguage] VARCHAR (255) NOT NULL,
    [szAlias]         VARCHAR (15)  NOT NULL,
    [bSingleRow]      BIT           CONSTRAINT [CDF_query_builder_tbl_bSingleRow] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_query_builder_tbl] PRIMARY KEY CLUSTERED ([szTable] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CUQ_query_builder_tbl_szAlias] UNIQUE NONCLUSTERED ([szAlias] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_query_builder_tbl_delete_insert_update_MemTable
on query_builder_tbl
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
where szTableName = 'query_builder_tbl'

GO

