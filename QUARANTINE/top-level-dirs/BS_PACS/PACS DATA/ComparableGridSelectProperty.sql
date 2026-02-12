
create procedure ComparableGridSelectProperty
	@lYear numeric(4,0)
as

	select
		c.lPropID,
		
		p.geo_id,
		p.dba_name,

		pp.school_id,
		pp.city_id,
		upper(rtrim(pp.state_cd)),
		upper(rtrim(pp.class_cd)),
		upper(rtrim(pp.imprv_det_sub_class_cd)),
		pp.land_unit_price,
		pp.land_sqft,
		pp.land_acres,
		upper(rtrim(pp.land_type_cd)),
		pp.imprv_unit_price,
		pp.imprv_add_val,
		pp.living_area,
		convert(int, pp.yr_blt),
		convert(int, pp.eff_yr_blt),
		upper(rtrim(pp.condition_cd)),
		pp.percent_complete,
		upper(rtrim(pp.ls_table)),
		pp.main_land_unit_price,
		pp.main_land_total_adj,
		pp.size_adj_pct,

		pv.imprv_hstd_val,
		pv.imprv_non_hstd_val,
		pv.land_hstd_val,
		pv.land_non_hstd_val,
		pv.ag_market,
		pv.timber_market,
		pv.market,
		upper(rtrim(pv.rgn_cd)),
		upper(rtrim(pv.subset_cd)),
		upper(rtrim(pv.abs_subdv_cd)),
		upper(rtrim(pv.hood_cd)),
		pv.last_appraisal_dt,
		upper(rtrim(pv.map_id)),
		pv.mapsco,
		upper(rtrim(pv.sub_market_cd)),
		upper(rtrim(pv.property_use_cd)),
		upper(rtrim(pv.visibility_access_cd)),
		(
			select top 1 pi.location 
			from pacs_image pi with(nolock)
			where pi.ref_type in ('P','PI') 
			and pi.ref_id = p.prop_id
			and pi.main = 1
			order by case when pi.ref_type = 'P' then 1 else 2 end, pi.scan_dt desc
		) as image_path,
		pv.appr_method,
		
		s.situs_display,
		upper(rtrim(s.situs_street)),

		isnull(pp.num_imprv, 0),

		upper(rtrim(pp.imprv_type_cd)),

		isnull(pp.land_useable_sqft, pp.land_sqft),
		isnull(pp.land_useable_acres, pp.land_acres),
		pp.zoning,
		pp.utilities,
		pp.topography,
		upper(rtrim(pp.class_cd_highvalueimprov)),
		upper(rtrim(pp.imprv_det_sub_class_cd_highvalueimprov)),
		pp.living_area_highvalueimprov,
		pta.tax_area_id,
		pv.gis_real_coord_x,
		pv.gis_real_coord_y,
		convert(int, pp.actual_year_built),
		upper(rtrim(pv.secondary_use_cd)),
		upper(rtrim(pp.characteristic_zoning1)),
		upper(rtrim(pp.characteristic_zoning2)),
		upper(rtrim(pp.characteristic_view)),
		ta.tax_area_number,
		dbo.fn_ComparableGridCalcPropLandMiscCodesValue(pv.prop_val_yr, pv.prop_id, pv.sup_num) as PropLandMiscCodesValue,
		pv.ag_hs_mkt_val,
		pv.timber_hs_mkt_val

	from #comp_sales_property_pid as c with(nolock)
	join property as p with(nolock) on
		p.prop_id = c.lPropID
	join property_val as pv with(nolock) on
		pv.prop_val_yr = @lYear and
		pv.prop_id = c.lPropID and
		pv.sup_num = c.lSupNum
	join property_tax_area as pta with(nolock) on
		pta.year = pv.prop_val_yr and
		pta.sup_num = pv.sup_num and
		pta.prop_id = pv.prop_id
	join tax_area as ta with(nolock) on
		pta.tax_area_id = ta.tax_area_id
	join property_profile as pp with(nolock) on
		pp.prop_val_yr = @lYear and
		pp.prop_id = c.lPropID
	left outer join situs as s with(nolock) on
		s.prop_id = c.lPropID and
		s.primary_situs = 'Y'
	order by
		c.lPropID asc

	return ( @@rowcount )

GO

