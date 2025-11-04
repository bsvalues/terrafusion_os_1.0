CREATE TABLE [dbo].[mass_update_reason] (
    [reason_cd]   VARCHAR (10) NOT NULL,
    [reason_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_mass_update_reason] PRIMARY KEY CLUSTERED ([reason_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_mass_update_reason_delete_insert_update_MemTable
on mass_update_reason
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
where szTableName = 'mass_update_reason'

GO

