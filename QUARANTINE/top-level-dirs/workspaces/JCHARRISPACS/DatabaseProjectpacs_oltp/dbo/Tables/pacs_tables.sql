CREATE TABLE [dbo].[pacs_tables] (
    [iTableID]            SMALLINT      IDENTITY (1, 1) NOT NULL,
    [szTableName]         VARCHAR (128) NOT NULL,
    [lDSSReplicationFlag] INT           CONSTRAINT [CDF_pacs_tables_lDSSReplicationFlag] DEFAULT (0) NOT NULL,
    [lWebReplicationFlag] INT           CONSTRAINT [CDF_pacs_tables_lWebReplicationFlag] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_pacs_tables] PRIMARY KEY CLUSTERED ([iTableID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CUQ_pacs_tables_szTableName] UNIQUE NONCLUSTERED ([szTableName] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_pacs_tables_delete_insert_update_MemTable
on pacs_tables
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
where szTableName = 'pacs_tables'

GO

