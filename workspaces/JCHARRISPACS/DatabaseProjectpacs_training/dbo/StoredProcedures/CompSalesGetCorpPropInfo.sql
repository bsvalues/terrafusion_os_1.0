

create procedure CompSalesGetCorpPropInfo
	@lPropID int,
	@lSaleID int,
	@lYear numeric(4,0),
	@bOutputRS bit = 1,
	@szSitus varchar(512) = null output,
	@szClassCode varchar(10) = null output,
	@szSubmarket varchar(10) = null output,
	@szPropertyUse varchar(10) = null output,
	@szFinanceCode char(5) = null output,
	@szSaleDate varchar(16) = null output,
	@lLivingArea numeric(14,0) = null output,
	@fLandSizeSQFT numeric(18,2) = null output,
	@lEffYearBuilt numeric(4,0) = null output,
	@szCVA varchar(10) = null output,
	@lNumUnits int = null output,
	@lMarket numeric(14,0) = null output,
	@lSalePrice numeric(14,0) = null output,
	@lYearBuilt numeric(4,0) = null output,
	@szImagePath varchar(255) = null output,
	@fPctLandVal float(24) = null output,
	@fPctImprovVal float(24) = null output,
	@cInCounty char(1) = null output,
	@fPctBusinessValue float(24) = null output,
	@szDBAName varchar(50) = null output,
	@lSaleAdjustmentAmount numeric(14,0) = null output,
	@fSaleAdjustmentPct numeric(8,4) = null output,
	@szSaleAdjustmentReason varchar(50) = null output,
	@lAdjustedSalePrice numeric(14,0) = null output,
	@szRegion varchar(10) = null output,
	@szSubdivision varchar(10) = null output,
	@szNeighborhood varchar(10) = null output,
	@szSubset varchar(10) = null output,
	@szSchool char(5) = null output,
	@szCity char(5) = null output,
	@szStateCode varchar(10) = null output,
	@lNRA numeric(14,0) = null output,
	@lEffectiveYear numeric(4,0) = null output,
	@lPGI numeric(14,2) = null output,
	@lEGI numeric(14,2) = null output,
	@lNOI numeric(14,2) = null output,
	@lCapRate numeric(5,2) = null output,
	@lEXP numeric(14,2) = null output,
	@lVAC numeric(5,2) = null output,
	@lAppraisedVal numeric(14,2) = null output,
	@szIncomeClass varchar(10) = null output,
	@szSubClassCode varchar(10) = null output


as

set nocount on

	declare @lSupNum int
	select @lSupNum = sup_num
	from prop_supp_assoc with(nolock)
	where
		prop_id = @lPropID and
		owner_tax_yr = @lYear

	/* Get the number of improvements */
	set @lNumUnits = 0
	select
		@lNumUnits = sum(num_imprv)
	from imprv with(nolock)
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = 0

	if ( @lSaleID is null )
	begin
		/* Get the sale information */
		select
			@lSaleID = max(co.chg_of_owner_id)
		from chg_of_owner_prop_assoc as co with(nolock)
		join sale as s with(nolock) on
			co.chg_of_owner_id = s.chg_of_owner_id
		where
			co.prop_id = @lPropID and
			isnull(s.sl_price, 0) > 0
	end

	declare @fPctBuildingValue float(24)
	declare @fPctLandValue float(24)

	select
		@fPctBuildingValue = fPctBuildingArea,
		@fPctLandValue = fPctLandArea,
		@fPctBusinessValue = fPctBusinessValue
	from comp_sales_config with(nolock)
	where
		lYear = @lYear

	select
		@szSitus = LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')),
		@szClassCode = rtrim(IsNull(pp.class_cd,'')),
		@szSubmarket = pv.sub_market_cd,
		@szPropertyUse = pv.property_use_cd,
		@szFinanceCode = sale.sl_financing_cd,
		@szSaleDate = convert(varchar(16), sale.sl_dt, 101),
		@lLivingArea = pp.living_area,
		@lEffYearBuilt = isnull(pp.eff_yr_blt, 0),
		@szCVA = pv.visibility_access_cd,
		@lMarket = pv.market,
		@lSalePrice = sale.sl_price,
		@lSaleAdjustmentAmount = isnull(sale.sl_adj_sl_amt, 0),
		@fSaleAdjustmentPct = isnull(sale.sl_adj_sl_pct, 0.00),
		@szSaleAdjustmentReason = rtrim(isnull(sale.sl_adj_rsn, '')),
		@lAdjustedSalePrice = isnull(sale.adjusted_sl_price, isnull(sale.sl_price, 0)),
		@lYearBuilt = isnull(pp.yr_blt, 0),
		@szImagePath = pv.image_path,
		@fLandSizeSQFT = isnull(pp.land_sqft, isnull(pp.land_acres, 0) * 43560),
		@fPctLandVal = case
			when
				abs_subdv.cInCounty = 'T'
			then
				convert(float(24), pv.land_hstd_val + pv.land_non_hstd_val) / convert(float(24), pv.market)
			else
				@fPctLandValue / 100.0
		end
		,
		@fPctImprovVal = case
			when
				abs_subdv.cInCounty = 'T'
			then
				convert(float(24), pv.imprv_hstd_val + pv.imprv_non_hstd_val) / convert(float(24), pv.market)
			else
				@fPctBuildingValue / 100.0
		end
		,
		@cInCounty = abs_subdv.cInCounty,
		@szDBAName = p.dba_name,
		@lNRA = ipv.NRA,
		@lNOI = ipv.NOIRSF,
		@lCapRate = ipv.CAPR,
		@lPGI = ipv.GPIRSF,
		@lEGI = ipv.EGIRSF,
		@lVAC = ipv.VR,
		@lEXP = ipv.EXPRSF,
		@szIncomeClass = ipv.class,
		@lAppraisedVal = ipv.INDRSF,
		@szRegion = pp.region,
		@szSubdivision = pp.abs_subdv,
		@szNeighborhood = pp.neighborhood,
		@szSubset = pp.subset,
		@szSchool = school_entity.entity_cd,
		@szCity = city_entity.entity_cd,
		@szStateCode = pp.state_cd,
		@szSubClassCode = rtrim(IsNull(pp.imprv_det_sub_class_cd,''))
	from property_profile as pp with(nolock)
	join property_val as pv with(nolock) on
		pp.prop_id = pv.prop_id and
		pp.prop_val_yr = pv.prop_val_yr and
		pp.sup_num = pv.sup_num
	join property as p with(nolock) on
		pv.prop_id = p.prop_id
	join abs_subdv with(nolock) on
		pp.abs_subdv = abs_subdv.abs_subdv_cd
	left outer join entity as city_entity with(nolock) on
		pp.city_id = city_entity.entity_id
	left outer join entity as school_entity with(nolock) on
		pp.school_id = school_entity.entity_id
	left outer join sale with(nolock) on
		sale.chg_of_owner_id = @lSaleID
	left outer join situs as s with(nolock) on
		pp.prop_id = s.prop_id and
		s.primary_situs = 'Y'
	left outer join income_prop_vw as ipv with(nolock) on
		pv.prop_id = ipv.prop_id and 
		pv.prop_val_yr = ipv.prop_val_yr and
		pp.sup_num = ipv.sup_num and
		ipv.active_valuation = 'T'
	where
		pp.prop_id = @lPropID and
		pp.prop_val_yr = @lYear and
		pp.sup_num = @lSupNum

	if (@bOutputRS = 1)
	begin
		select
			location = @szSitus,
			class_cd = @szClassCode,
			sub_market_cd = @szSubmarket,
			property_use_cd = @szPropertyUse,
			sl_financing_cd = @szFinanceCode,
			sl_dt = @szSaleDate,
			living_area = @lLivingArea,
			land_size_sqft = @fLandSizeSQFT,
			eff_year_built = @lEffYearBuilt,
			visibility_access_cd = @szCVA,
			num_units = @lNumUnits,
			market = @lMarket,
			sl_price = @lSalePrice,
			year_built = @lYearBuilt,
			image_path = @szImagePath,
			fPctLandVal = @fPctLandVal,
			fPctImprovVal = @fPctImprovVal,
			cInCounty = @cInCounty,
			fPctBusinessValue = @fPctBusinessValue,
			szDBAName = @szDBAName,
			sale_adjustment_amount = @lSaleAdjustmentAmount,
			sale_adjustment_pct = @fSaleAdjustmentPct,
			sale_adjustment_reason = @szSaleAdjustmentReason,
			adjusted_sale_price = @lAdjustedSalePrice,
			region =  @szRegion,       
			subdivision = @szSubdivision,  
			neighborhood = @szNeighborhood, 
			subset = @szSubset,       
			school = @szSchool,       
			city = @szCity,         
			statecode = @szStateCode,
			nra = @lNRA,
			effective_age = @lEffectiveYear,
			pgi_sft = @lPGI,           
			egi_sft = @lEGI,           
			noi_sft = @lNOI,           
			cap_rate = @lCapRate,       
			expense_sft = @lEXP,           
			vacancy_sft = @lVAC,           
			appraised_val_sft = @lAppraisedVal,
			income_class = @szIncomeClass,
			sub_class_cd = @szSubClassCode
	end

set nocount off

GO

