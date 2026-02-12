CREATE TABLE [dbo].[pacs_rounding_factor] (
    [prop_val_yr]            NUMERIC (18) NOT NULL,
    [rounding_factor]        NUMERIC (18) NULL,
    [rounding_income_factor] NUMERIC (18) NULL,
    CONSTRAINT [CPK_pacs_rounding_factor] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pacs_rounding_factor_delete_insert_update_MemTable
on pacs_rounding_factor
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
where szTableName = 'pacs_rounding_factor'

GO

