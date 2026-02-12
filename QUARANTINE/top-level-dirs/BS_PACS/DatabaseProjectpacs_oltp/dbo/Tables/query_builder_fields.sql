CREATE TABLE [dbo].[query_builder_fields] (
    [lFieldID]             INT           NOT NULL,
    [lUniqueColumnID]      INT           NOT NULL,
    [bFieldRoot]           BIT           NOT NULL,
    [szName]               VARCHAR (127) NOT NULL,
    [szCategory]           VARCHAR (500) NOT NULL,
    [szSubCategory]        VARCHAR (500) NULL,
    [szFieldDescription]   VARCHAR (500) NOT NULL,
    [szSampleData]         VARCHAR (255) NULL,
    [bExcludeDeletedProps] BIT           NULL,
    [bIncludeParentProps]  BIT           NULL,
    [szSubCategory2]       VARCHAR (500) NULL,
    CONSTRAINT [CPK_query_builder_fields] PRIMARY KEY CLUSTERED ([lFieldID] ASC, [lUniqueColumnID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_query_builder_fields_lUniqueColumnID] FOREIGN KEY ([lUniqueColumnID]) REFERENCES [dbo].[query_builder_tblcol] ([lUniqueColumnID]) ON DELETE CASCADE
);


GO


create trigger tr_query_builder_fields_delete_insert_update_MemTable
on query_builder_fields
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
where szTableName = 'query_builder_fields'

GO

