CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_adj_annual_time
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
    comp_sales_adj_annual_time
(
    szPropUse
   ,fAdjPct
   ,lYear
)
SELECT 
    csaat.szPropUse
    ,csaat.fAdjPct
    ,@lCopyToYear
 FROM 
    comp_sales_adj_annual_time as csaat LEFT JOIN 
     (select @lInputFromYear as lYear,szPropUse
        from comp_sales_adj_annual_time with (nolock) 
       where lYear = @lCopyToYear) as fy_csaat
   on csaat.lYear = fy_csaat.lYear
 and csaat.szPropUse = fy_csaat.szPropUse

  where csaat.lYear = @lInputFromYear
 and fy_csaat.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

