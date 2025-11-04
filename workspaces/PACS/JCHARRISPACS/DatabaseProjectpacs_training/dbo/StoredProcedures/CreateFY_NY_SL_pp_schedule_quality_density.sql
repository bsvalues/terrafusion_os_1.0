CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_quality_density
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
    pp_schedule_quality_density
(
    pp_sched_id
   ,pp_sched_qd_id
   ,year
   ,quality_cd
   ,density_cd
   ,qd_unit_price
   ,qd_percent
)
SELECT 
    psqd.pp_sched_id
    ,psqd.pp_sched_qd_id
    ,@lCopyToYear
    ,psqd.quality_cd
    ,psqd.density_cd
    ,psqd.qd_unit_price
    ,psqd.qd_percent
 FROM 
    pp_schedule_quality_density as psqd LEFT JOIN 
     (select pp_sched_id,pp_sched_qd_id,@lInputFromYear as year
        from pp_schedule_quality_density with (nolock) 
       where year = @lCopyToYear) as fy_psqd
   on psqd.pp_sched_id = fy_psqd.pp_sched_id
 and psqd.pp_sched_qd_id = fy_psqd.pp_sched_qd_id
 and psqd.year = fy_psqd.year

  where psqd.year = @lInputFromYear
 and fy_psqd.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

