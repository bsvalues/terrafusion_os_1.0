CREATE TABLE [dbo].[pp_condition] (
    [pp_condition_cd]   VARCHAR (10) NOT NULL,
    [pp_condition_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_condition] PRIMARY KEY CLUSTERED ([pp_condition_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_pp_condition_delete_insert_update_MemTable
on pp_condition
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
where szTableName = 'pp_condition'

GO

