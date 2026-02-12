CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_order
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
    pp_schedule_order
(
    pp_sched_id
   ,year
   ,module_1
   ,module_2
   ,module_3
   ,module_4
   ,module_5
   ,module_6
)
SELECT 
    pso.pp_sched_id
    ,@lCopyToYear
    ,pso.module_1
    ,pso.module_2
    ,pso.module_3
    ,pso.module_4
    ,pso.module_5
    ,pso.module_6
 FROM 
    pp_schedule_order as pso LEFT JOIN 
     (select pp_sched_id,@lInputFromYear as year
        from pp_schedule_order with (nolock) 
       where year = @lCopyToYear) as fy_pso
   on pso.pp_sched_id = fy_pso.pp_sched_id
 and pso.year = fy_pso.year

  where pso.year = @lInputFromYear
 and fy_pso.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

