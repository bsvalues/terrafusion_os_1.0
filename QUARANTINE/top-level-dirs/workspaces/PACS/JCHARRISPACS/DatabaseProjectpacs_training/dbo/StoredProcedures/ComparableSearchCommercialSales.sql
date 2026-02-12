
create procedure ComparableSearchCommercialSales

	@lYear numeric(4,0),

	@blnRegion bit,
	@blnAbsSubdv bit,
	@blnNeighborhood bit,
	@blnSubset bit,
	@blnSchool bit,
	@blnCity bit,
	@blnStateCode bit,
	@blnSubMarket bit,
	@blnPropertyUse bit,
	@blnCVA bit,
	@blnImprovClass bit,
	@blnImprovSubClass bit,

	@lBuildingAreaFrom numeric(14,0),
	@lBuildingAreaTo numeric(14,0),

	@fLandSQFTFrom numeric(18,2),
	@fLandSQFTTo numeric(18,2),
	@fLandAcresFrom numeric(18,4),
	@fLandAcresTo numeric(18,4),

	@lYearFrom numeric(4,0),
	@lYearTo numeric(4,0),
	@lEffYearFrom numeric(4,0),
	@lEffYearTo numeric(4,0),

	@lNumUnitsFrom int,
	@lNumUnitsTo int,
	@lNRAFrom numeric(14,0),
	@lNRATo numeric(14,0),

	@dtSaleDateFrom datetime,
	@dtSaleDateTo datetime,
	@blnSaleRatio bit

as

	/* The input may be, for example, Feb 19 2005, however, we want to include sales on that day */
	set @dtSaleDateTo = dateadd(day, 1, @dtSaleDateTo)

	select
		pp.prop_id,
		pp.school_id,
		pp.city_id,
		upper(rtrim(pp.state_cd)),
		upper(rtrim(pp.region)),
		upper(rtrim(pp.abs_subdv)),
		upper(rtrim(pp.neighborhood)),
		upper(rtrim(pp.subset)),
		pp.land_sqft,
		pp.land_acres,
		upper(rtrim(pp.class_cd)),
		upper(rtrim(pp.imprv_det_sub_class_cd)),
		convert(int, pp.yr_blt),
		convert(int, pp.eff_yr_blt),
		pp.living_area,
		upper(rtrim(pp.sub_market_cd)),
		upper(rtrim(pp.property_use_cd)),
		upper(rtrim(pp.visibility_access_cd)),
		pp.num_imprv,

		p.dba_name,

		s.situs_num,
		s.situs_street,
		s.situs_city,

		cs.chg_of_owner_id,
		cs.sl_dt,
		cs.sl_price

	from property_profile as pp with(nolock)
	join state_code as sc with(nolock) on
		pp.state_cd = sc.state_cd and
		sc.commercial_acct_flag = 'T'
	join comp_sales_prop_sale_vw as cs with(nolock) on
		pp.prop_id = cs.prop_id
	join property_val as pv with(nolock) on
		pp.prop_val_yr = pv.prop_val_yr and
		pp.sup_num = pv.sup_num and
		pp.prop_id = pv.prop_id
	join property as p with(nolock) on
		pp.prop_id = p.prop_id
	left outer join income_prop_vw as i with(nolock) on
		pp.prop_id = i.prop_id and
		pp.prop_val_yr = i.prop_val_yr and
		pp.sup_num = i.sup_num and
		i.active_valuation = 'T'
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
		(@blnSaleRatio = 0 or cs.sl_ratio_type_cd in (select szSaleRatio from #comp_sales_search_criteria_sale_ratio)) and
		(@blnSubMarket = 0 or pp.sub_market_cd in (select szSubMarket from #comp_sales_search_criteria_sub_market)) and
		(@blnPropertyUse = 0 or pp.property_use_cd in (select szPropertyUse from #comp_sales_search_criteria_property_use)) and
		(@blnCVA = 0 or pp.visibility_access_cd in (select szCVA from #comp_sales_search_criteria_cva)) and
		(@blnImprovClass = 0 or pp.class_cd in (select szImprovClass from #comp_sales_search_criteria_improv_class)) and
		(@blnImprovSubClass = 0 or pp.imprv_det_sub_class_cd in (select szImprovSubClass from #comp_sales_search_criteria_improv_subclass)) and
		(@lBuildingAreaFrom is null or pp.living_area >= @lBuildingAreaFrom) and
		(@lBuildingAreaTo is null or pp.living_area <= @lBuildingAreaTo) and
		(@lNRAFrom is null or i.nra >= @lNRAFrom) and
		(@lNRATo is null or i.nra <= @lNRATo) and
		(@lNumUnitsFrom is null or pp.num_imprv >= @lNumUnitsFrom) and
		(@lNumUnitsTo is null or pp.num_imprv <= @lNumUnitsTo) and
		(@fLandSQFTFrom is null or pp.land_sqft >= @fLandSQFTFrom) and
		(@fLandSQFTTo is null or pp.land_sqft <= @fLandSQFTTo) and
		(@fLandAcresFrom is null or pp.land_acres >= @fLandAcresFrom) and
		(@fLandAcresTo is null or pp.land_acres <= @fLandAcresTo) and
		(@lYearFrom is null or pp.yr_blt >= @lYearFrom) and
		(@lYearTo is null or pp.yr_blt <= @lYearTo) and
		(@lEffYearFrom is null or pp.eff_yr_blt >= @lEffYearFrom) and
		(@lEffYearTo is null or pp.eff_yr_blt <= @lEffYearTo) and
		(@dtSaleDateFrom is null or cs.sl_dt >= @dtSaleDateFrom) and
		(@dtSaleDateTo is null or cs.sl_dt < @dtSaleDateTo)

	return( @@rowcount )

GO

