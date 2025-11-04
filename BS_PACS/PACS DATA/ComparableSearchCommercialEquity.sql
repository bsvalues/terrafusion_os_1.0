
create procedure ComparableSearchCommercialEquity

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

	@blnIncomeClass bit,
	@fIncomeApprFrom numeric(14,2),
	@fIncomeApprTo numeric(14,2),
	@fCapRateFrom numeric(5,2),
	@fCapRateTo numeric(5,2),
	@fEGIFrom numeric(14,2),
	@fEGITo numeric(14,2),
	@fEXPFrom numeric(14,2),
	@fEXPTo numeric(14,2),
	@fNOIFrom numeric(14,2),
	@fNOITo numeric(14,2),
	@fGPIFrom numeric(14,2),
	@fGPITo numeric(14,2),
	@fVacancyFrom numeric(5,2),
	@fVacancyTo numeric(5,2)

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

		s.situs_display,

		pp.land_front_feet,

		pv.imprv_hstd_val,
		pv.imprv_non_hstd_val,
		pv.land_hstd_val,
		pv.land_non_hstd_val,
		pv.ag_market,
		pv.timber_market,
		pv.market,
		i.nra,
		upper(rtrim(pv.appr_method)),
		i.value_method,
		p.geo_id,
		a.file_as_name,
		upper(rtrim(pp.map_id)),
		pp.imprv_unit_price,
		pp.imprv_add_val,
		upper(rtrim(pp.land_type_cd)),
		pp.land_unit_price,
		upper(rtrim(pp.condition_cd)),
		pp.percent_complete,
		upper(rtrim(pp.ls_table)),
		pp.main_land_unit_price,
		pp.main_land_total_adj,
		pp.size_adj_pct,
		upper(rtrim(pp.heat_ac_code)),
		i.gpirsf,
		i.egirsf,
		i.vr,
		i.exprsf,
		i.noirsf,
		i.capr,
		i.lu_cost,
		i.land,
		i.pers

	from property_profile as pp with(nolock)
	join state_code as sc with(nolock) on
		pp.state_cd = sc.state_cd and
		sc.commercial_acct_flag = 'T'
	join property_val as pv with(nolock) on
		pp.prop_val_yr = pv.prop_val_yr and
		pp.sup_num = pv.sup_num and
		pp.prop_id = pv.prop_id
	join owner as o with(nolock) on
		pp.prop_val_yr = o.owner_tax_yr and
		pp.sup_num = o.sup_num and
		pp.prop_id = o.prop_id
	join account as a with(nolock) on
		o.owner_id = a.acct_id
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

		(@blnIncomeClass = 0 or i.class in (select szIncomeClass from #comp_sales_search_criteria_income_class)) and
		(@fIncomeApprFrom is null or i.indrsf >= @fIncomeApprFrom) and
		(@fIncomeApprTo is null or i.indrsf <= @fIncomeApprTo) and
		(@fCapRateFrom is null or i.capr >= @fCapRateFrom) and
		(@fCapRateTo is null or i.capr <= @fCapRateTo) and
		(@fEGIFrom is null or i.egirsf >= @fEGIFrom) and
		(@fEGITo is null or i.egirsf <= @fEGITo) and
		(@fEXPFrom is null or i.exprsf >= @fEXPFrom) and
		(@fEXPTo is null or i.exprsf <= @fEXPTo) and
		(@fNOIFrom is null or i.noirsf >= @fNOIFrom) and
		(@fNOITo is null or i.noirsf <= @fNOITo) and
		(@fGPIFrom is null or i.gpirsf >= @fGPIFrom) and
		(@fGPITo is null or i.gpirsf <= @fGPITo) and
		(@fVacancyFrom is null or i.vr >= @fVacancyFrom) and
		(@fVacancyTo is null or i.vr <= @fVacancyTo)

	return( @@rowcount )

GO

