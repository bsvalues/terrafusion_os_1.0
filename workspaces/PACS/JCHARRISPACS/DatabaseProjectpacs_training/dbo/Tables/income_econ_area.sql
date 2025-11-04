CREATE TABLE [dbo].[income_econ_area] (
    [econ_cd]   VARCHAR (10) NOT NULL,
    [econ_desc] CHAR (20)    NULL,
    CONSTRAINT [CPK_income_econ_area] PRIMARY KEY CLUSTERED ([econ_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_income_econ_area_delete_insert_update_MemTable
on income_econ_area
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
where szTableName = 'income_econ_area'

GO

