CREATE TABLE [dbo].[condo_maintenance] (
    [maintenance_cd]   VARCHAR (10) NOT NULL,
    [maintenance_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_maintenance] PRIMARY KEY CLUSTERED ([maintenance_cd] ASC)
);


GO


create trigger tr_condo_maintenance_delete_insert_update_MemTable
on condo_maintenance
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
where szTableName = 'condo_maintenance'

GO

