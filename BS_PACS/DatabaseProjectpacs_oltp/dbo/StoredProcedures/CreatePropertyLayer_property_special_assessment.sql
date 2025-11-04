CREATE PROCEDURE CreatePropertyLayer_property_special_assessment
		@lInputFromYear numeric(4,0),
		@lCopyToYear numeric(4,0),
		@CalledBy varchar(50) 
 
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
-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End') 
/* End top of each procedure to capture parameters */
INSERT INTO 
    property_special_assessment
(
    year
   ,sup_num
   ,prop_id
   ,agency_id
   ,assessment_use_cd
   ,assessment_amt
   ,additional_fee_amt
   ,exemption_amt
   ,imported_assessment_amt
)
SELECT 
    @lCopyToYear
    ,0  --psa.sup_num
    ,psa.prop_id
    ,psa.agency_id
    ,psa.assessment_use_cd
    ,psa.assessment_amt
    ,psa.additional_fee_amt
    ,psa.exemption_amt
    ,psa.imported_assessment_amt
 FROM create_property_layer_prop_list as cplpl with(tablockx) 
 join property_special_assessment as psa  with(tablockx) 
   on psa.year = cplpl.prop_val_yr
	 and psa.sup_num = cplpl.sup_num
	 and psa.prop_id = cplpl.prop_id
 join special_assessment as sa
 with (nolock)
 on sa.year = @lCopyToYear
 and psa.agency_id = sa.agency_id
 where IsNull(sa.end_year,@lCopyToYear) >= @lCopyToYear
 
-- update log

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

