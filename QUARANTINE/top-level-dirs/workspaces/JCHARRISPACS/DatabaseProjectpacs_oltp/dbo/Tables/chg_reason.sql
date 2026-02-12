CREATE TABLE [dbo].[chg_reason] (
    [chg_reason_cd]   CHAR (5)     NOT NULL,
    [chg_reason_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_chg_reason] PRIMARY KEY CLUSTERED ([chg_reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_chg_reason_delete_insert_update_MemTable
on chg_reason
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
where szTableName = 'chg_reason'

GO

