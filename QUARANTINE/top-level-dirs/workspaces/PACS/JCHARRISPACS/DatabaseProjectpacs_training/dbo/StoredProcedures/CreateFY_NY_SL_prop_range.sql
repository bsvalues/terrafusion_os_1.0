CREATE   PROCEDURE CreateFY_NY_SL_prop_range
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
    prop_range
(
    range_code
   ,range_year
   ,range_desc
   ,created_date
)
SELECT 
    t.range_code
    ,@lCopyToYear
    ,t.range_desc
    ,t.created_date
 FROM 
    prop_range as t LEFT JOIN 
     (select range_code,@lInputFromYear as range_year
        from prop_range with (nolock) 
       where range_year = @lCopyToYear) as fy_t
   on t.range_code = fy_t.range_code
 and t.range_year = fy_t.range_year

  where t.range_year = @lInputFromYear
 and fy_t.range_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

