CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_property_use_life_expectancy
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
    comp_sales_property_use_life_expectancy
(
    szPropUse
   ,lLifeExpectancy
   ,lYear
)
SELECT 
    csp.szPropUse
    ,csp.lLifeExpectancy
    ,@lCopyToYear
 FROM 
    comp_sales_property_use_life_expectancy as csp LEFT JOIN 
     (select @lInputFromYear as lYear,szPropUse
        from comp_sales_property_use_life_expectancy with (nolock) 
       where lYear = @lCopyToYear) as fy_csp
   on csp.lYear = fy_csp.lYear
 and csp.szPropUse = fy_csp.szPropUse

  where csp.lYear = @lInputFromYear
 and fy_csp.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

