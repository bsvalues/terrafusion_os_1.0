
create procedure ComparableSelectResidentialLoadData
	@lYear numeric(4,0),
	@lSubjectPropID int
as

	select
		pp.school_id,
		pp.city_id,
		upper(rtrim(pp.state_cd)),
		upper(rtrim(pp.region)),
		upper(rtrim(pp.abs_subdv)),
		upper(rtrim(pp.neighborhood)),
		upper(rtrim(pp.subset)),
		pp.map_id,
		upper(rtrim(pp.class_cd)),
		pv.market,
		pp.living_area,
		convert(int, pp.yr_blt),
		pp.imprv_unit_price,
		pp.imprv_add_val,
		upper(rtrim(pp.land_type_cd)),
		pp.land_acres,
		pp.land_sqft,
		pp.land_front_feet,
		pp.land_num_lots,
		pp.land_unit_price,
		upper(rtrim(pp.condition_cd)),
		upper(rtrim(pp.imprv_det_sub_class_cd)),
		upper(rtrim(pp.imprv_type_cd)),
		upper(rtrim(pp.class_cd_highvalueimprov)),
		upper(rtrim(pp.imprv_det_sub_class_cd_highvalueimprov)),
		pp.living_area_highvalueimprov,
		upper(rtrim(pp.property_use_cd)),
		upper(rtrim(pv.secondary_use_cd)),
		upper(rtrim(pp.characteristic_zoning1)),
		upper(rtrim(pp.characteristic_zoning2)),
		upper(rtrim(pp.characteristic_view)),
		pta.tax_area_id,
		pv.cycle,
		convert(int, pp.actual_year_built),
		pv.imprv_hstd_val,
		pv.imprv_non_hstd_val
	from prop_supp_assoc as psa with(nolock)
	join property_profile as pp with(nolock) on
		pp.prop_val_yr = psa.owner_tax_yr and
		pp.prop_id = psa.prop_id
	join property_val as pv with(nolock) on
		psa.owner_tax_yr = pv.prop_val_yr and
		psa.sup_num = pv.sup_num and
		psa.prop_id = pv.prop_id
	join property_tax_area as pta with(nolock) on
		pta.year = psa.owner_tax_yr and
		pta.sup_num = psa.sup_num and
		pta.prop_id = psa.prop_id
	where
		psa.owner_tax_yr = @lYear and
		psa.prop_id = @lSubjectPropID

	return( @@rowcount )

GO

