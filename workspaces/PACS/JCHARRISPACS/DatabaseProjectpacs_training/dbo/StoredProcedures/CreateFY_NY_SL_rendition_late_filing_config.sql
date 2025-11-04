CREATE   PROCEDURE CreateFY_NY_SL_rendition_late_filing_config
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
    rendition_late_filing_config
(
    year
   ,late_date
   ,notice_penalty_percent
)
SELECT 
    @lCopyToYear
    ,dateadd(year, 1, rlfc.late_date)
    ,rlfc.notice_penalty_percent
 FROM 
    rendition_late_filing_config as rlfc LEFT JOIN 
     (select @lInputFromYear as year
        from rendition_late_filing_config with (nolock) 
       where year = @lCopyToYear) as fy_rlfc
   on rlfc.year = fy_rlfc.year

  where rlfc.year = @lInputFromYear
 and fy_rlfc.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

