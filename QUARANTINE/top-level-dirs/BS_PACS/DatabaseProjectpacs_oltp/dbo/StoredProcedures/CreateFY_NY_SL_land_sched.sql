CREATE   PROCEDURE CreateFY_NY_SL_land_sched
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
    land_sched
(
    ls_id
   ,ls_year
   ,ls_code
   ,ls_ag_or_mkt
   ,ls_method
   ,ls_interpolate
   ,ls_up
   ,ls_base_price
   ,ls_std_depth
   ,ls_plus_dev_ft
   ,ls_plus_dev_amt
   ,ls_minus_dev_ft
   ,ls_minus_dev_amt
   ,changed_flag
   ,ls_ff_type
   ,ls_slope_intercept
   ,matrix_id
)
SELECT 
    ls.ls_id
    ,@lCopyToYear
    ,ls.ls_code
    ,ls.ls_ag_or_mkt
    ,ls.ls_method
    ,ls.ls_interpolate
    ,ls.ls_up
    ,ls.ls_base_price
    ,ls.ls_std_depth
    ,ls.ls_plus_dev_ft
    ,ls.ls_plus_dev_amt
    ,ls.ls_minus_dev_ft
    ,ls.ls_minus_dev_amt
    ,ls.changed_flag
    ,ls.ls_ff_type
    ,ls.ls_slope_intercept
    ,ls.matrix_id
 FROM 
    land_sched as ls LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year
        from land_sched with (nolock) 
       where ls_year = @lCopyToYear) as fy_ls
   on ls.ls_id = fy_ls.ls_id
 and ls.ls_year = fy_ls.ls_year

  where ls.ls_year = @lInputFromYear
 and fy_ls.ls_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

