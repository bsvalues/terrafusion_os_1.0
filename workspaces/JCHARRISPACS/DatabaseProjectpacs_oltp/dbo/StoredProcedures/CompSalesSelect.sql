
create procedure CompSalesSelect
	@lSubjectPropID int,
	@lSubjectPropYear numeric(4,0),
	@lPacsUserID int,
	@szRegionCodes varchar(512),
	@szAbsSubdvCodes varchar(512),
	@szNeighborhoodCodes varchar(512),
	@szSubsetCodes varchar(512),
	@szMapIDs varchar(512),
	@szSchoolCodes varchar(512),
	@szCityCodes varchar(512),
	@szStateCodes varchar(512),
	@szMarketValFrom varchar(16),
	@szMarketValTo varchar(16),
	@szClassCodes varchar(512),
	@szLivingAreaFrom varchar(16),
	@szLivingAreaTo varchar(16),
	@szYearBuiltFrom varchar(16),
	@szYearBuiltTo varchar(16),
	@szImprvUnitPriceFrom varchar(16),
	@szImprvUnitPriceTo varchar(16),
	@szImprvAddValFrom varchar(16),
	@szImprvAddValTo varchar(16),
	@szLandTypeCodes varchar(512),
	@szLandAcresFrom varchar(16),
	@szLandAcresTo varchar(16),
	@szLandSQFTFrom varchar(16),
	@szLandSQFTTo varchar(16),
	@szLandUnitPriceFrom varchar(16),
	@szLandUnitPriceTo varchar(16),
	@szSaleTypeCodes varchar(512),
	@szSaleFrom varchar(16),
	@szSaleTo varchar(16),
	@szSalePriceFrom varchar(16) = '',
	@szSalePriceTo varchar(16) = '',
	@szSaleRatioCodes varchar(32) = '',
	@szConditionCodes varchar(512) = '',
	@szSubClassCodes varchar(512) = '',
	@szImprovTypeCodes varchar(512) = '',
	@szNeighborhoodLike varchar(11) = ''
as

set nocount on

	declare @szSQL varchar(8000)
	
	set @szSQL = ' property_profile.prop_val_yr = ' + convert(varchar(4), @lSubjectPropYear) + ' and'

	if @szSubClassCodes <> '' and @szSubClassCodes <> '<ALL>'
	begin
		exec BuildINString @szSubClassCodes output
		set @szSQL = @szSQL + ' property_profile.imprv_det_sub_class_cd in (' + @szSubClassCodes + ') and'
	end

	if @szImprovTypeCodes <> '' and @szImprovTypeCodes <> '<ALL>'
	begin
		exec BuildINString @szImprovTypeCodes output
		set @szSQL = @szSQL + ' property_profile.imprv_type_cd in (' + @szImprovTypeCodes + ') and'
	end

	if @szSaleRatioCodes <> '' and @szSaleRatioCodes <> '<ALL>'
	begin
		exec BuildINString @szSaleRatioCodes output
		set @szSQL = @szSQL + ' sale.sl_ratio_type_cd in (' + @szSaleRatioCodes + ') and'
	end

	if @szSaleTypeCodes <> '' and @szSaleTypeCodes <> '<ALL>'
	begin
		exec BuildINString @szSaleTypeCodes output
		set @szSQL = @szSQL + ' sale.sl_type_cd in (' + @szSaleTypeCodes + ') and'
	end
		
	if @szSalePriceFrom <> ''
	begin
		set @szSQL = @szSQL + ' sale.sl_price >= ' + @szSalePriceFrom + ' and'
	end
	
	if @szSalePriceTo <> ''
	begin
		set @szSQL = @szSQL + ' sale.sl_price <= ' + @szSalePriceTo + ' and'
	end

	-- Travis Did not want to display any sales with a 0 price. This is specifically for the 
	-- auto grid generation process. Modified by Jon Coco on site @ Travis. 
	-- 3/15/2005
	if (@szSalePriceFrom = '' and @szSalePriceTo = '')
	begin
		set @szSQL = @szSQL + ' sale.sl_price > 0 and  '
	end
		
	
	if @szSaleFrom <> ''
	begin
		set @szSQL = @szSQL + ' sale.sl_dt >= ''' + @szSaleFrom + ''' and'
	end
	
	if @szSaleTo <> ''
	begin
		set @szSQL = @szSQL + ' sale.sl_dt <= ''' + @szSaleTo + ''' and'
	end
	
	if @szClassCodes <> '' and @szClassCodes <> '<ALL>'
	begin
		exec BuildINString @szClassCodes output
		set @szSQL = @szSQL + ' property_profile.class_cd in (' + @szClassCodes + ') and'
	end
	
	if @szLivingAreaFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.living_area >= ' + @szLivingAreaFrom + ' and'
	end
	
	if @szLivingAreaTo <> ''
	begin
			set @szSQL = @szSQL + ' property_profile.living_area <= ' + @szLivingAreaTo + ' and'
	end
	
	if @szYearBuiltFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.yr_blt >= ' + @szYearBuiltFrom + ' and'
	end
	
	if @szYearBuiltTo <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.yr_blt <= ' + @szYearBuiltTo + ' and'
	end
	
	if @szImprvUnitPriceFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.imprv_unit_price >= ' + @szImprvUnitPriceFrom + ' and'
	end
	
	if @szImprvUnitPriceTo <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.imprv_unit_price <= ' + @szImprvUnitPriceTo + ' and'
	end
	
	if @szImprvAddValFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.imprv_add_val >= ' + @szImprvAddValFrom + ' and'
	end
	
	if @szImprvAddValTo <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.imprv_add_val <= ' + @szImprvAddValTo + ' and'
	end
	
	if @szLandTypeCodes <> '' and @szLandTypeCodes <> '<ALL>'
	begin
		exec BuildINString @szLandTypeCodes output
		set @szSQL = @szSQL + ' property_profile.land_type_cd in (' + @szLandTypeCodes + ') and'
	end

	if @szLandSQFTFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.land_sqft >= ' + @szLandSQFTFrom + ' and'
	end
	if @szLandSQFTTo <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.land_sqft <= ' + @szLandSQFTTo + ' and'
	end

	if @szLandAcresFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.land_acres >= ' + @szLandAcresFrom + ' and'
	end
	if @szLandAcresTo <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.land_acres <= ' + @szLandAcresTo + ' and'
	end

	if @szLandUnitPriceFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.land_unit_price >= ' + @szLandUnitPriceFrom + ' and'
	end

	if @szLandUnitPriceTo <> ''
	begin
		set @szSQL = @szSQL + ' property_profile.land_unit_price <= ' + @szLandUnitPriceTo + ' and'
	end

	if @szMarketValFrom <> ''
	begin
		set @szSQL = @szSQL + ' property_val.market >= ' + @szMarketValFrom + ' and'
	end

	if @szMarketValTo <> ''
	begin
		set @szSQL = @szSQL + ' property_val.market <= ' + @szMarketValTo + ' and'
	end

	if @szAbsSubdvCodes <> '' and @szAbsSubdvCodes <> '<ALL>'
	begin
		exec BuildINString @szAbsSubdvCodes output
		set @szSQL = @szSQL + ' property_profile.abs_subdv in (' + @szAbsSubdvCodes + ') and'
	end

	if @szCityCodes <> '' and @szCityCodes <> '<ALL>'
	begin
		exec BuildINString @szCityCodes output
		set @szSQL = @szSQL + ' city_entity.entity_cd in (' + @szCityCodes + ') and'
	end

	if ( @szNeighborhoodLike <> '' )
	begin
		set @szSQL = @szSQL + ' property_profile.neighborhood like ''' + @szNeighborhoodLike + '%'' and'
	end
	else
	begin
		if @szNeighborhoodCodes <> '' and @szNeighborhoodCodes <> '<ALL>'
		begin
			exec BuildINString @szNeighborhoodCodes output
			set @szSQL = @szSQL + ' property_profile.neighborhood in (' + @szNeighborhoodCodes + ') and'
		end
	end

	if @szMapIDs <> '' and @szMapIDs <> '<ALL>'
	begin
		exec BuildINString @szMapIDs output
		set @szSQL = @szSQL + ' property_profile.map_id in (' + @szMapIDs + ') and'
	end

	if @szRegionCodes <> '' and @szRegionCodes <> '<ALL>'
	begin
		exec BuildINString @szRegionCodes output
		set @szSQL = @szSQL + ' property_profile.region in (' + @szRegionCodes + ') and'
	end

	if @szSchoolCodes <> '' and @szSchoolCodes <> '<ALL>'
	begin
		exec BuildINString @szSchoolCodes output
		set @szSQL = @szSQL + ' school_entity.entity_cd in (' + @szSchoolCodes + ') and'
	end

	if @szStateCodes <> '' and @szStateCodes <> '<ALL>'
	begin
		exec BuildINString @szStateCodes output
		set @szSQL = @szSQL + ' property_profile.state_cd in (' + @szStateCodes + ') and'
	end

	if @szSubsetCodes <> '' and @szSubsetCodes <> '<ALL>'
	begin
		exec BuildINString @szSubsetCodes output
		set @szSQL = @szSQL + ' property_profile.subset in (' + @szSubsetCodes + ') and'
	end

	if @szConditionCodes <> '' and @szConditionCodes <> '<ALL>'
	begin
		exec BuildINString @szConditionCodes output
		set @szSQL = @szSQL + ' property_profile.condition_cd in (' + @szConditionCodes + ') and'
	end

	/* We must add one final condition, since we've always appended the and keyword */
	/* Note that this condition will always be true, as it should be */
	set @szSQL = @szSQL + ' 0 = 0'

	exec dbo.PopulateSalesCompPrintSales @lSubjectPropID, @lSubjectPropYear, @lPacsUserID, @szSQL, 'P', 'F', 1

	/* If requested, output the list into the caller's temporary table */
	if (object_id('tempdb..#tmp_arb_comps') is not null)
	begin
		insert #tmp_arb_comps (
			lPropID, lSaleID, fScore
		)
		select distinct
			prop_id, sale_id, convert(numeric(18,10), score)
		from #sales_comp_print
		order by
			 3 desc
	end

set nocount off

GO

