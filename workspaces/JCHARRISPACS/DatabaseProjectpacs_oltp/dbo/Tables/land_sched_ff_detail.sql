CREATE TABLE [dbo].[land_sched_ff_detail] (
    [ls_detail_id]             INT             NOT NULL,
    [ls_id]                    INT             NOT NULL,
    [ls_year]                  NUMERIC (4)     NOT NULL,
    [ls_range_max]             NUMERIC (18, 4) NOT NULL,
    [ls_range_price]           NUMERIC (14, 2) NOT NULL,
    [ls_range_pc]              NUMERIC (5, 2)  NULL,
    [ls_range_adj_price]       NUMERIC (14, 2) NULL,
    [ls_range_interpolate_inc] NUMERIC (14, 6) NULL,
    CONSTRAINT [CPK_land_sched_ff_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [ls_detail_id] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_land_sched_ff_detail_delete_insert_update_MemTable
on land_sched_ff_detail
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
where szTableName = 'land_sched_ff_detail'

GO

