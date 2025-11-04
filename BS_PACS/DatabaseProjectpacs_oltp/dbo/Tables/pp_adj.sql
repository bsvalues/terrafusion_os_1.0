CREATE TABLE [dbo].[pp_adj] (
    [pp_adj_cd]    CHAR (5)       NOT NULL,
    [pp_adj_desc]  VARCHAR (50)   NULL,
    [pp_adj_usage] VARCHAR (5)    NULL,
    [pp_adj_amt]   NUMERIC (10)   NULL,
    [pp_adj_pct]   NUMERIC (5, 2) NULL,
    [sys_flag]     CHAR (1)       NULL,
    CONSTRAINT [CPK_pp_adj] PRIMARY KEY CLUSTERED ([pp_adj_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_pp_adj_delete_insert_update_MemTable
on pp_adj
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
where szTableName = 'pp_adj'

GO

