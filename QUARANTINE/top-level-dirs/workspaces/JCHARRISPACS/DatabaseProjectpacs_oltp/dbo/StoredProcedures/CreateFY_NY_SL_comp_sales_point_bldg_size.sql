CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_point_bldg_size
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
    comp_sales_point_bldg_size
(
    lBldgSizeDiff
   ,lPoints
   ,lYear
)
SELECT 
    cspa.lBldgSizeDiff
    ,cspa.lPoints
    ,@lCopyToYear
 FROM 
    comp_sales_point_bldg_size as cspa LEFT JOIN 
     (select @lInputFromYear as lYear,lBldgSizeDiff
        from comp_sales_point_bldg_size with (nolock) 
       where lYear = @lCopyToYear) as fy_cspa
   on cspa.lYear = fy_cspa.lYear
 and cspa.lBldgSizeDiff = fy_cspa.lBldgSizeDiff

  where cspa.lYear = @lInputFromYear
 and fy_cspa.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

