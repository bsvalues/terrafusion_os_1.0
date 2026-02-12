
create procedure ComparableSearchResidentialEquity

	@lYear numeric(4,0),

	@blnRegion bit,
	@blnAbsSubdv bit,
	@blnNeighborhood bit,
	@blnSubset bit,
	@blnMapID bit,
	@blnCondition bit,
	@blnSchool bit,
	@blnCity bit,
	@blnStateCode bit,
	@blnLastAppraiserID bit,
	@blnImprovClass bit,
	@blnImprovSubClass bit,
	@blnImprovType bit,
	@blnLandType bit,

	@lMarketFrom numeric(14,0),
	@lMarketTo numeric(14,0),
	@lLivingAreaFrom numeric(14,0),
	@lLivingAreaTo numeric(14,0),

	@lYearFrom numeric(4,0),
	@lYearTo numeric(4,0),

	@fImprovUnitPriceFrom numeric(14,2),
	@fImprovUnitPriceTo numeric(14,2),
	@lAddValFrom numeric(14,0),
	@lAddValTo numeric(14,0),

	@fLandSQFTFrom numeric(18,2),
	@fLandSQFTTo numeric(18,2),
	@fLandAcresFrom numeric(18,4),
	@fLandAcresTo numeric(18,4),
	@fLandFFFrom numeric(18,2),
	@fLandFFTo numeric(18,2),
	@cLandLot varchar(1),

	@fLandUnitPriceFrom numeric(14,2),
	@fLandUnitPriceTo numeric(14,2)

as

	select
		pp.prop_id,
		pp.school_id,
		pp.city_id,
		upper(rtrim(pp.state_cd)),
		upper(rtrim(pp.region)),
		upper(rtrim(pp.abs_subdv)),
		upper(rtrim(pp.neighborhood)),
		upper(rtrim(pp.subset)),
		upper(rtrim(pp.map_id)),
		upper(rtrim(pp.class_cd)),
		upper(rtrim(pp.imprv_det_sub_class_cd)),
		pp.living_area,
		convert(int, pp.yr_blt),
		pp.imprv_unit_price,
		pp.imprv_add_val,
		upper(rtrim(pp.land_type_cd)),
		pp.land_sqft,
		pp.land_front_feet,
		pp.land_acres,
		upper(rtrim(pp.land_lot)),
		pp.land_unit_price,
		upper(rtrim(pp.condition_cd)),
		pp.percent_complete,
		upper(rtrim(pp.ls_table)),
		pp.main_land_unit_price,
		pp.main_land_total_adj,
		pp.size_adj_pct,
		upper(rtrim(pp.heat_ac_code)),
		upper(rtrim(pp.imprv_type_cd)),

		pv.imprv_hstd_val,
		pv.imprv_non_hstd_val,
		pv.land_hstd_val,
		pv.land_non_hstd_val,
		pv.ag_market,
		pv.timber_market,
		pv.market,

		p.geo_id,

		a.file_as_name,

		upper(rtrim(s.situs_street)),
		s.situs_display,
		
		upper(rtrim(pv.appr_method))

	from property_profile as pp with(nolock)
	join property_val as pv with(nolock) on
		pp.prop_val_yr = pv.prop_val_yr and
		pp.sup_num = pv.sup_num and
		pp.prop_id = pv.prop_id
	join property as p with(nolock) on
		pp.prop_id = p.prop_id
	join owner as o with(nolock) on
		pp.prop_val_yr = o.owner_tax_yr and
		pp.sup_num = o.sup_num and
		pp.prop_id = o.prop_id
	join account as a with(nolock) on
		o.owner_id = a.acct_id
	left outer join situs as s with(nolock) on
		pp.prop_id = s.prop_id and
		s.primary_situs = 'Y'
	where
		pp.prop_val_yr = @lYear and
		(@blnImprovClass = 0 or pp.class_cd in (select szImprovClass from #comp_sales_search_criteria_improv_class)) and
		(@blnImprovSubClass = 0 or pp.imprv_det_sub_class_cd in (select szImprovSubClass from #comp_sales_search_criteria_improv_subclass)) and
		(@blnNeighborhood = 0 or pp.neighborhood in (select szNeighborhood from #comp_sales_search_criteria_neighborhood)) and
		(@blnAbsSubdv = 0 or pp.abs_subdv in (select szAbsSubdv from #comp_sales_search_criteria_abs_subdv)) and
		(@blnImprovType = 0 or pp.imprv_type_cd in (select szImprovType from #comp_sales_search_criteria_improv_type)) and
		(@blnCondition = 0 or pp.condition_cd in (select szCondition from #comp_sales_search_criteria_condition)) and
		(@blnSchool = 0 or pp.school_id in (select lSchool from #comp_sales_search_criteria_school)) and
		(@blnCity = 0 or pp.city_id in (select lCity from #comp_sales_search_criteria_city)) and
		(@blnStateCode = 0 or pp.state_cd in (select szStateCode from #comp_sales_search_criteria_state_code)) and
		(@blnRegion = 0 or pp.region in (select szRegion from #comp_sales_search_criteria_region)) and
		(@blnSubset = 0 or pp.subset in (select szSubset from #comp_sales_search_criteria_subset)) and
		(@blnMapID = 0 or pp.map_id in (select szMapID from #comp_sales_search_criteria_map_id)) and
		(@blnLandType = 0 or pp.land_type_cd in (select szLandType from #comp_sales_search_criteria_land_type)) and
		(@lLivingAreaFrom is null or pp.living_area >= @lLivingAreaFrom) and
		(@lLivingAreaTo is null or pp.living_area <= @lLivingAreaTo) and
		(@lYearFrom is null or pp.yr_blt >= @lYearFrom) and
		(@lYearTo is null or pp.yr_blt <= @lYearTo) and
		(@fImprovUnitPriceFrom is null or pp.imprv_unit_price >= @fImprovUnitPriceFrom) and
		(@fImprovUnitPriceTo is null or pp.imprv_unit_price <= @fImprovUnitPriceTo) and
		(@lAddValFrom is null or pp.imprv_add_val >= @lAddValFrom) and
		(@lAddValTo is null or pp.imprv_add_val <= @lAddValTo) and
		(@fLandSQFTFrom is null or pp.land_sqft >= @fLandSQFTFrom) and
		(@fLandSQFTTo is null or pp.land_sqft <= @fLandSQFTTo) and
		(@fLandFFFrom is null or pp.land_front_feet >= @fLandFFFrom) and
		(@fLandFFTo is null or pp.land_front_feet <= @fLandFFTo) and
		(@fLandAcresFrom is null or pp.land_acres >= @fLandAcresFrom) and
		(@fLandAcresTo is null or pp.land_acres <= @fLandAcresTo) and
		(@cLandLot is null or pp.land_lot = @cLandLot) and
		(@fLandUnitPriceFrom is null or pp.land_unit_price >= @fLandUnitPriceFrom) and
		(@fLandUnitPriceTo is null or pp.land_unit_price <= @fLandUnitPriceTo) and
		(@blnLastAppraiserID = 0 or pv.last_appraiser_id in (select lAppraiserID from #comp_sales_search_criteria_last_appraiser)) and
		(@lMarketFrom is null or pv.market >= @lMarketFrom) and
		(@lMarketTo is null or pv.market <= @lMarketTo)

	return( @@rowcount )

GO

