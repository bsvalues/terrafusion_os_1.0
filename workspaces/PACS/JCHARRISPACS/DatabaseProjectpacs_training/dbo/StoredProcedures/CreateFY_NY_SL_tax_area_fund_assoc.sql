CREATE   PROCEDURE CreateFY_NY_SL_tax_area_fund_assoc
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
    tax_area_fund_assoc
(
    year
   ,tax_district_id
   ,levy_cd
   ,fund_id
   ,tax_area_id
)
SELECT 
    @lCopyToYear
    ,tafa.tax_district_id
    ,tafa.levy_cd
    ,tafa.fund_id
    ,tafa.tax_area_id
 FROM 
    fund as f with (nolock)  JOIN
    tax_area_fund_assoc as tafa
   on f.year = @lCopyToYear -- only get records where matching fund table records have been copied
 and tafa.year = @lInputFromYear
 and f.tax_district_id = tafa.tax_district_id
 and f.levy_cd = tafa.levy_cd
 and f.fund_id = tafa.fund_id
 LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd,fund_id,tax_area_id
        from tax_area_fund_assoc with (nolock) 
       where year = @lCopyToYear) as fy_tafa
   on tafa.year = fy_tafa.year
 and tafa.tax_district_id = fy_tafa.tax_district_id
 and tafa.levy_cd = fy_tafa.levy_cd
 and tafa.fund_id = fy_tafa.fund_id
 and tafa.tax_area_id = fy_tafa.tax_area_id

  where tafa.year = @lInputFromYear
 and fy_tafa.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

