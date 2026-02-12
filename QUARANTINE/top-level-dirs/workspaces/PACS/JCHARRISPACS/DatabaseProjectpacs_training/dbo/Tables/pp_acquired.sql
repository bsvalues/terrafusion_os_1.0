CREATE TABLE [dbo].[pp_acquired] (
    [code]        VARCHAR (5)  NOT NULL,
    [description] VARCHAR (50) NULL,
    [sys_flag]    CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_acquired] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_pp_acquired_delete_insert_update_MemTable
on pp_acquired
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
where szTableName = 'pp_acquired'

GO

