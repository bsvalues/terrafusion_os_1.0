CREATE   PROCEDURE CreateFY_NY_SL_levy
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
    levy
(
    year
   ,tax_district_id
   ,levy_cd
   ,end_year
   ,levy_type_cd
   ,voted
   ,levy_rate
   ,population_count_enable
   ,population_count
   ,timber_assessed_enable
   ,timber_assessed_cd
   ,timber_assessed_full
   ,timber_assessed_half
   ,timber_assessed_roll
   ,levy_description
   ,include_in_levy_certification
   ,comment
   ,primary_fund_number
   ,senior_levy_rate
)
SELECT 
    @lCopyToYear
    ,l.tax_district_id
    ,l.levy_cd
    ,l.end_year
    ,l.levy_type_cd
    ,l.voted
    ,l.levy_rate
    ,l.population_count_enable
    ,l.population_count
    ,l.timber_assessed_enable
    ,l.timber_assessed_cd
    ,l.timber_assessed_full
    ,l.timber_assessed_half
    ,l.timber_assessed_roll
    ,l.levy_description
    ,l.include_in_levy_certification
    ,l.comment
    ,l.primary_fund_number
	,l.senior_levy_rate
FROM 
    levy as l LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd
        from levy with (nolock) 
       where year = @lCopyToYear) as fy_l
   on l.year = fy_l.year
 and l.tax_district_id = fy_l.tax_district_id
 and l.levy_cd = fy_l.levy_cd

  where l.year = @lInputFromYear
 and isNull(l.end_year, @lCopyToYear) >= @lCopyToYear
 and fy_l.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

