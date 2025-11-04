CREATE TABLE [dbo].[pp_waiver_status] (
    [code]        VARCHAR (5)  NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    [code_type]   INT          NOT NULL,
    [sys_flag]    VARCHAR (1)  NULL,
    CONSTRAINT [CPK_pp_waiver_status] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_pp_waiver_status_delete_insert_update_MemTable
on pp_waiver_status
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
where szTableName = 'pp_waiver_status'

GO

