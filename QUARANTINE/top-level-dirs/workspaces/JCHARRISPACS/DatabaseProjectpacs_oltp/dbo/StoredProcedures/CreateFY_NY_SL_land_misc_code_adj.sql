create procedure CreateFY_NY_SL_land_misc_code_adj
	@lInputFromYear numeric(4,0),
	@lCopyToYear numeric(4,0),
	@CalledBy varchar(10) 
as

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)

declare @proc varchar(500)
set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
exec dbo.CurrentActivityLogInsert @proc, @qry

insert dbo.land_misc_code_adj (year, sched_id, value, adj_pct, adj_value, apply_to_hs, is_percent)
select @lCopyToYear, lmc.sched_id, lmc.value, lmc.adj_pct, lmc.adj_value, lmc.apply_to_hs, lmc.is_percent
from dbo.land_misc_code_adj as lmc
where year = @lInputFromYear
and not exists (
	select *
	from land_misc_code_adj as lmcnew
	where lmcnew.year = @lCopyToYear
	and lmcnew.sched_id = lmc.sched_id
)

set @Rows  = @@Rowcount

-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

