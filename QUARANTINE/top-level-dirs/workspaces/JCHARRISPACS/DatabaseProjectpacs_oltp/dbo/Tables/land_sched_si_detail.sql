CREATE TABLE [dbo].[land_sched_si_detail] (
    [ls_detail_id]   INT             NOT NULL,
    [ls_id]          INT             NOT NULL,
    [ls_year]        NUMERIC (4)     NOT NULL,
    [ls_range_max]   NUMERIC (18, 4) NOT NULL,
    [ls_slope]       NUMERIC (18, 4) NOT NULL,
    [ls_y_intercept] NUMERIC (18, 4) NOT NULL,
    CONSTRAINT [CPK_land_sched_si_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [ls_detail_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_sched_si_detail_ls_id_ls_year] FOREIGN KEY ([ls_id], [ls_year]) REFERENCES [dbo].[land_sched] ([ls_id], [ls_year])
);


GO



create trigger tr_land_sched_si_detail_delete_insert_update_MemTable
on land_sched_si_detail
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
where szTableName = 'land_sched_si_detail'

GO

