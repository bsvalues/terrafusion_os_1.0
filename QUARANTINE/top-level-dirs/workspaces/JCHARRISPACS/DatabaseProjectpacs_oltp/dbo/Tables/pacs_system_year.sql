CREATE TABLE [dbo].[pacs_system_year] (
    [pacs_yr]            NUMERIC (4) NOT NULL,
    [depreciation_yr]    NUMERIC (4) NULL,
    [pp_depreciation_yr] NUMERIC (4) NULL,
    CONSTRAINT [CPK_pacs_system_year] PRIMARY KEY CLUSTERED ([pacs_yr] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pacs_system_year_delete_insert_update_MemTable
on pacs_system_year
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
where szTableName = 'pacs_system_year'

GO

