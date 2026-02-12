CREATE TABLE [dbo].[litigation_bankruptcy_status] (
    [bankruptcy_status_cd]   VARCHAR (10) NOT NULL,
    [bankruptcy_status_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_litigation_bankruptcy_status] PRIMARY KEY CLUSTERED ([bankruptcy_status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_litigation_bankruptcy_status_delete_insert_update_MemTable
on litigation_bankruptcy_status
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
where szTableName = 'litigation_bankruptcy_status'

GO

