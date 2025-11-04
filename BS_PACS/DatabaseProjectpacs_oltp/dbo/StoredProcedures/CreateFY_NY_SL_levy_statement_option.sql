CREATE   PROCEDURE CreateFY_NY_SL_levy_statement_option
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
    levy_statement_option
(
    year
   ,tax_district_id
   ,levy_cd
   ,separate_levy_display
   ,levy_description
   ,levy_comment
)
SELECT 
    @lCopyToYear
    ,lso.tax_district_id
    ,lso.levy_cd
    ,lso.separate_levy_display
    ,lso.levy_description
    ,lso.levy_comment
 FROM 
    levy as l with (nolock)  JOIN
    levy_statement_option as lso
   ON l.year = @lCopyToYear -- only get records where matching levy records have been copied 
  and lso.year = @lInputFromYear
  and l.tax_district_id = lso.tax_district_id
  and l.levy_cd = lso.levy_cd
     LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd
        from levy_statement_option with (nolock) 
       where year = @lCopyToYear) as fy_lso
   on lso.year = fy_lso.year
 and lso.tax_district_id = fy_lso.tax_district_id
 and lso.levy_cd = fy_lso.levy_cd

  where lso.year = @lInputFromYear
 and fy_lso.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

