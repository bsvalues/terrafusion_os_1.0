CREATE TABLE [dbo].[taxserver] (
    [taxserver_id] INT      NOT NULL,
    [taxserver_cd] CHAR (5) NULL,
    CONSTRAINT [CPK_taxserver] PRIMARY KEY CLUSTERED ([taxserver_id] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_taxserver_delete_insert_update_MemTable
on taxserver
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
where szTableName = 'taxserver'

GO

