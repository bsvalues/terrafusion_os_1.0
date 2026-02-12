
create procedure ComparableSelectCommercialSubjectScoreData
	@lYear numeric(4,0),
	@lPropID int
as

	select
		pp.school_id,
		pp.city_id,
		upper(rtrim(pp.neighborhood)),
		upper(rtrim(pp.abs_subdv)),
		upper(rtrim(pp.state_cd)),
		pp.living_area,
		convert(int, pp.eff_yr_blt),
		upper(rtrim(pp.class_cd)),
		upper(rtrim(pp.visibility_access_cd)),
		upper(rtrim(pp.sub_market_cd)),
		upper(rtrim(pp.region)),
		upper(rtrim(pp.subset)),
		pp.land_sqft,
		i.nra,
		upper(rtrim(pp.property_use_cd)),
		upper(rtrim(pv.secondary_use_cd)),
		pta.tax_area_id,
		upper(rtrim(pp.imprv_det_sub_class_cd)),
		upper(rtrim(pp.imprv_det_sub_class_cd_highvalueimprov)),
		pv.gis_real_coord_x,
		pv.gis_real_coord_y,
		convert(int, pp.actual_year_built)

	from property_profile as pp with(nolock)
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = pp.prop_val_yr and
		psa.prop_id = pp.prop_id
	join property_val as pv with(nolock) on
		pv.prop_val_yr = psa.owner_tax_yr and
		pv.sup_num = psa.sup_num and
		pv.prop_id = psa.prop_id
	join property_tax_area as pta with(nolock) on
		pta.year = psa.owner_tax_yr and
		pta.sup_num = psa.sup_num and
		pta.prop_id = psa.prop_id
	left outer join income_prop_vw as i with(nolock) on
		psa.prop_id = i.prop_id and
		psa.owner_tax_yr = i.prop_val_yr and
		psa.sup_num = i.sup_num and
		i.active_valuation = 'T'
	where
		pp.prop_val_yr = @lYear and
		pp.prop_id = @lPropID

	return( @@rowcount )

GO

