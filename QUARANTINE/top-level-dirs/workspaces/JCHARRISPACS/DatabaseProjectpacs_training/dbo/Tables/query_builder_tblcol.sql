CREATE TABLE [dbo].[query_builder_tblcol] (
    [szTable]          VARCHAR (127) NOT NULL,
    [szColumn]         VARCHAR (127) NOT NULL,
    [lUniqueColumnID]  INT           NOT NULL,
    [bKeyColumn]       BIT           NOT NULL,
    [lElementType]     INT           NULL,
    [szJoinOnConstant] VARCHAR (63)  NULL,
    [szHumanLanguage]  VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_query_builder_tblcol] PRIMARY KEY CLUSTERED ([szTable] ASC, [szColumn] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_tblcol_lElementType] FOREIGN KEY ([lElementType]) REFERENCES [dbo].[query_builder_element_type] ([lElementType]),
    CONSTRAINT [CFK_query_builder_tblcol_szTable] FOREIGN KEY ([szTable]) REFERENCES [dbo].[query_builder_tbl] ([szTable]) ON DELETE CASCADE,
    CONSTRAINT [CUQ_query_builder_tblcol_lUniqueColumnID] UNIQUE NONCLUSTERED ([lUniqueColumnID] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_query_builder_tblcol_delete_insert_update_MemTable
on query_builder_tblcol
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
where szTableName = 'query_builder_tblcol'

GO

