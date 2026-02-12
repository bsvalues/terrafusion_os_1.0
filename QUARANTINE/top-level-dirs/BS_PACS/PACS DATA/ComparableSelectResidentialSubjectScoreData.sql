
create procedure ComparableSelectResidentialSubjectScoreData
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
		convert(int, pp.yr_blt),
		upper(rtrim(pp.condition_cd)),
		upper(rtrim(pp.class_cd)),
		upper(rtrim(pp.imprv_det_sub_class_cd)),
		upper(rtrim(s.situs_street)),
		upper(rtrim(pp.class_cd_highvalueimprov)),
		upper(rtrim(pp.imprv_det_sub_class_cd_highvalueimprov)),
		pp.living_area_highvalueimprov,
		pta.tax_area_id,
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
	left outer join situs as s with(nolock) on
		pp.prop_id = s.prop_id and
		s.primary_situs = 'Y'
	where
		pp.prop_val_yr = @lYear and
		pp.prop_id = @lPropID

	return( @@rowcount )

GO

