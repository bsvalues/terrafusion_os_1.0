CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_point_quality
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
    comp_sales_point_quality
(
    lQualityDiff
   ,lPoints
   ,lYear
)
SELECT 
    csp.lQualityDiff
    ,csp.lPoints
    ,@lCopyToYear
 FROM 
    comp_sales_point_quality as csp LEFT JOIN 
     (select @lInputFromYear as lYear,lQualityDiff
        from comp_sales_point_quality with (nolock) 
       where lYear = @lCopyToYear) as fy_csp
   on csp.lYear = fy_csp.lYear
 and csp.lQualityDiff = fy_csp.lQualityDiff

  where csp.lYear = @lInputFromYear
 and fy_csp.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

