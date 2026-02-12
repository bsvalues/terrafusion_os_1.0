CREATE   PROCEDURE CreatePropertyLayer_property_income_characteristic_unit_mix
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
INSERT INTO property_income_characteristic_unit_mix with(tablockx)
(
	year,
	sup_num,
	prop_id,
	pic_id,
	unit_mix_id,
	num_units,
	unit_type,
	baths,
	style,
	size_sqft,
	rent_per_unit,
	num_spaces,
	rent_per_space,
	gross_monthly_rent,
	special_program_unit,
	water_sewer,
	garbage,
	electricity,
	heat,
	cable,
	carport_garage_in_rent,
	other
)
SELECT 
	@lCopyToYear,
	0,  -- sup_num
	picum.prop_id,
	picum.pic_id,
	picum.unit_mix_id,
	picum.num_units,
	picum.unit_type,
	picum.baths,
	picum.style,
	picum.size_sqft,
	picum.rent_per_unit,
	picum.num_spaces,
	picum.rent_per_space,
	picum.gross_monthly_rent,
	picum.special_program_unit,
	picum.water_sewer,
	picum.garbage,
	picum.electricity,
	picum.heat,
	picum.cable,
	picum.carport_garage_in_rent,
	picum.other
FROM create_property_layer_prop_list as cplpl with(tablockx)
join property_income_characteristic_unit_mix as picum with(tablockx) on
	picum.year = cplpl.prop_val_yr
	and picum.sup_num = cplpl.sup_num
	and picum.prop_id = cplpl.prop_id
 
-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

