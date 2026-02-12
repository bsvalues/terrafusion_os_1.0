CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_adj
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
    pp_schedule_adj
(
    pp_sched_id
   ,pp_sched_adj_id
   ,year
   ,pp_sched_adj_cd
   ,pp_sched_adj_desc
   ,pp_sched_adj_pc
   ,pp_sched_adj_amt
   ,sys_flag
)
SELECT 
    psa.pp_sched_id
    ,psa.pp_sched_adj_id
    ,@lCopyToYear
    ,psa.pp_sched_adj_cd
    ,psa.pp_sched_adj_desc
    ,psa.pp_sched_adj_pc
    ,psa.pp_sched_adj_amt
    ,psa.sys_flag
 FROM 
    pp_schedule_adj as psa LEFT JOIN 
     (select pp_sched_id,pp_sched_adj_id,@lInputFromYear as year
        from pp_schedule_adj with (nolock) 
       where year = @lCopyToYear) as fy_psa
   on psa.pp_sched_id = fy_psa.pp_sched_id
 and psa.pp_sched_adj_id = fy_psa.pp_sched_adj_id
 and psa.year = fy_psa.year

  where psa.year = @lInputFromYear
 and fy_psa.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

