

create procedure CompSalesGetPropInfo
	@lPropID int,
	@lSaleID int,
	@lYear numeric(4,0),
	@bOutputRS bit = 1,
	@szClassCode varchar(10) = null output,
	@szNeighborhood varchar(10) = null output,
	@lLivingArea numeric(14,0) = null output,
	@lYearBuilt numeric(4,0) = null output,
	@szStateCode varchar(10) = null output,
	@szSchool varchar(5) = null output,
	@szCity varchar(5) = null output,
	@szAbsSubdv varchar(10) = null output,
	@szRegion varchar(10) = null output,
	@szSubset varchar(10) = null output,
	@szMapID varchar(20) = null output,
	@lMarket numeric(14,0) = null output,
	@fImprovUnitPrice numeric(14,2) = null output,
	@lImprovAddVal numeric(14,0) = null output,
	@szLandTypeCode varchar(10) = null output,
	@fLandSQFT numeric(18,2) = null output,
	@fLandAcres numeric(18,4) = null output,
	@fLandUnitPrice numeric(14,2) = null output,
	@szCondition varchar(5) = null output,
	@szSubClassCode varchar(10) = null output,
	@szImprovType varchar(10) = null output
as

set nocount on

	if ( @lSaleID is null )
	begin
		/* Find the ID of the row in the sale table with which we can get the sale information */
		select
			@lSaleID = max(c.chg_of_owner_id) /* Ex: The most recent sale */
		from chg_of_owner_prop_assoc as c with(nolock)
		join sale as s with(nolock) on
			c.chg_of_owner_id = s.chg_of_owner_id and
			isnull(s.sl_price, 0) > 0
		where
			c.prop_id = @lPropID

		/* Just in case there were no sale rows with sale price information */
		if @lSaleID is null
		begin
			select
				@lSaleID = max(c.chg_of_owner_id) /* Ex: The most recent sale */
			from chg_of_owner_prop_assoc as c with(nolock)
			where
				c.prop_id = @lPropID
		end
	end

	declare
		@szGEO varchar(50),
		@szFileAsName varchar(70),
		@szSitus varchar(256),
		@lLandValue numeric(14,0),
		@szSaleDate varchar(16),
		@lSalePrice numeric(14,0),
		@szLastAppraisalDate varchar(16),
		@cFinanceCode char(5),
		@szImagePath varchar(255),
		@szMapsco varchar(20),
		@szSaleType varchar(5),
		@lEffYearBuilt numeric(4,0),
		@szSaleConfBuyer varchar(5),
		@szSaleConfSeller varchar(5),
		@fPctComplete numeric(5,2),
		@szLandTable varchar(25),
		@fMainLandUP numeric(14,2),
		@fMainLandTotalAdj numeric(8,6),
		@fSizeAdjPct numeric(5,2),
		@lImprovVal numeric(14,0),
		@lSaleAdjustmentAmount numeric(14,0),
		@fSaleAdjustmentPct numeric(8,4),
		@szSaleAdjustmentReason varchar(50),
		@lAdjustedSalePrice numeric(14,0),
		@szPropUseCode varchar(10),
		@szSubsetCode varchar(5)
	select
		@fLandUnitPrice = pp.land_unit_price,
		@fLandSQFT = pp.land_sqft,
		@fLandAcres = pp.land_acres,
		@szLandTypeCode = pp.land_type_cd,
		@fImprovUnitPrice = pp.imprv_unit_price,
		@lImprovAddVal = pp.imprv_add_val,
		@szRegion = pp.region,
		@szSubset = pp.subset,
		/* Note that the above fields are not presently returned in the recordset, if requested */
		@szGEO = p.geo_id,
		@szFileAsName = a.file_as_name,
		@szSitus = LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')),
		@szSchool = rtrim(school.entity_cd),
		@szCity = rtrim(city.entity_cd),
		@szStateCode = pp.state_cd,
		@szAbsSubdv = pp.abs_subdv,
		@szNeighborhood = pp.neighborhood,
		@szClassCode = rtrim(isnull(pp.class_cd,'')),
		@lLivingArea = pp.living_area,
		@lYearBuilt = isnull(pp.yr_blt, 0),
		@lLandValue = case
			when (
				isnull(pv.land_hstd_val, 0) +
				isnull(pv.land_non_hstd_val, 0) +
				isnull(pv.ag_market, 0) +
				isnull(pv.timber_market, 0)
			) > 0
			then (
				isnull(pv.land_hstd_val, 0) +
				isnull(pv.land_non_hstd_val, 0) +
				isnull(pv.ag_market, 0) +
				isnull(pv.timber_market, 0)
			)
			else
				0
		end,
		@lMarket = pv.market,
		@szSaleDate = convert(varchar(16), sale.sl_dt, 101),
		@lSalePrice = sale.sl_price,
		@lSaleAdjustmentAmount = isnull(sale.sl_adj_sl_amt, 0),
		@fSaleAdjustmentPct = isnull(sale.sl_adj_sl_pct, 0.00),
		@szSaleAdjustmentReason = rtrim(isnull(sale.sl_adj_rsn, '')),
		@lAdjustedSalePrice = isnull(sale.adjusted_sl_price, isnull(sale.sl_price, 0)),
		@szLastAppraisalDate = convert(varchar(16), pv.last_appraisal_dt, 101),
		@fLandAcres = pp.land_acres,
		@cFinanceCode = sale.sl_financing_cd,
		@szMapID = pp.map_id,
		@lEffYearBuilt = case
			when
				isnull(pp.eff_yr_blt, 0) > 0
			then
				pp.eff_yr_blt
			else
				isnull(pp.yr_blt, 0)
		end,
		@szImagePath = pv.image_path,
		@szMapsco = pv.mapsco,
		@szSaleType = rtrim(sale.sl_type_cd),
		@szSaleConfBuyer = rtrim(sale_conf.buyer_conf_lvl_cd),
		@szSaleConfSeller = rtrim(sale_conf.seller_conf_lvl_cd),
		@szCondition = rtrim(pp.condition_cd),
		@fPctComplete = pp.percent_complete,
		@szLandTable = pp.ls_table,
		@fMainLandUP = pp.main_land_unit_price,
		@fMainLandTotalAdj = pp.main_land_total_adj,
		@lImprovVal = (pv.imprv_hstd_val + pv.imprv_non_hstd_val),
		@fSizeAdjPct = pp.size_adj_pct,
		@szPropUseCode = pv.property_use_cd,
		@szSubsetCode = pv.subset_cd,
		@szSubClassCode = rtrim(isnull(pp.imprv_det_sub_class_cd,'')),
		@szImprovType = rtrim(isnull(pp.imprv_type_cd, ''))
	from prop_supp_assoc as psa with(nolock)
	join property_profile as pp with(nolock) on
		pp.prop_id = psa.prop_id and
		pp.prop_val_yr = psa.owner_tax_yr and
		pp.sup_num = psa.sup_num
	join property as p with(nolock) on
		pp.prop_id = p.prop_id
	join property_val as pv with(nolock) on
		pp.prop_id = pv.prop_id and
		pp.prop_val_yr = pv.prop_val_yr and
		pp.sup_num = pv.sup_num
	left outer join situs as s with(nolock) on
		pp.prop_id = s.prop_id and
		s.primary_situs = 'Y'
	left outer join entity as school with(nolock) on
		pp.school_id = school.entity_id
	left outer join entity as city with(nolock) on
		pp.city_id = city.entity_id
	join owner as o with(nolock) on
		pp.prop_id = o.prop_id and
		pp.prop_val_yr = o.owner_tax_yr and
		pp.sup_num = o.sup_num
	join account as a with(nolock) on
		o.owner_id = a.acct_id
	left outer join sale with(nolock) on
		sale.chg_of_owner_id = @lSaleID
	left outer join sale_conf with(nolock) on
		sale_conf.chg_of_owner_id = @lSaleID
	where
		psa.prop_id = @lPropID and
		psa.owner_tax_yr = @lYear

	declare
		@lImprovementCount int,
		@fNeighborhoodImprovMassAdj numeric(5,2)

	select @lImprovementCount = count(*)
	from prop_supp_assoc as psa with(nolock)
	join imprv as i with(nolock) on
		i.prop_id = psa.prop_id and
		i.prop_val_yr = psa.owner_tax_yr and
		i.sup_num = psa.sup_num and
		i.sale_id = 0
	where
		psa.prop_id = @lPropID and
		psa.owner_tax_yr = @lYear

	select @fNeighborhoodImprovMassAdj = hood_imprv_pct
	from neighborhood with(nolock)
	where
		hood_cd = @szNeighborhood and
		hood_yr = @lYear

	set @lImprovementCount = isnull(@lImprovementCount, 0)
	set @fNeighborhoodImprovMassAdj = isnull(@fNeighborhoodImprovMassAdj, 100.0)
		
set nocount off

	if (@bOutputRS = 1)
	begin
		select
			geo_id = @szGEO,
			file_as_name = @szFileAsName,
			location = @szSitus,
			school_cd = @szSchool,
			city_cd = @szCity,
			state_cd = @szStateCode,
			abs_subdv = @szAbsSubdv,
			neighborhood = @szNeighborhood,
			class_cd = @szClassCode,
			living_area = @lLivingArea,
			yr_blt = @lYearBuilt,
			land_value = @lLandValue,
			market = @lMarket,
			sl_dt = @szSaleDate,
			sl_price = @lSalePrice,
			last_appraisal_dt = @szLastAppraisalDate,
			land_acres = @fLandAcres,
			sl_financing_cd = @cFinanceCode,
			map_id = @szMapID,
			eff_yr_blt = @lEffYearBuilt,
			image_path = @szImagePath,
			mapsco = @szMapsco,
			sl_type_cd = @szSaleType,
			buyer_conf_lvl_cd = @szSaleConfBuyer,
			seller_conf_lvl_cd = @szSaleConfSeller,
			condition_cd = @szCondition,
			percent_complete = @fPctComplete,
			ls_table = @szLandTable,
			main_land_unit_price = @fMainLandUP,
			main_land_total_adj = @fMainLandTotalAdj,
			size_adj_pct = @fSizeAdjPct,
			improv_val = @lImprovVal,
			land_sqft = @fLandSQFT,
			effective_land_price = (@fMainLandUP * @fMainLandTotalAdj),
			sale_adjustment_amount = @lSaleAdjustmentAmount,
			sale_adjustment_pct = @fSaleAdjustmentPct,
			sale_adjustment_reason = @szSaleAdjustmentReason,
			adjusted_sale_price = @lAdjustedSalePrice,
			property_use_cd = @szPropUseCode,
			subset_cd = @szSubsetCode,
			sub_class_cd = @szSubClassCode,
			improvement_count = @lImprovementCount,
			neighborhood_improv_mass_adj = @fNeighborhoodImprovMassAdj
	end

GO

