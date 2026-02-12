CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_area
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
    pp_schedule_area
(
    pp_sched_id
   ,pp_sched_area_id
   ,year
   ,area_max
   ,area_price
   ,area_percent
)
SELECT 
    psa.pp_sched_id
    ,psa.pp_sched_area_id
    ,@lCopyToYear
    ,psa.area_max
    ,psa.area_price
    ,psa.area_percent
 FROM 
    pp_schedule_area as psa LEFT JOIN 
     (select pp_sched_id,pp_sched_area_id,@lInputFromYear as year,area_max
        from pp_schedule_area with (nolock) 
       where year = @lCopyToYear) as fy_psa
   on psa.pp_sched_id = fy_psa.pp_sched_id
 and psa.pp_sched_area_id = fy_psa.pp_sched_area_id
 and psa.year = fy_psa.year
 and psa.area_max = fy_psa.area_max

  where psa.year = @lInputFromYear
 and fy_psa.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

