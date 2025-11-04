CREATE TABLE [dbo].[life_cycle] (
    [life_cycle_cd]   VARCHAR (20) NOT NULL,
    [life_cycle_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_life_cycle] PRIMARY KEY CLUSTERED ([life_cycle_cd] ASC)
);


GO


create trigger tr_life_cycle_delete_insert_update_MemTable
on life_cycle
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
where szTableName = 'life_cycle'

GO

