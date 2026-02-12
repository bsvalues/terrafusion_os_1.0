CREATE TABLE [dbo].[holiday_year] (
    [holiday_id] INT         IDENTITY (1, 1) NOT NULL,
    [holiday_yr] NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_holiday_year] PRIMARY KEY CLUSTERED ([holiday_id] ASC)
);


GO


create trigger tr_holiday_year_delete_insert_update_MemTable
on holiday_year
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
where szTableName = 'holiday_year'

GO

