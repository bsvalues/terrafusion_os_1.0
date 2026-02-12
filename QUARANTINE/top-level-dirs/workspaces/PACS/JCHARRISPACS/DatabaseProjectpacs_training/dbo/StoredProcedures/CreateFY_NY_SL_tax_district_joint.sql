CREATE   PROCEDURE CreateFY_NY_SL_tax_district_joint
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
    tax_district_joint
(
    year
   ,tax_district_id
   ,levy_cd
   ,acct_id_linked
   ,assessed_value
   ,state_assessed_value
   ,senior_assessed_value
   ,annex_value
   ,new_const_value
   ,timber_assessed_full
   ,timber_assessed_half
   ,timber_assessed_roll
)
SELECT 
    @lCopyToYear
    ,tdj.tax_district_id
    ,tdj.levy_cd
    ,tdj.acct_id_linked
    ,tdj.assessed_value
    ,tdj.state_assessed_value
    ,tdj.senior_assessed_value
    ,tdj.annex_value
    ,tdj.new_const_value
    ,tdj.timber_assessed_full
    ,tdj.timber_assessed_half
    ,tdj.timber_assessed_roll
 FROM 
    levy as l with (nolock)  JOIN
    tax_district_joint as tdj
   ON l.year = @lCopyToYear -- only get records where matching levy records have been copied 
  and tdj.year = @lInputFromYear
  and l.tax_district_id = tdj.tax_district_id
  and l.levy_cd = tdj.levy_cd

     LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd,acct_id_linked
        from tax_district_joint with (nolock) 
       where year = @lCopyToYear) as fy_tdj
   on tdj.year = fy_tdj.year
 and tdj.tax_district_id = fy_tdj.tax_district_id
 and tdj.levy_cd = fy_tdj.levy_cd
 and tdj.acct_id_linked = fy_tdj.acct_id_linked

  where tdj.year = @lInputFromYear
 and fy_tdj.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

