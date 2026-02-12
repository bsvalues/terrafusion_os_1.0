
create procedure ComparableSelectCommercialLoadData
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
		upper(rtrim(pp.class_cd)),
		pv.market,
		pp.living_area,
		convert(int, pp.yr_blt),
		convert(int, pp.eff_yr_blt),
		pp.land_sqft,
		upper(rtrim(pp.imprv_det_sub_class_cd)),

		upper(rtrim(pp.visibility_access_cd)),
		upper(rtrim(pp.property_use_cd)),
		upper(rtrim(pp.sub_market_cd)),
		i.nra,
		pp.num_imprv,

		upper(rtrim(i.class)),
		i.indrsf,
		i.capr,
		i.egirsf,
		i.exprsf,
		i.noirsf,
		i.gpirsf,
		i.vr,
		upper(rtrim(pv.secondary_use_cd)),
		pta.tax_area_id,
		pv.cycle

	from property_profile as pp with(nolock)
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = pp.prop_val_yr and
		psa.prop_id = pp.prop_id
	join property_val as pv with(nolock) on
		psa.owner_tax_yr = pv.prop_val_yr and
		psa.sup_num = pv.sup_num and
		psa.prop_id = pv.prop_id
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
		pp.prop_id = @lSubjectPropID

	return( @@rowcount )

GO

