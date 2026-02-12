CREATE   PROCEDURE CreateFY_NY_SL_levy_limit
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
    levy_limit
(
    year
   ,tax_district_id
   ,levy_cd
   ,levy_limit_type_cd
)
SELECT 
    @lCopyToYear
    ,ll.tax_district_id
    ,ll.levy_cd
    ,ll.levy_limit_type_cd
 FROM 
    levy as l with (nolock)  JOIN
    levy_limit as ll
   ON l.year = @lCopyToYear -- only get records where matching levy records have been copied 
  and ll.year = @lInputFromYear
  and l.tax_district_id = ll.tax_district_id
  and l.levy_cd = ll.levy_cd

     LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd,levy_limit_type_cd
        from levy_limit with (nolock) 
       where year = @lCopyToYear) as fy_ll
   on ll.year = fy_ll.year
 and ll.tax_district_id = fy_ll.tax_district_id
 and ll.levy_cd = fy_ll.levy_cd
 and ll.levy_limit_type_cd = fy_ll.levy_limit_type_cd

  where ll.year = @lInputFromYear
 and fy_ll.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

