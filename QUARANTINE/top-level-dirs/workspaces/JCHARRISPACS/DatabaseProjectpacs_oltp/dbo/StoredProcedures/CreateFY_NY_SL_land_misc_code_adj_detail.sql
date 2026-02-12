create procedure CreateFY_NY_SL_land_misc_code_adj_detail
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

insert dbo.land_misc_code_adj_detail (year, sched_id, element_type, element_value)
select @lCopyToYear, lmc.sched_id, lmc.element_type, lmc.element_value
from dbo.land_misc_code_adj_detail as lmc
where year = @lInputFromYear
and not exists (
	select *
	from land_misc_code_adj_detail as lmcnew
	where lmcnew.year = @lCopyToYear
	and lmcnew.sched_id = lmc.sched_id
	and lmcnew.element_type = lmc.element_type
)

set @Rows  = @@Rowcount

-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

