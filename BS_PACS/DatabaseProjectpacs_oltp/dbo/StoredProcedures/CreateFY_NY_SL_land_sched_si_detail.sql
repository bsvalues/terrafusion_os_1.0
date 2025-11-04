CREATE   PROCEDURE CreateFY_NY_SL_land_sched_si_detail
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
    land_sched_si_detail
(
    ls_detail_id
   ,ls_id
   ,ls_year
   ,ls_range_max
   ,ls_slope
   ,ls_y_intercept
)
SELECT 
    lssd.ls_detail_id
    ,lssd.ls_id
    ,@lCopyToYear
    ,lssd.ls_range_max
    ,lssd.ls_slope
    ,lssd.ls_y_intercept
 FROM 
    land_sched_si_detail as lssd LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year,ls_detail_id
        from land_sched_si_detail with (nolock) 
       where ls_year = @lCopyToYear) as fy_lssd
   on lssd.ls_id = fy_lssd.ls_id
 and lssd.ls_year = fy_lssd.ls_year
 and lssd.ls_detail_id = fy_lssd.ls_detail_id

  where lssd.ls_year = @lInputFromYear
 and fy_lssd.ls_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

