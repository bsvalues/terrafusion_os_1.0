

create procedure CompSalesGetPropLoadCriteria
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lPacsUserID int,
	@szClassCode varchar(10) = '' output,
	@szSaleTypeCodes varchar(255) = '' output,
	@szSaleDateMin varchar(16) = '' output,
	@szSaleDateMax varchar(16) = '' output,
	@szStateCode varchar(10) = '' output,
	@szNeighborhood varchar(10) = '' output,
	@szSchool varchar(5) = '' output,
	@szCity varchar(5) = '' output,
	@szAbsSubdv varchar(10) = '' output,
	@szRegion varchar(10) = '' output,
	@szSubset varchar(10) = '' output,
	@szMapID varchar(20) = '' output,
	@szApprValFrom varchar(16) = '' output,
	@szApprValTo varchar(16) = '' output,
	@szLivingAreaFrom varchar(16) = '' output,
	@szLivingAreaTo varchar(16) = '' output,
	@szYearBuiltFrom varchar(4) = '' output,
	@szYearBuiltTo varchar(4) = '' output,
	@szImprovUnitPriceFrom varchar(16) = '' output,
	@szImprovUnitPriceTo varchar(16) = '' output,
	@szImprovAddValFrom varchar(16) = '' output,
	@szImprovAddValTo varchar(16) = '' output,
	@szLandTypeCode varchar(10) = '' output,
	@szLandAcresFrom varchar(16) = '' output,
	@szLandAcresTo varchar(16) = '' output,
	@szLandSQFTFrom varchar(16) = '' output,
	@szLandSQFTTo varchar(16) = '' output,
	@szLandUnitPriceFrom varchar(16) = '' output,
	@szLandUnitPriceTo varchar(16) = '' output,
	@szSaleRatioCodes varchar(32) = '' output,
	@szConditionCode varchar(5) = '' output,
	@szSubClassCodes varchar(255) = '' output,
	@szImprovementType varchar(10) = '' output,
	@szNeigborhoodLike varchar(24) = '' output
as

set nocount on

	declare
		@load_school_entity varchar(1),
		@load_city_entity varchar(1),
		@load_state_cd varchar(1),
		@load_region_cd varchar(1),
		@load_abs_subdv_cd varchar(1),
		@load_hood_cd varchar(1),
		@load_subset_cd varchar(1),
		@load_map_id varchar(1),
		@load_class_cd varchar(1),
		@load_sale_type varchar(1),
		@load_sale_date varchar(1),
		@load_appr_val varchar(1),
		@load_appr_val_dev int,
		@load_living_area varchar(1),
		@load_living_area_dev int,
		@load_year_built varchar(1),
		@load_year_built_dev int,
		@load_imprv_up varchar(1),
		@load_imprv_up_dev int,
		@load_imprv_add_val varchar(1),
		@load_imprv_add_val_dev int,
		@load_land_type varchar(1),
		@load_land_size_acres varchar(1),
		@load_land_size_acres_dev int,
		@load_land_size_sqft varchar(1),
		@load_land_size_sqft_dev int,
		@load_land_up varchar(1),
		@load_land_up_dev int,
		@load_condition_cd varchar(1),
		@load_subclass_cd varchar(1),
		@load_imprv_type_cd varchar(1),
		@load_hood_like_num_char int,
		@load_subclass_dev int

	select
		@load_school_entity = isnull(school_entity, 'F'),
		@load_city_entity = isnull(city_entity, 'F'),
		@load_state_cd = isnull(state_cd, 'F'),
		@load_region_cd = isnull(region_cd, 'F'),
		@load_abs_subdv_cd = isnull(abs_subdv_cd, 'F'),
		@load_hood_cd = isnull(hood_cd, 'F'),
		@load_subset_cd = isnull(subset_cd, 'F'),
		@load_map_id = isnull(map_id, 'F'),
		@load_class_cd = isnull(class_cd, 'F'),
		@load_sale_type = isnull(sale_type, 'F'),
		@load_sale_date = isnull(sale_date, 'F'),
		@load_appr_val = isnull(appr_val, 'F'),
		@load_appr_val_dev = appr_val_dev,
		@load_living_area = isnull(living_area, 'F'),
		@load_living_area_dev = living_area_dev,
		@load_year_built = isnull(year_built, 'F'),
		@load_year_built_dev = year_built_dev,
		@load_imprv_up = isnull(imprv_up, 'F'),
		@load_imprv_up_dev = imprv_up_dev,
		@load_imprv_add_val = isnull(imprv_add_val, 'F'),
		@load_imprv_add_val_dev = imprv_add_val_dev,
		@load_land_type = isnull(land_type, 'F'),
		@load_land_size_acres = isnull(land_size_acres, 'F'),
		@load_land_size_acres_dev = land_size_acres_dev,
		@load_land_size_sqft = isnull(land_size_sqft, 'F'),
		@load_land_size_sqft_dev = land_size_sqft_dev,
		@load_land_up = isnull(land_up, 'F'),
		@load_land_up_dev = land_up_dev,
		@szSaleTypeCodes = isnull(sale_type_codes, ''),
		@szSaleDateMin = convert(varchar(16), sale_date_range_min, 101),
		@szSaleDateMax = convert(varchar(16), sale_date_range_max, 101),
		@szSaleRatioCodes = isnull(sale_ratio_codes, ''),
		@load_condition_cd = isnull(condition_cd, 'F'),
		@load_subclass_cd = isnull(subclass_cd, 'F'),
		@load_imprv_type_cd = isnull(imprv_type_cd, 'F'),
		@load_hood_like_num_char = isnull(hood_like_num_char, 0),
		@load_subclass_dev = isnull(subclass_dev, 0)
	from sales_comp_load with(nolock)
	where
		criteria_id = 0

	declare
		@lLivingArea numeric(14,0),
		@lYearBuilt numeric(4,0),
		@lMarket numeric(14,0),
		@fImprovUnitPrice numeric(14,2),
		@lImprovAddVal numeric(14,0),
		@fLandSQFT numeric(18,2),
		@fLandAcres numeric(18,4),
		@fLandUnitPrice numeric(14,2)

	exec CompSalesGetPropInfo
		@lPropID,
		NULL,
		@lYear,
		0,
		@szClassCode output,
		@szNeighborhood output,
		@lLivingArea output,
		@lYearBuilt output,
		@szStateCode output,
		@szSchool output,
		@szCity output,
		@szAbsSubdv output,
		@szRegion output,
		@szSubset output,
		@szMapID output,
		@lMarket output,
		@fImprovUnitPrice output,
		@lImprovAddVal output,
		@szLandTypeCode output,
		@fLandSQFT output,
		@fLandAcres output,
		@fLandUnitPrice output,
		@szConditionCode output,
		@szSubClassCodes output,
		@szImprovementType output

	if (@load_school_entity = 'F')
	begin
		set @szSchool = ''
	end

	if (@load_city_entity = 'F')
	begin
		set @szCity = ''
	end

	if (@load_state_cd = 'F')
	begin
		set @szStateCode = ''
	end

	if (@load_region_cd = 'F')
	begin
		set @szRegion = ''
	end

	if (@load_abs_subdv_cd = 'F')
	begin
		set @szAbsSubdv = ''
	end

	if (@load_subset_cd = 'F')
	begin
		set @szSubset = ''
	end

	if (@load_map_id = 'F')
	begin
		set @szMapID = ''
	end

	if (@load_class_cd = 'F')
	begin
		set @szClassCode = ''
	end

	if (@load_sale_type = 'F')
	begin
		set @szSaleTypeCodes = ''
	end

	if (@load_sale_date = 'F')
	begin
		set @szSaleDateMin = ''
		set @szSaleDateMax = ''
	end

	if (@load_condition_cd = 'F')
	begin
		set @szConditionCode = ''
	end

	if ( @load_subclass_cd = 'F' )
	begin
		set @szSubClassCodes = ''
	end
	else
	begin
		if ( @load_subclass_dev > 0 )
		begin
			declare @szCode varchar(23)

			declare @l64SubjectSubClassNumber bigint

			select @l64SubjectSubClassNumber = l64Number
			from code_number_assoc_linear with(nolock)
			where
				szType = 'SUBCLASS' and
				szCode = @szSubClassCodes

			if ( @l64SubjectSubClassNumber is not null )
			begin
				-- Find the other subclasses to add
				declare curSC cursor
				for
					select szCode
					from code_number_assoc_linear with(nolock)
					where
						szType = 'SUBCLASS' and
						l64Number >= (@l64SubjectSubClassNumber - @load_subclass_dev) and
						l64Number <= (@l64SubjectSubClassNumber + @load_subclass_dev) and
						not szCode = @szSubClassCodes
				for read only

				open curSC
				fetch next from curSC into @szCode

				while ( @@fetch_status = 0 )
				begin
					set @szSubClassCodes = @szSubClassCodes + ',' + @szCode

					fetch next from curSC into @szCode
				end

				close curSC
				deallocate curSC
			end
		end
		-- else it remains just the single [subject's] subclass code
	end

	if ( @load_imprv_type_cd = 'F' )
	begin
		set @szImprovementType = ''
	end

	if ( @load_hood_like_num_char = 0 )
	begin
		set @szNeigborhoodLike = ''
	end
	else
	begin
		set @szNeigborhoodLike = rtrim(substring(@szNeighborhood, 1, @load_hood_like_num_char))
		set @szNeighborhood = ''
	end

	if (@load_hood_cd = 'F')
	begin
		set @szNeighborhood = ''
	end

	declare
		@fRange numeric(18,4),
		@lRange int

	if (@load_appr_val = 'T' and isnull(@lMarket, 0) > 0)
	begin
		set @lRange = convert(float(24), @load_appr_val_dev) / 100.0 * @lMarket

		set @szApprValFrom = convert(varchar(16), @lMarket - @lRange)
		set @szApprValTo = convert(varchar(16), @lMarket + @lRange)
	end
	else
	begin
		set @szApprValFrom = ''
		set @szApprValTo = ''
	end

	if (@load_living_area = 'T' and isnull(@lLivingArea, 0) > 0)
	begin
		set @lRange = convert(float(24), @load_living_area_dev) / 100.0 * @lLivingArea

		set @szLivingAreaFrom = convert(varchar(16), @lLivingArea - @lRange)
		set @szLivingAreaTo = convert(varchar(16), @lLivingArea + @lRange)
	end
	else
	begin
		set @szLivingAreaFrom = ''
		set @szLivingAreaTo = ''
	end

	if (@load_year_built = 'T' and isnull(@lYearBuilt, 0) > 0)
	begin
		set @szYearBuiltFrom = convert(varchar(16), @lYearBuilt - @load_year_built_dev)
		set @szYearBuiltTo = convert(varchar(16), @lYearBuilt + @load_year_built_dev)
	end
	else
	begin
		set @szYearBuiltFrom = ''
		set @szYearBuiltTo = ''
	end

	if (@load_imprv_up = 'T' and isnull(@fImprovUnitPrice, 0.0) > 0.0)
	begin
		set @fRange = convert(float(24), @load_imprv_up_dev) / 100.0 * @fImprovUnitPrice

		set @szImprovUnitPriceFrom = convert(varchar(16), @fImprovUnitPrice - @fRange)
		set @szImprovUnitPriceTo = convert(varchar(16), @fImprovUnitPrice + @fRange)
	end
	else
	begin
		set @szImprovUnitPriceFrom = ''
		set @szImprovUnitPriceTo = ''
	end

	if (@load_imprv_add_val = 'T' and isnull(@lImprovAddVal, 0) > 0)
	begin
		set @lRange = convert(float(24), @load_imprv_add_val_dev) / 100.0 * @lImprovAddVal

		set @szImprovAddValFrom = convert(varchar(16), @lImprovAddVal - @lRange)
		set @szImprovAddValTo = convert(varchar(16), @lImprovAddVal + @lRange)
	end
	else
	begin
		set @szImprovAddValFrom = ''
		set @szImprovAddValTo = ''
	end

	if (@load_land_type = 'F')
	begin
		set @szLandTypeCode = ''
	end

	if (@load_land_size_acres = 'T' and isnull(@fLandAcres, 0.0) > 0.0)
	begin
		set @fRange = convert(float(24), @load_land_size_acres_dev) / 100.0 * @fLandAcres

		set @szLandAcresFrom = convert(varchar(16), @fLandAcres - @fRange)
		set @szLandAcresTo = convert(varchar(16), @fLandAcres + @fRange)
	end
	else
	begin
		set @szLandAcresFrom = ''
		set @szLandAcresTo = ''
	end

	if (@load_land_size_sqft = 'T' and isnull(@fLandSQFT, 0.0) > 0.0)
	begin
		set @fRange = convert(float(24), @load_land_size_sqft_dev) / 100.0 * @fLandSQFT

		set @szLandSQFTFrom = convert(varchar(16), @fLandSQFT - @fRange)
		set @szLandSQFTTo = convert(varchar(16), @fLandSQFT + @fRange)
	end
	else
	begin
		set @szLandSQFTFrom = ''
		set @szLandSQFTTo = ''
	end

	if (@load_land_up = 'T' and isnull(@fLandUnitPrice, 0.0) > 0.0)
	begin
		set @fRange = convert(float(24), @load_land_up_dev) / 100.0 * @fLandUnitPrice

		set @szLandUnitPriceFrom = convert(varchar(16), @fLandUnitPrice - @fRange)
		set @szLandUnitPriceTo = convert(varchar(16), @fLandUnitPrice + @fRange)
	end
	else
	begin
		set @szLandUnitPriceFrom = ''
		set @szLandUnitPriceTo = ''
	end

set nocount off

GO

