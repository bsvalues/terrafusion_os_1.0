CREATE   PROCEDURE CreateFY_NY_SL_township
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
    township
(
    township_code
   ,township_year
   ,township_desc
   ,created_date
)
SELECT 
    t.township_code
    ,@lCopyToYear
    ,t.township_desc
    ,t.created_date
 FROM 
    township as t LEFT JOIN 
     (select township_code,@lInputFromYear as township_year
        from township with (nolock) 
       where township_year = @lCopyToYear) as fy_t
   on t.township_code = fy_t.township_code
 and t.township_year = fy_t.township_year

  where t.township_year = @lInputFromYear
 and fy_t.township_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

