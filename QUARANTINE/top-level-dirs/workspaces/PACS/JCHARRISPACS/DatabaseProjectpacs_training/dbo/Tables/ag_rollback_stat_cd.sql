CREATE TABLE [dbo].[ag_rollback_stat_cd] (
    [status_cd]   CHAR (5)  NOT NULL,
    [status_desc] CHAR (50) NOT NULL,
    [sys_flag]    CHAR (1)  NULL,
    CONSTRAINT [CPK_ag_rollback_stat_cd] PRIMARY KEY CLUSTERED ([status_cd] ASC)
);


GO


create trigger tr_ag_rollback_stat_cd_delete_insert_update_MemTable
on ag_rollback_stat_cd
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
where szTableName = 'ag_rollback_stat_cd'

GO

