CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_adj_finance
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
    comp_sales_adj_finance
(
    szFinanceCode
   ,fAdjPct
   ,lYear
)
SELECT 
    csaf.szFinanceCode
    ,csaf.fAdjPct
    ,@lCopyToYear
 FROM 
    comp_sales_adj_finance as csaf LEFT JOIN 
     (select @lInputFromYear as lYear,szFinanceCode
        from comp_sales_adj_finance with (nolock) 
       where lYear = @lCopyToYear) as fy_csaf
   on csaf.lYear = fy_csaf.lYear
 and csaf.szFinanceCode = fy_csaf.szFinanceCode

  where csaf.lYear = @lInputFromYear
 and fy_csaf.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

