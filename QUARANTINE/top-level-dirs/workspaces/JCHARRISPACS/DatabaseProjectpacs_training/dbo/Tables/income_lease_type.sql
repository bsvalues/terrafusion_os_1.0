CREATE TABLE [dbo].[income_lease_type] (
    [lease_type_cd]   VARCHAR (10) NOT NULL,
    [lease_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_income_lease_type] PRIMARY KEY CLUSTERED ([lease_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_income_lease_type_delete_insert_update_MemTable
on income_lease_type
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
where szTableName = 'income_lease_type'

GO

