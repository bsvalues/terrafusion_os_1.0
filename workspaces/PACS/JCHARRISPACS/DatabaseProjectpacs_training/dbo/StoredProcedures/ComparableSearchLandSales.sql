
create procedure ComparableSearchLandSales

	@blnSaleFlag bit,

	@lYear numeric(4,0),

	@blnRegion bit,
	@blnAbsSubdv bit,
	@blnNeighborhood bit,
	@blnSubset bit,
	@blnMapID bit,
	@blnSchool bit,
	@blnCity bit,
	@blnStateCode bit,
	@blnLandType bit,
	@blnUtilities bit,
	@blnTopography bit,
	@blnRoadAccess bit,
	@blnZoning bit,
	@blnSubMarket bit,
	@blnPropertyUse bit,
	@blnCVA bit,

	@fLandSQFTFrom numeric(18,2),
	@fLandSQFTTo numeric(18,2),
	@fLandAcresFrom numeric(18,4),
	@fLandAcresTo numeric(18,4),

	@fUseableLandSQFTFrom numeric(18,2),
	@fUseableLandSQFTTo numeric(18,2),
	@fUseableLandAcresFrom numeric(18,4),
	@fUseableLandAcresTo numeric(18,4),

	@fLandUnitPriceFrom numeric(14,2),
	@fLandUnitPriceTo numeric(14,2),

	@dtSaleDateFrom datetime,
	@dtSaleDateTo datetime,
	@blnSaleType bit,
	@blnSaleRatio bit

as

	/* The input may be, for example, Feb 19 2005, however, we want to include sales on that day */
	set @dtSaleDateTo = dateadd(day, 1, @dtSaleDateTo)

	if ( @blnSaleFlag = 1 ) /* Sold only */
	begin
		select
			pp.prop_id,
			pp.school_id,
			pp.city_id,
			pp.state_cd,
			pp.region,
			pp.abs_subdv,
			pp.neighborhood,
			pp.subset,
			pp.map_id,
			pp.land_type_cd,
			pp.land_sqft,
			pp.land_acres,
			pp.land_unit_price,
			pp.ls_table,
			pp.main_land_unit_price,
			pp.main_land_total_adj,
			pp.land_useable_acres,
			pp.land_useable_sqft,

			pp.utilities,
			pp.topography,
			pp.road_access,
			pp.zoning,
			pp.sub_market_cd,
			pp.property_use_cd,
			pp.visibility_access_cd,
			pp.last_appraisal_dt,

			pv.land_hstd_val,
			pv.land_non_hstd_val,
			pv.ag_market,
			pv.timber_market,
			pv.market,

			p.geo_id,

			s.situs_display,

			cs.chg_of_owner_id,
			cs.sl_type,
			cs.sl_dt,
			cs.sl_price,
			cs.adjusted_sl_price,
			cs.sl_ratio_type_cd,

			lcs.total_acres,
			lcs.total_square_feet,
			lcs.total_useable_acres,
			lcs.total_useable_square_feet,
			lcs.total_land_market

		from property_profile as pp with(nolock)
		join comp_sales_prop_sale_vw as cs with(nolock) on
			pp.prop_id = cs.prop_id
		join comp_sales_land_sale_vw as lcs with(nolock) on
			cs.chg_of_owner_id = lcs.chg_of_owner_id
		join property_val as pv with(nolock) on
			pp.prop_val_yr = pv.prop_val_yr and
			pp.sup_num = pv.sup_num and
			pp.prop_id = pv.prop_id
		join property as p with(nolock) on
			pp.prop_id = p.prop_id
		left outer join situs as s with(nolock) on
			pp.prop_id = s.prop_id and
			s.primary_situs = 'Y'
		where
			pp.prop_val_yr = @lYear and
			(@blnNeighborhood = 0 or pp.neighborhood in (select szNeighborhood from #comp_sales_search_criteria_neighborhood)) and
			(@blnAbsSubdv = 0 or pp.abs_subdv in (select szAbsSubdv from #comp_sales_search_criteria_abs_subdv)) and
			(@blnSchool = 0 or pp.school_id in (select lSchool from #comp_sales_search_criteria_school)) and
			(@blnCity = 0 or pp.city_id in (select lCity from #comp_sales_search_criteria_city)) and
			(@blnStateCode = 0 or pp.state_cd in (select szStateCode from #comp_sales_search_criteria_state_code)) and
			(@blnRegion = 0 or pp.region in (select szRegion from #comp_sales_search_criteria_region)) and
			(@blnSubset = 0 or pp.subset in (select szSubset from #comp_sales_search_criteria_subset)) and
			(@blnMapID = 0 or pp.map_id in (select szMapID from #comp_sales_search_criteria_map_id)) and
			(@blnLandType = 0 or pp.land_type_cd in (select szLandType from #comp_sales_search_criteria_land_type)) and
			(@blnSaleType = 0 or cs.sl_type_cd in (select szSaleType from #comp_sales_search_criteria_sale_type)) and
			(@blnSaleRatio = 0 or cs.sl_ratio_type_cd in (select szSaleRatio from #comp_sales_search_criteria_sale_ratio)) and
			(@blnUtilities = 0 or pp.utilities in (select szUtilities from #comp_sales_search_criteria_utilities)) and
			(@blnTopography = 0 or pp.topography in (select szTopography from #comp_sales_search_criteria_topography)) and
			(@blnRoadAccess = 0 or pp.road_access in (select szRoadAccess from #comp_sales_search_criteria_road_access)) and
			(@blnZoning = 0 or pp.zoning in (select szZoning from #comp_sales_search_criteria_zoning)) and
			(@blnSubMarket = 0 or pp.sub_market_cd in (select szSubMarket from #comp_sales_search_criteria_sub_market)) and
			(@blnPropertyUse = 0 or pp.property_use_cd in (select szPropertyUse from #comp_sales_search_criteria_property_use)) and
			(@blnCVA = 0 or pp.visibility_access_cd in (select szCVA from #comp_sales_search_criteria_cva)) and
			(@fLandSQFTFrom is null or lcs.total_square_feet >= @fLandSQFTFrom) and
			(@fLandSQFTTo is null or lcs.total_square_feet <= @fLandSQFTTo) and
			(@fLandAcresFrom is null or lcs.total_acres >= @fLandAcresFrom) and
			(@fLandAcresTo is null or lcs.total_acres <= @fLandAcresTo) and
			(@fUseableLandSQFTFrom is null or lcs.total_useable_square_feet >= @fUseableLandSQFTFrom) and
			(@fUseableLandSQFTTo is null or lcs.total_useable_square_feet <= @fUseableLandSQFTTo) and
			(@fUseableLandAcresFrom is null or lcs.total_useable_acres >= @fUseableLandAcresFrom) and
			(@fUseableLandAcresTo is null or lcs.total_useable_acres <= @fUseableLandAcresTo) and
			(@fLandUnitPriceFrom is null or pp.land_unit_price >= @fLandUnitPriceFrom) and
			(@fLandUnitPriceTo is null or pp.land_unit_price <= @fLandUnitPriceTo) and
			(@dtSaleDateFrom is null or cs.sl_dt >= @dtSaleDateFrom) and
			(@dtSaleDateTo is null or cs.sl_dt < @dtSaleDateTo)
	end
	else /* Sold and unsold */
	begin
		select
			pp.prop_id,
			pp.school_id,
			pp.city_id,
			pp.state_cd,
			pp.region,
			pp.abs_subdv,
			pp.neighborhood,
			pp.subset,
			pp.map_id,
			pp.land_type_cd,
			pp.land_sqft,
			pp.land_acres,
			pp.land_unit_price,
			pp.ls_table,
			pp.main_land_unit_price,
			pp.main_land_total_adj,

			pp.utilities,
			pp.topography,
			pp.road_access,
			pp.zoning,
			pp.sub_market_cd,
			pp.property_use_cd,
			pp.visibility_access_cd,
			pp.last_appraisal_dt,

			pv.land_hstd_val,
			pv.land_non_hstd_val,
			pv.ag_market,
			pv.timber_market,
			pv.market,

			p.geo_id,

			s.situs_display,

			cs.chg_of_owner_id,
			cs.sl_type,
			cs.sl_dt,
			cs.sl_price,
			cs.adjusted_sl_price,
			cs.sl_ratio_type_cd,

			lcs.total_acres,
			lcs.total_square_feet,
			lcs.total_useable_acres,
			lcs.total_useable_square_feet,
			lcs.total_land_market

		from property_profile as pp with(nolock)
		left outer join comp_sales_prop_sale_vw as cs with(nolock) on
			pp.prop_id = cs.prop_id and
			(@blnSaleType = 0 or cs.sl_type_cd in (select szSaleType from #comp_sales_search_criteria_sale_type)) and
			(@blnSaleRatio = 0 or cs.sl_ratio_type_cd in (select szSaleRatio from #comp_sales_search_criteria_sale_ratio)) and
			(@dtSaleDateFrom is null or cs.sl_dt >= @dtSaleDateFrom) and
			(@dtSaleDateTo is null or cs.sl_dt < @dtSaleDateTo)
		left outer join comp_sales_land_sale_vw as lcs with(nolock) on
			cs.chg_of_owner_id = lcs.chg_of_owner_id
		join property_val as pv with(nolock) on
			pp.prop_val_yr = pv.prop_val_yr and
			pp.sup_num = pv.sup_num and
			pp.prop_id = pv.prop_id
		join property as p with(nolock) on
			pp.prop_id = p.prop_id
		left outer join situs as s with(nolock) on
			pp.prop_id = s.prop_id and
			s.primary_situs = 'Y'
		where
			pp.prop_val_yr = @lYear and
			(@blnNeighborhood = 0 or pp.neighborhood in (select szNeighborhood from #comp_sales_search_criteria_neighborhood)) and
			(@blnAbsSubdv = 0 or pp.abs_subdv in (select szAbsSubdv from #comp_sales_search_criteria_abs_subdv)) and
			(@blnSchool = 0 or pp.school_id in (select lSchool from #comp_sales_search_criteria_school)) and
			(@blnCity = 0 or pp.city_id in (select lCity from #comp_sales_search_criteria_city)) and
			(@blnStateCode = 0 or pp.state_cd in (select szStateCode from #comp_sales_search_criteria_state_code)) and
			(@blnRegion = 0 or pp.region in (select szRegion from #comp_sales_search_criteria_region)) and
			(@blnSubset = 0 or pp.subset in (select szSubset from #comp_sales_search_criteria_subset)) and
			(@blnMapID = 0 or pp.map_id in (select szMapID from #comp_sales_search_criteria_map_id)) and
			(@blnLandType = 0 or pp.land_type_cd in (select szLandType from #comp_sales_search_criteria_land_type)) and
			(@blnUtilities = 0 or pp.utilities in (select szUtilities from #comp_sales_search_criteria_utilities)) and
			(@blnTopography = 0 or pp.topography in (select szTopography from #comp_sales_search_criteria_topography)) and
			(@blnRoadAccess = 0 or pp.road_access in (select szRoadAccess from #comp_sales_search_criteria_road_access)) and
			(@blnZoning = 0 or pp.zoning in (select szZoning from #comp_sales_search_criteria_zoning)) and
			(@blnSubMarket = 0 or pp.sub_market_cd in (select szSubMarket from #comp_sales_search_criteria_sub_market)) and
			(@blnPropertyUse = 0 or pp.property_use_cd in (select szPropertyUse from #comp_sales_search_criteria_property_use)) and
			(@blnCVA = 0 or pp.visibility_access_cd in (select szCVA from #comp_sales_search_criteria_cva)) and
			(@fLandSQFTFrom is null or lcs.total_square_feet >= @fLandSQFTFrom) and
			(@fLandSQFTTo is null or lcs.total_square_feet <= @fLandSQFTTo) and
			(@fLandAcresFrom is null or lcs.total_acres >= @fLandAcresFrom) and
			(@fLandAcresTo is null or lcs.total_acres <= @fLandAcresTo) and
			(@fUseableLandSQFTFrom is null or lcs.total_useable_square_feet >= @fUseableLandSQFTFrom) and
			(@fUseableLandSQFTTo is null or lcs.total_useable_square_feet <= @fUseableLandSQFTTo) and
			(@fUseableLandAcresFrom is null or lcs.total_useable_acres >= @fUseableLandAcresFrom) and
			(@fUseableLandAcresTo is null or lcs.total_useable_acres <= @fUseableLandAcresTo) and
			(@fLandUnitPriceFrom is null or pp.land_unit_price >= @fLandUnitPriceFrom) and
			(@fLandUnitPriceTo is null or pp.land_unit_price <= @fLandUnitPriceTo)
	end

	return( @@rowcount )

GO

