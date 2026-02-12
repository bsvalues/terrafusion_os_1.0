CREATE TABLE [dbo].[fiscal_month] (
    [tax_year]   NUMERIC (4) NOT NULL,
    [tax_month]  INT         NOT NULL,
    [begin_date] DATETIME    NULL,
    [end_date]   DATETIME    NULL,
    CONSTRAINT [CPK_fiscal_month] PRIMARY KEY CLUSTERED ([tax_year] ASC, [tax_month] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_fiscal_month_delete_insert_update_MemTable
on fiscal_month
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
where szTableName = 'fiscal_month'

GO

