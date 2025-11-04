
create procedure ComparableSelectLandSubjectScoreData
	@lYear numeric(4,0),
	@lPropID int
as

	select
		pp.school_id,
		pp.city_id,
		upper(rtrim(pp.neighborhood)),
		upper(rtrim(pp.abs_subdv)),
		upper(rtrim(pp.state_cd)),
		upper(rtrim(pp.land_type_cd)),
		upper(rtrim(pp.zoning)),
		pp.land_useable_sqft,
		pp.land_useable_acres,
		upper(rtrim(sale.sl_ratio_type_cd)),
		upper(rtrim(pp.characteristic_zoning1)),
		upper(rtrim(pp.characteristic_zoning2)),
		pta.tax_area_id,
		pv.gis_real_coord_x,
		pv.gis_real_coord_y
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
	left outer join chg_of_owner_prop_assoc as coopa with(nolock) on
		coopa.prop_id = pp.prop_id and
		coopa.seq_num = 0
	left outer join sale with(nolock) on
		sale.chg_of_owner_id = coopa.chg_of_owner_id
	where
		pp.prop_val_yr = @lYear and
		pp.prop_id = @lPropID

	return( @@rowcount )

GO

