CREATE TABLE [dbo].[supp_status] (
    [status_cd]   CHAR (5)     NOT NULL,
    [status_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_supp_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_supp_status_delete_insert_update_MemTable
on supp_status
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
where szTableName = 'supp_status'

GO

