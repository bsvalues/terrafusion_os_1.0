CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_unit_count
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)

declare @proc varchar(500)
    set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    pp_schedule_unit_count
(
    pp_sched_id
   ,pp_sched_unit_count_id
   ,year
   ,unit_count_max
   ,unit_price
   ,unit_percent
)
SELECT 
    psuc.pp_sched_id
    ,psuc.pp_sched_unit_count_id
    ,@lCopyToYear
    ,psuc.unit_count_max
    ,psuc.unit_price
    ,psuc.unit_percent
 FROM 
    pp_schedule_unit_count as psuc LEFT JOIN 
     (select pp_sched_id,pp_sched_unit_count_id,@lInputFromYear as year,unit_count_max
        from pp_schedule_unit_count with (nolock) 
       where year = @lCopyToYear) as fy_psuc
   on psuc.pp_sched_id = fy_psuc.pp_sched_id
 and psuc.pp_sched_unit_count_id = fy_psuc.pp_sched_unit_count_id
 and psuc.year = fy_psuc.year
 and psuc.unit_count_max = fy_psuc.unit_count_max

  where psuc.year = @lInputFromYear
 and fy_psuc.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

