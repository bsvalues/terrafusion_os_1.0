CREATE PROCEDURE CreateFY_NY_SL_special_assessment_exemption
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
    special_assessment_exemption
(
    year
   ,agency_id
   ,exmpt_type_cd
   ,exemption_amount_selection
   ,amount
   ,pct
   ,has_minimum_amount
   ,minimum_amount
	 ,exempt_qualify_cd
)
SELECT 
    @lCopyToYear
    ,sae.agency_id
    ,sae.exmpt_type_cd
    ,sae.exemption_amount_selection
    ,sae.amount
    ,sae.pct
    ,sae.has_minimum_amount
    ,sae.minimum_amount
	  ,sae.exempt_qualify_cd
 FROM 
    special_assessment_exemption as sae 
    JOIN special_assessment as sa
    with (nolock)
    on sae.year = sa.year
    and sae.agency_id = sa.agency_id
    LEFT JOIN 
     (select @lInputFromYear as year,agency_id,exmpt_type_cd,exempt_qualify_cd
        from special_assessment_exemption with (nolock) 
       where year = @lCopyToYear) as fy_sae
		on sae.year = fy_sae.year
		and sae.agency_id = fy_sae.agency_id
		and sae.exmpt_type_cd = fy_sae.exmpt_type_cd
		and sae.exempt_qualify_cd = fy_sae.exempt_qualify_cd

where sae.year = @lInputFromYear
and fy_sae.year is null -- only return those not already inserted
and (sa.end_year is null or sa.end_year >= @lCopyToYear)
and exists (
	select *
	from special_assessment as sanew with(nolock)
	where sanew.year = @lCopyToYear and sanew.agency_id = sae.agency_id
)

set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

