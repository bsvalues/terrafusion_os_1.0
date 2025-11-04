CREATE TABLE [dbo].[holiday_schedule] (
    [holiday_id]     INT          NOT NULL,
    [holiday_date]   DATETIME     NOT NULL,
    [holiday_desc]   VARCHAR (40) NOT NULL,
    [holiday_days]   INT          NOT NULL,
    [office_holiday] BIT          NOT NULL,
    [bank_holiday]   BIT          NOT NULL,
    CONSTRAINT [CPK_holiday_schedule] PRIMARY KEY CLUSTERED ([holiday_id] ASC, [holiday_date] ASC)
);


GO


create trigger tr_holiday_schedule_delete_insert_update_MemTable
on holiday_schedule
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
where szTableName = 'holiday_schedule'

GO

