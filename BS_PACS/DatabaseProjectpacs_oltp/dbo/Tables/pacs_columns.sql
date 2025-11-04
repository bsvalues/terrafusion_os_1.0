CREATE TABLE [dbo].[pacs_columns] (
    [iColumnID]    SMALLINT      IDENTITY (1, 1) NOT NULL,
    [szColumnName] VARCHAR (128) NOT NULL,
    CONSTRAINT [CPK_pacs_columns] PRIMARY KEY CLUSTERED ([iColumnID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CUQ_pacs_columns_szColumnName] UNIQUE NONCLUSTERED ([szColumnName] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_pacs_columns_delete_insert_update_MemTable
on pacs_columns
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
where szTableName = 'pacs_columns'

GO

