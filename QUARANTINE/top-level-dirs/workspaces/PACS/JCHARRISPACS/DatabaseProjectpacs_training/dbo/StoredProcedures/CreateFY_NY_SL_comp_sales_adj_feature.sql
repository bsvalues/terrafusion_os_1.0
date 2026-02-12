CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_adj_feature
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
    comp_sales_adj_feature
(
    lYear
   ,szQualityCode
   ,lAttributeCode
   ,lRangeAmount
   ,lAdjAmount
)
SELECT 
    @lCopyToYear
    ,csaf.szQualityCode
    ,csaf.lAttributeCode
    ,csaf.lRangeAmount
    ,csaf.lAdjAmount
 FROM 
    comp_sales_adj_feature as csaf LEFT JOIN 
     (select @lInputFromYear as lYear,szQualityCode,lAttributeCode,lRangeAmount
        from comp_sales_adj_feature with (nolock) 
       where lYear = @lCopyToYear) as fy_csaf
   on csaf.lYear = fy_csaf.lYear
 and csaf.szQualityCode = fy_csaf.szQualityCode
 and csaf.lAttributeCode = fy_csaf.lAttributeCode
 and csaf.lRangeAmount = fy_csaf.lRangeAmount

  where csaf.lYear = @lInputFromYear
 and fy_csaf.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

