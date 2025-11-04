CREATE TABLE [dbo].[pp_qual] (
    [pp_qual_cd]   CHAR (5)     NOT NULL,
    [pp_qual_desc] VARCHAR (50) NULL,
    [sys_flag]     CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_qual] PRIMARY KEY CLUSTERED ([pp_qual_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_pp_qual_delete_insert_update_MemTable
on pp_qual
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
where szTableName = 'pp_qual'

GO

