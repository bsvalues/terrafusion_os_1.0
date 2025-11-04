create procedure CreatePropertyLayer_property_profile
	@lInputFromYear numeric(4,0),
	@lCopyToYear numeric(4,0),
	@CalledBy varchar(50)
as
 
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

insert property_profile
(
	prop_val_yr,
	sup_num,
	prop_id,
	update_dt,
	school_id,
	city_id,
	state_cd,
	class_cd,
	land_type_cd,
	yr_blt,
	living_area,
	imprv_unit_price,
	imprv_add_val,
	land_sqft,
	land_acres,
	land_front_feet,
	land_depth,
	land_lot,
	land_unit_price,
	region,
	abs_subdv,
	neighborhood,
	subset,
	map_id,
	appraised_val,
	land_num_lots,
	land_appr_method,
	land_total_sqft,
	eff_yr_blt,
	condition_cd,
	percent_complete,
	ls_table,
	main_land_unit_price,
	main_land_total_adj,
	size_adj_pct,
	heat_ac_code,
	land_total_acres,
	zoning,
	visibility_access_cd,
	sub_market_cd,
	road_access,
	land_useable_acres,
	land_useable_sqft,
	property_use_cd,
	last_appraisal_dt,
	utilities,
	topography,
	num_imprv,
	imprv_type_cd,
	imprv_det_sub_class_cd,
	class_cd_highvalueimprov,
	imprv_det_sub_class_cd_highvalueimprov,
	living_area_highvalueimprov,
	actual_year_built,
	characteristic_zoning1,
	characteristic_zoning2,
	characteristic_view,
	actual_age
)
select
	@lCopyToYear,
	0,
	pp.prop_id,
	pp.update_dt,
	pp.school_id,
	pp.city_id,
	pp.state_cd,
	pp.class_cd,
	pp.land_type_cd,
	pp.yr_blt,
	pp.living_area,
	pp.imprv_unit_price,
	pp.imprv_add_val,
	pp.land_sqft,
	pp.land_acres,
	pp.land_front_feet,
	pp.land_depth,
	pp.land_lot,
	pp.land_unit_price,
	pp.region,
	pp.abs_subdv,
	pp.neighborhood,
	pp.subset,
	pp.map_id,
	pp.appraised_val,
	pp.land_num_lots,
	pp.land_appr_method,
	pp.land_total_sqft,
	pp.eff_yr_blt,
	pp.condition_cd,
	pp.percent_complete,
	pp.ls_table,
	pp.main_land_unit_price,
	pp.main_land_total_adj,
	pp.size_adj_pct,
	pp.heat_ac_code,
	pp.land_total_acres,
	pp.zoning,
	pp.visibility_access_cd,
	pp.sub_market_cd,
	pp.road_access,
	pp.land_useable_acres,
	pp.land_useable_sqft,
	pp.property_use_cd,
	pp.last_appraisal_dt,
	pp.utilities,
	pp.topography,
	pp.num_imprv,
	pp.imprv_type_cd,
	pp.imprv_det_sub_class_cd,
	pp.class_cd_highvalueimprov,
	pp.imprv_det_sub_class_cd_highvalueimprov,
	pp.living_area_highvalueimprov,
	pp.actual_year_built,
	pp.characteristic_zoning1,
	pp.characteristic_zoning2,
	pp.characteristic_view,
	pp.actual_age
from create_property_layer_prop_list as cplpl with(tablockx)
join property_profile as pp with(tablockx) on
	pp.prop_val_yr = cplpl.prop_val_yr and
	pp.prop_id = cplpl.prop_id

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

