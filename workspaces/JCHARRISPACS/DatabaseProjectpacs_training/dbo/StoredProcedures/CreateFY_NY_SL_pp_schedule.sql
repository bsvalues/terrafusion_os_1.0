CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule
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
    pp_schedule
(
    pp_sched_id
   ,year
   ,value_method
   ,table_code
   ,segment_type
)
SELECT 
    ps.pp_sched_id
    ,@lCopyToYear
    ,ps.value_method
    ,ps.table_code
    ,ps.segment_type
 FROM 
    pp_schedule as ps LEFT JOIN 
     (select pp_sched_id,@lInputFromYear as year,value_method,table_code,segment_type
        from pp_schedule with (nolock) 
       where year = @lCopyToYear) as fy_ps
   on ps.pp_sched_id = fy_ps.pp_sched_id
 and ps.year = fy_ps.year
 and ps.value_method = fy_ps.value_method
 and ps.table_code = fy_ps.table_code
 and ps.segment_type = fy_ps.segment_type

  where ps.year = @lInputFromYear
 and fy_ps.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

