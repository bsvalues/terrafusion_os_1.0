CREATE   PROCEDURE CreateFY_NY_SL_fund
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10)
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @qry varchar(255)

declare @proc varchar(500)
    set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    fund
(
    year
   ,tax_district_id
   ,levy_cd
   ,fund_id
   ,fund_number
   ,begin_date
   ,end_date
   ,fund_description
   ,disburse
   ,disburse_acct_id
)
SELECT 
    @lCopyToYear
    ,f.tax_district_id
    ,f.levy_cd
    ,f.fund_id
    ,f.fund_number
    ,'1/1/' + convert(char(4),@lCopyToYear) --f.begin_date
    ,f.end_date
    ,f.fund_description
    ,f.disburse
    ,f.disburse_acct_id
 FROM 
    levy as l with (nolock)  JOIN
    fund as f 
   ON l.year = @lCopyToYear -- only get records where matching levy records have been copied 
  and f.year = @lInputFromYear
  and l.tax_district_id = f.tax_district_id
  and l.levy_cd = f.levy_cd
  
    LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd,fund_id
        from fund with (nolock) 
       where year = @lCopyToYear) as fy_f
   on f.year = fy_f.year
 and f.tax_district_id = fy_f.tax_district_id
 and f.levy_cd = fy_f.levy_cd
 and f.fund_id = fy_f.fund_id
  where f.year = @lInputFromYear
    and fy_f.year is null -- only return those not already inserted
    and ISNULL(YEAR(f.end_date),@lCopyToYear) >= @lCopyToYear

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

