create procedure CreatePropertyLayer_property_assessment_attribute_val
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

insert property_assessment_attribute_val
(
	prop_val_yr,
	sup_num,
	prop_id,

	assessment_use_cd,
	impervious_surface,
	benefit_acres,
	multi_family_units
)
select
	@lCopyToYear,
	0,
	paav.prop_id,

	paav.assessment_use_cd,
	paav.impervious_surface,
	paav.benefit_acres,
	paav.multi_family_units
from create_property_layer_prop_list as cplpl with(tablockx)
join property_assessment_attribute_val as paav with(tablockx) on
	paav.prop_val_yr = cplpl.prop_val_yr and
	paav.sup_num = cplpl.sup_num and
	paav.prop_id = cplpl.prop_id
 
-- update log

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

