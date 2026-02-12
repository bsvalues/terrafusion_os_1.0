CREATE   PROCEDURE CreateFY_NY_SL_pp_schedule_deprec
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
    pp_schedule_deprec
(
    pp_sched_id
   ,pp_sched_deprec_type_cd
   ,pp_sched_deprec_deprec_cd
   ,year
   ,description
)
SELECT 
    psd.pp_sched_id
    ,psd.pp_sched_deprec_type_cd
    ,psd.pp_sched_deprec_deprec_cd
    ,@lCopyToYear
    ,psd.description
 FROM 
    pp_schedule_deprec as psd LEFT JOIN 
     (select pp_sched_id,pp_sched_deprec_type_cd,pp_sched_deprec_deprec_cd,@lInputFromYear as year
        from pp_schedule_deprec with (nolock) 
       where year = @lCopyToYear) as fy_psd
   on psd.pp_sched_id = fy_psd.pp_sched_id
 and psd.pp_sched_deprec_type_cd = fy_psd.pp_sched_deprec_type_cd
 and psd.pp_sched_deprec_deprec_cd = fy_psd.pp_sched_deprec_deprec_cd
 and psd.year = fy_psd.year

  where psd.year = @lInputFromYear
 and fy_psd.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

