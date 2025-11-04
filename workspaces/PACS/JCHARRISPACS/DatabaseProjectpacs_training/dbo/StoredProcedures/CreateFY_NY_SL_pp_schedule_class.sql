CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_class
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
    pp_schedule_class
(
    pp_sched_id
   ,pp_sched_class_id
   ,year
   ,pp_class_cd
   ,pp_class_amt
   ,pp_class_pct
)
SELECT 
    psc.pp_sched_id
    ,psc.pp_sched_class_id
    ,@lCopyToYear
    ,psc.pp_class_cd
    ,psc.pp_class_amt
    ,psc.pp_class_pct
 FROM 
    pp_schedule_class as psc LEFT JOIN 
     (select pp_sched_id,pp_sched_class_id,@lInputFromYear as year,pp_class_cd
        from pp_schedule_class with (nolock) 
       where year = @lCopyToYear) as fy_psc
   on psc.pp_sched_id = fy_psc.pp_sched_id
 and psc.pp_sched_class_id = fy_psc.pp_sched_class_id
 and psc.year = fy_psc.year
 and psc.pp_class_cd = fy_psc.pp_class_cd

  where psc.year = @lInputFromYear
 and fy_psc.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

