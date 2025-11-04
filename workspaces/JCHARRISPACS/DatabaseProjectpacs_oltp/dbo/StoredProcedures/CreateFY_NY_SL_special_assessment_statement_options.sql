CREATE PROCEDURE CreateFY_NY_SL_special_assessment_statement_options
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
INSERT INTO special_assessment_statement_options
(
    year
   ,agency_id
   ,combine_assessment_fee
   ,eligible_for_half_pay
   ,eligible_for_partial_pay
   ,full_pay_only
)
SELECT 
    @lCopyToYear
    ,saso.agency_id
    ,saso.combine_assessment_fee
    ,saso.eligible_for_half_pay
    ,saso.eligible_for_partial_pay
    ,saso.full_pay_only
 FROM special_assessment_statement_options as saso 
 JOIN special_assessment as sa
 with (nolock)
 on saso.agency_id = sa.agency_id
 and sa.year = @lCopyToYear
 LEFT JOIN 
     (select @lInputFromYear as year,agency_id
        from special_assessment_statement_options with (nolock) 
       where year = @lCopyToYear) as fy_saso
  on saso.year = fy_saso.year
	and saso.agency_id = fy_saso.agency_id

  where saso.year = @lInputFromYear
	and fy_saso.year is null -- only return those not already inserted
	and (sa.end_year is null or sa.end_year >= @lCopyToYear)
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

