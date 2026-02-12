
CREATE procedure [dbo].[MoveOneImprovementDetail]

	@source_prop_id		int,
	@source_imprv_id	int,
	@source_sup_num		int,

	@dest_prop_id		int,
	@dest_imprv_id		int,
	@dest_sup_num		int,
	@dest_year			numeric(4,0),

	@imprv_detail_id	int,
	@tax_yr				numeric(4,0),
	@event_type			varchar(20),
	@event_desc			varchar(30),
	@user_id			int,

	@new_imprv_detail_id int,
	@create_event bit = 1

AS
	SET XACT_ABORT ON
	SET NOCOUNT ON
	
	BEGIN TRAN 
	
	DECLARE @sale_id	int
	SET @sale_id = 0

	INSERT INTO imprv_detail 
			 ([prop_id]
           ,[prop_val_yr]
           ,[imprv_id]
           ,[imprv_det_id]
           ,[sup_num]
           ,[sale_id]
           ,[imprv_det_class_cd]
           ,[imprv_det_meth_cd]
           ,[imprv_det_type_cd]
           ,[seq_num]
           ,[imprv_det_val]
           ,[imprv_det_val_source]
           ,[imprv_det_desc]
           ,[imprv_det_area]
           ,[imprv_det_area_type]
           ,[condition_cd]
           ,[cubic_area]
           ,[calc_area]
           ,[sketch_area]
           ,[override_area]
           ,[override_cubic_area]
           ,[override_perimeter]
           ,[perimeter]
           ,[length]
           ,[width]
           ,[height]
           ,[unit_price]
           ,[yr_new]
           ,[yr_built]
           ,[depreciation_yr]
           ,[depreciation_yr_override]
           ,[imprv_det_orig_val]
           ,[imprv_det_orig_up]
           ,[effective_tax_yr]
           ,[imprv_det_adj_factor]
           ,[imprv_det_adj_amt]
           ,[imprv_det_calc_val]
           ,[imprv_det_adj_val]
           ,[imprv_det_flat_val]
           ,[economic_pct]
           ,[physical_pct]
           ,[physical_pct_source]
           ,[functional_pct]
           ,[economic_pct_override]
           ,[physical_pct_override]
           ,[functional_pct_override]
           ,[economic_cmnt]
           ,[physical_cmnt]
           ,[functional_cmnt]
           ,[percent_complete]
           ,[percent_complete_override]
           ,[percent_complete_cmnt]
           ,[new_value_flag]
           ,[new_value]
           ,[new_value_override]
           ,[sketch_cmds]
           ,[use_up_for_pct_base]
           ,[ref_id1]
           ,[reserved1]
           ,[can_close_sketch]
           ,[dep_pct]
           ,[add_factor]
           ,[add_factor_override]
           ,[size_adj_pct]
           ,[dep_pct_override]
           ,[size_adj_pct_override]
           ,[imprv_det_sub_class_cd]
           ,[num_units]
           ,[num_stories]
           ,[stories_multiplier]
           ,[lease_class]
           ,[actual_year_built_override]
           ,[flat_value_comment]
           ,[flat_value_user_id]
           ,[flat_value_date]
           ,[depreciated_replacement_cost_new]
           ,[floor_number]
           ,[load_factor]
           ,[actual_age]
           ,[net_rentable_area]
           ,[imprv_det_cost_unit_price]
           ,[building_id])
    SELECT 
			@dest_prop_id
           ,@dest_year
           ,@dest_imprv_id
           ,@new_imprv_detail_id
           ,@dest_sup_num
           ,[sale_id]
           ,[imprv_det_class_cd]
           ,[imprv_det_meth_cd]
           ,[imprv_det_type_cd]
           ,[seq_num]
           ,[imprv_det_val]
           ,[imprv_det_val_source]
           ,[imprv_det_desc]
           ,[imprv_det_area]
           ,[imprv_det_area_type]
           ,[condition_cd]
           ,[cubic_area]
           ,[calc_area]
           ,[sketch_area]
           ,[override_area]
           ,[override_cubic_area]
           ,[override_perimeter]
           ,[perimeter]
           ,[length]
           ,[width]
           ,[height]
           ,[unit_price]
           ,[yr_new]
           ,[yr_built]
           ,[depreciation_yr]
           ,[depreciation_yr_override]
           ,[imprv_det_orig_val]
           ,[imprv_det_orig_up]
           ,[effective_tax_yr]
           ,[imprv_det_adj_factor]
           ,[imprv_det_adj_amt]
           ,[imprv_det_calc_val]
           ,[imprv_det_adj_val]
           ,[imprv_det_flat_val]
           ,[economic_pct]
           ,[physical_pct]
           ,[physical_pct_source]
           ,[functional_pct]
           ,[economic_pct_override]
           ,[physical_pct_override]
           ,[functional_pct_override]
           ,[economic_cmnt]
           ,[physical_cmnt]
           ,[functional_cmnt]
           ,[percent_complete]
           ,[percent_complete_override]
           ,[percent_complete_cmnt]
           ,[new_value_flag]
           ,[new_value]
           ,[new_value_override]
           ,[sketch_cmds]
           ,[use_up_for_pct_base]
           ,[ref_id1]
           ,[reserved1]
           ,[can_close_sketch]
           ,[dep_pct]
           ,[add_factor]
           ,[add_factor_override]
           ,[size_adj_pct]
           ,[dep_pct_override]
           ,[size_adj_pct_override]
           ,[imprv_det_sub_class_cd]
           ,[num_units]
           ,[num_stories]
           ,[stories_multiplier]
           ,[lease_class]
           ,[actual_year_built_override]
           ,[flat_value_comment]
           ,[flat_value_user_id]
           ,[flat_value_date]
           ,[depreciated_replacement_cost_new]
           ,[floor_number]
           ,[load_factor]
           ,[actual_age]
           ,[net_rentable_area]
           ,[imprv_det_cost_unit_price]
           ,@source_imprv_id
           
	FROM imprv_detail with(nolock)
	WHERE
	imprv_det_id = @imprv_detail_id and
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @source_imprv_id and
	sup_num = @source_sup_num  and
	sale_id = @sale_id	

-- imprv_attr
	UPDATE imprv_attr 
	SET 
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	prop_val_yr = @dest_year,
	imprv_id = @dest_imprv_id,
	imprv_det_id = @new_imprv_detail_id
    WHERE 
	imprv_det_id = @imprv_detail_id and
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @source_imprv_id and
	sup_num = @source_sup_num and
	sale_id = @sale_id and
	imprv_id = @source_imprv_id

-- imprv_remodel
	UPDATE imprv_remodel 
	SET 
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	[year] = @dest_year,
	imprv_assoc = 0,
	imprv_det_assoc = @new_imprv_detail_id
    WHERE 
	imprv_det_assoc = @imprv_detail_id and
	prop_id = @source_prop_id and	
	[year] = @tax_yr and
	imprv_assoc = 0 and
	sup_num = @source_sup_num 

-- imprv_det_adj
	UPDATE imprv_det_adj 
	SET 
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	prop_val_yr = @dest_year,
	imprv_id = @dest_imprv_id,
	imprv_det_id = @new_imprv_detail_id
    WHERE 
	imprv_det_id = @imprv_detail_id and
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @source_imprv_id and
	sup_num = @source_sup_num and
	sale_id = @sale_id and
	imprv_id = @source_imprv_id

	if exists (
		select *
		from ms_config with(nolock)
		where year = @dest_year and commercial_enabled = 1
	)
	begin
		-- cannot do updates due to FK constraints.  Must do inserts, then deletes.
		
		-- Begin imprv_detail_cms_estimate
		insert dbo.imprv_detail_cms_estimate with(rowlock) (
			prop_val_yr,
			sup_num,
			sale_id,
			prop_id,
			imprv_id,
			imprv_det_id,
			zip_code,
			effective_year_built,
			effective_age_adjustment,
			quality_rank,
			local_multiplier,
			local_multiplier_override,
			base_date,
			report_date,
			dep_type,
			dep_pct,
			dep_typical_life,
			dep_physical,
			dep_functional,
			dep_physical_functional,
			dep_external,
			dep_additional_functional,
			calculated_date,
			total_area,
			total_cost_new,
			total_cost_unit_price,
			total_depreciation_amount,
			total_depreciated_cost
		)
		select @dest_year,
			@dest_sup_num,
			sale_id,
			@dest_prop_id,
			@dest_imprv_id,
			@new_imprv_detail_id,
			zip_code,
			effective_year_built,
			effective_age_adjustment,
			quality_rank,
			local_multiplier,
			local_multiplier_override,
			base_date,
			report_date,
			dep_type,
			dep_pct,
			dep_typical_life,
			dep_physical,
			dep_functional,
			dep_physical_functional,
			dep_external,
			dep_additional_functional,
			calculated_date,
			total_area,
			total_cost_new,
			total_cost_unit_price,
			total_depreciation_amount,
			total_depreciated_cost
		from dbo.imprv_detail_cms_estimate
		with (nolock)
		where prop_val_yr = @tax_yr
		and sup_num = @source_sup_num
		and sale_id = @sale_id
		and prop_id = @source_prop_id
		and imprv_id = @source_imprv_id
		and imprv_det_id = @imprv_detail_id
		-- End imprv_detail_cms_estimate
		
		-- Begin imprv_detail_cms_section
		insert dbo.imprv_detail_cms_section with(rowlock) (
			prop_val_yr,
			sup_num,
			sale_id,
			prop_id,
			imprv_id,
			imprv_det_id,
			section_id,
			section_type,
			section_description,
			area,
			stories,
			perimeter_shape_flag,
			perimeter,
			shape,
			effective_year_built,
			effective_year_built_override,
			dep_type,
			dep_pct,
			dep_typical_life,
			dep_physical,
			dep_functional,
			dep_physical_functional,
			dep_external,
			dep_additional_functional,
			dep_override,
			remarks,
			basement_building_section_id,
			calculated_date,
			total_cost_new,
			depreciation_amount,
			depreciated_cost,
			base_cost_total_cost_new,
			base_cost_calc_unit_cost,
			base_cost_depreciation_amount,
			base_cost_depreciated_cost,
			basement_fireproof_flag,
			basement_fireproof_total_cost_new,
			basement_fireproof_calc_unit_cost,
			basement_fireproof_depreciation_amount,
			basement_fireproof_depreciated_cost,
			calc_dep_physical_pct,
			calc_dep_physical_amount,
			calc_dep_functional_pct,
			calc_dep_functional_amount,
			calc_dep_combined_pct,
			calc_dep_combined_amount,
			calc_dep_external_pct,
			calc_dep_external_amount,
			calc_dep_additional_functional_pct,
			calc_dep_additional_functional_amount
		)
		select @dest_year,
			@dest_sup_num,
			sale_id,
			@dest_prop_id,
			@dest_imprv_id,
			@new_imprv_detail_id,
			section_id,
			section_type,
			section_description,
			area,
			stories,
			perimeter_shape_flag,
			perimeter,
			shape,
			effective_year_built,
			effective_year_built_override,
			dep_type,
			dep_pct,
			dep_typical_life,
			dep_physical,
			dep_functional,
			dep_physical_functional,
			dep_external,
			dep_additional_functional,
			dep_override,
			remarks,
			basement_building_section_id,
			calculated_date,
			total_cost_new,
			depreciation_amount,
			depreciated_cost,
			base_cost_total_cost_new,
			base_cost_calc_unit_cost,
			base_cost_depreciation_amount,
			base_cost_depreciated_cost,
			basement_fireproof_flag,
			basement_fireproof_total_cost_new,
			basement_fireproof_calc_unit_cost,
			basement_fireproof_depreciation_amount,
			basement_fireproof_depreciated_cost,
			calc_dep_physical_pct,
			calc_dep_physical_amount,
			calc_dep_functional_pct,
			calc_dep_functional_amount,
			calc_dep_combined_pct,
			calc_dep_combined_amount,
			calc_dep_external_pct,
			calc_dep_external_amount,
			calc_dep_additional_functional_pct,
			calc_dep_additional_functional_amount
		from dbo.imprv_detail_cms_section
		with (nolock)
		where prop_val_yr = @tax_yr
		and sup_num = @source_sup_num
		and sale_id = @sale_id
		and prop_id = @source_prop_id
		and imprv_id = @source_imprv_id
		and imprv_det_id = @imprv_detail_id
		-- End imprv_detail_cms_section
		
		-- Begin imprv_detail_cms_occupancy
		insert dbo.imprv_detail_cms_occupancy with(rowlock) (
			prop_val_yr,
			sup_num,
			sale_id,
			prop_id,
			imprv_id,
			imprv_det_id,
			section_id,
			occupancy_id,
			occupancy_code,
			occupancy_description,
			occupancy_pct,
			class,
			height,
			quality_rank,
			quality_rank_override,
			basement_type,
			basement_type_description,
			basement_area,
			basement_depreciation_pct,
			basement_effective_year_built,
			basement_effective_year_built_override,
			basement_typical_life,
			basement_typical_life_override
		)
		select @dest_year,
			@dest_sup_num,
			sale_id,
			@dest_prop_id,
			@dest_imprv_id,
			@new_imprv_detail_id,
			section_id,
			occupancy_id,
			occupancy_code,
			occupancy_description,
			occupancy_pct,
			class,
			height,
			quality_rank,
			quality_rank_override,
			basement_type,
			basement_type_description,
			basement_area,
			basement_depreciation_pct,
			basement_effective_year_built,
			basement_effective_year_built_override,
			basement_typical_life,
			basement_typical_life_override
		from dbo.imprv_detail_cms_occupancy
		with (nolock)
		where prop_val_yr = @tax_yr
		and sup_num = @source_sup_num
		and sale_id = @sale_id
		and prop_id = @source_prop_id
		and imprv_id = @source_imprv_id
		and imprv_det_id = @imprv_detail_id
		-- End imprv_detail_cms_occupancy
		
		-- Begin imprv_detail_cms_component
		insert dbo.imprv_detail_cms_component with(rowlock) (
			prop_val_yr,
			sup_num,
			sale_id,
			prop_id,
			imprv_id,
			imprv_det_id,
			section_id,
			component_id,
			component_code,
			component_description,
			component_system_code,
			component_system_description,
			component_pct,
			quality_rank,
			quality_rank_override,
			units,
			depreciation_pct,
			num_stops,
			climate,
			total_cost_new,
			calc_unit_cost,
			depreciation_amount,
			depreciated_cost,
			depreciation_pct_override
		)
		select @dest_year,
			@dest_sup_num,
			sale_id,
			@dest_prop_id,
			@dest_imprv_id,
			@new_imprv_detail_id,
			section_id,
			component_id,
			component_code,
			component_description,
			component_system_code,
			component_system_description,
			component_pct,
			quality_rank,
			quality_rank_override,
			units,
			depreciation_pct,
			num_stops,
			climate,
			total_cost_new,
			calc_unit_cost,
			depreciation_amount,
			depreciated_cost,
			depreciation_pct_override
		from dbo.imprv_detail_cms_component
		with (nolock)
		where prop_val_yr = @tax_yr
		and sup_num = @source_sup_num
		and sale_id = @sale_id
		and prop_id = @source_prop_id
		and imprv_id = @source_imprv_id
		and imprv_det_id = @imprv_detail_id
		-- End imprv_detail_cms_component
		
		-- Begin imprv_detail_cms_addition
		insert dbo.imprv_detail_cms_addition with(rowlock) (
			prop_val_yr,
			sup_num,
			sale_id,
			prop_id,
			imprv_id,
			imprv_det_id,
			section_id,
			addition_id,
			addition_system_code,
			addition_system_description,
			addition_description,
			units,
			unit_cost,
			depreciation_pct,
			effective_year_built,
			effective_year_built_override,
			typical_life,
			use_local_multiplier,
			apply_trend,
			base_date,
			total_cost_new,
			calc_unit_cost,
			depreciation_amount,
			depreciated_cost,
			depreciation_pct_override
		)
		select @dest_year,
			@dest_sup_num,
			sale_id,
			@dest_prop_id,
			@dest_imprv_id,
			@new_imprv_detail_id,
			section_id,
			addition_id,
			addition_system_code,
			addition_system_description,
			addition_description,
			units,
			unit_cost,
			depreciation_pct,
			effective_year_built,
			effective_year_built_override,
			typical_life,
			use_local_multiplier,
			apply_trend,
			base_date,
			total_cost_new,
			calc_unit_cost,
			depreciation_amount,
			depreciated_cost,
			depreciation_pct_override
		from dbo.imprv_detail_cms_addition
		with (nolock)
		where prop_val_yr = @tax_yr
		and sup_num = @source_sup_num
		and sale_id = @sale_id
		and prop_id = @source_prop_id
		and imprv_id = @source_imprv_id
		and imprv_det_id = @imprv_detail_id
		-- End imprv_detail_cms_addition
	end
	
	-- Commercial M&S is not enabled in the destination year.
	-- In this case, we must delete the estimates (and associated sections/etc) from the source year
	-- since we should not copy them to the destination year.
		
	delete imprv_detail_cms_addition
	where
		imprv_det_id = @imprv_detail_id and
		prop_id = @source_prop_id and
		prop_val_yr = @tax_yr and
		imprv_id = @source_imprv_id and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		imprv_id = @source_imprv_id

	delete imprv_detail_cms_component
	where
		imprv_det_id = @imprv_detail_id and
		prop_id = @source_prop_id and
		prop_val_yr = @tax_yr and
		imprv_id = @source_imprv_id and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		imprv_id = @source_imprv_id

	delete imprv_detail_cms_occupancy
	where
		imprv_det_id = @imprv_detail_id and
		prop_id = @source_prop_id and
		prop_val_yr = @tax_yr and
		imprv_id = @source_imprv_id and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		imprv_id = @source_imprv_id

	delete imprv_detail_cms_section
	where
		imprv_det_id = @imprv_detail_id and
		prop_id = @source_prop_id and
		prop_val_yr = @tax_yr and
		imprv_id = @source_imprv_id and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		imprv_id = @source_imprv_id

	delete imprv_detail_cms_estimate
	where
		imprv_det_id = @imprv_detail_id and
		prop_id = @source_prop_id and
		prop_val_yr = @tax_yr and
		imprv_id = @source_imprv_id and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		imprv_id = @source_imprv_id
			
	if not exists (
		select *
		from ms_config with(nolock)
		where year = @dest_year and residential_enabled = 1
	)
	begin
		-- Residential M&S is not enabled in the destination year.
		-- In this case, we must skip the copies from the source year
		-- since we should not copy them to the destination year.
		-- The estimates/etc will be deleted from the source year by virtue of
		-- the on-delete-cascade foreign keys (when we delete from imprv_detail below)
		goto SkipResidentialMarshallSwift
	end

	-- Begin Table: imprv_detail_rms_estimate
	insert dbo.imprv_detail_rms_estimate with(rowlock) (
		prop_val_yr,
		sup_num,
		sale_id,
		prop_id,
		imprv_id,
		imprv_det_id,
		ZipCode,
		ConstTypeID,
		TypeID,
		StyleIDPrimary,
		StylePctPrimary,
		StyleIDSecondary,
		TotalArea,
		Units,
		QualityID,
		ConditionID,
		DepreciationID,
		EffectiveYearBuilt,
		PhysFunPct,
		PhysFunAmt,
		PhysicalPct,
		PhysicalAmt,
		FunctionalPct,
		FunctionalAmt,
		ExternalPct,
		ExternalAmt,
		ApplyPctToRCN,
		RoundingValue,
		TypicalLife,
		LocalMultiplier,
		LocalMultiplierOverride,
		LocalMultiplierAdj,
		ArchitectFee,
		ArchitectFeeOverride,
		ReportDate,
		ReportDateOverride,
		SingleLineBackDate,
		SingleLineBackDateOverride,
		BaseDate,
		BaseDateOverride,
		EffectiveAgeAdj,
		DepreciationPctAdj,
		EnergyAdj_ZoneItemID,
		EnergyAdj_ZoneItemIDOverride,
		FoundationAdj_ZoneItemID,
		FoundationAdj_ZoneItemIDOverride,
		HillsideAdj_ZoneItemID,
		HillsideAdj_ZoneItemIDOverride,
		SeismicAdj_ZoneItemID,
		SeismicAdj_ZoneItemIDOverride,
		WindAdj_ZoneItemID,
		WindAdj_ZoneItemIDOverride,
		StoryWallHeight,
		StoryWallHeightOverride,
		RegionalMultiplier,
		CostMultiplier,
		IndexMultiplier,
		TotalMultiplier,
		ExtWallFactor,
		BaseCostUnitPrice,
		ZoneAdj_Energy,
		ZoneAdj_Foundation,
		ZoneAdj_Hillside,
		ZoneAdj_Seismic,
		ZoneAdj_Wind,
		BaseLoss,
		PhysFunLoss,
		PhysLoss,
		FunctionalLoss,
		ExternalLoss,
		EstimateValueRCN,
		EstimateValueRCNLD,
		DeprPct,
		EstimateValueNonRoundedRCNLD,
		EstimateValueSingleLineBackDateRCNLD
	)
	select
		@dest_year,
		@dest_sup_num,
		sale_id,
		@dest_prop_id,
		@dest_imprv_id,
		@new_imprv_detail_id,
		ZipCode,
		ConstTypeID,
		TypeID,
		StyleIDPrimary,
		StylePctPrimary,
		StyleIDSecondary,
		TotalArea,
		Units,
		QualityID,
		ConditionID,
		DepreciationID,
		EffectiveYearBuilt,
		PhysFunPct,
		PhysFunAmt,
		PhysicalPct,
		PhysicalAmt,
		FunctionalPct,
		FunctionalAmt,
		ExternalPct,
		ExternalAmt,
		ApplyPctToRCN,
		RoundingValue,
		TypicalLife,
		LocalMultiplier,
		LocalMultiplierOverride,
		LocalMultiplierAdj,
		ArchitectFee,
		ArchitectFeeOverride,
		ReportDate,
		ReportDateOverride,
		SingleLineBackDate,
		SingleLineBackDateOverride,
		BaseDate,
		BaseDateOverride,
		EffectiveAgeAdj,
		DepreciationPctAdj,
		EnergyAdj_ZoneItemID,
		EnergyAdj_ZoneItemIDOverride,
		FoundationAdj_ZoneItemID,
		FoundationAdj_ZoneItemIDOverride,
		HillsideAdj_ZoneItemID,
		HillsideAdj_ZoneItemIDOverride,
		SeismicAdj_ZoneItemID,
		SeismicAdj_ZoneItemIDOverride,
		WindAdj_ZoneItemID,
		WindAdj_ZoneItemIDOverride,
		StoryWallHeight,
		StoryWallHeightOverride,
		RegionalMultiplier,
		CostMultiplier,
		IndexMultiplier,
		TotalMultiplier,
		ExtWallFactor,
		BaseCostUnitPrice,
		ZoneAdj_Energy,
		ZoneAdj_Foundation,
		ZoneAdj_Hillside,
		ZoneAdj_Seismic,
		ZoneAdj_Wind,
		BaseLoss,
		PhysFunLoss,
		PhysLoss,
		FunctionalLoss,
		ExternalLoss,
		EstimateValueRCN,
		EstimateValueRCNLD,
		DeprPct,
		EstimateValueNonRoundedRCNLD,
		EstimateValueSingleLineBackDateRCNLD
	from dbo.imprv_detail_rms_estimate as rms with(nolock)
	where
		prop_val_yr = @tax_yr and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		prop_id = @source_prop_id and
		imprv_id = @source_imprv_id and
		imprv_det_id = @imprv_detail_id
	-- End Table: imprv_detail_rms_estimate

	-- Begin Table: imprv_detail_rms_section
	insert dbo.imprv_detail_rms_section with(rowlock) (
		prop_val_yr,
		sup_num,
		sale_id,
		prop_id,
		imprv_id,
		imprv_det_id,
		section_id,
		GroupTypeID,
		SectionSize,
		QualityID,
		QualityOverride,
		DeprPct,
		DeprOverride,
		EffectiveYearBuilt,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		SectionValueRCN,
		SectionValueRCNLD
	)
	select
		@dest_year,
		@dest_sup_num,
		sale_id,
		@dest_prop_id,
		@dest_imprv_id,
		@new_imprv_detail_id,
		section_id,
		GroupTypeID,
		SectionSize,
		QualityID,
		QualityOverride,
		DeprPct,
		DeprOverride,
		EffectiveYearBuilt,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		SectionValueRCN,
		SectionValueRCNLD
	from dbo.imprv_detail_rms_section as rms with(nolock)
	where
		prop_val_yr = @tax_yr and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		prop_id = @source_prop_id and
		imprv_id = @source_imprv_id and
		imprv_det_id = @imprv_detail_id
	-- End Table: imprv_detail_rms_section
	
	-- Begin Table: imprv_detail_rms_component
	insert dbo.imprv_detail_rms_component with(rowlock) (
		prop_val_yr,
		sup_num,
		sale_id,
		prop_id,
		imprv_id,
		imprv_det_id,
		section_id,
		pacs_component_id,
		ComponentID,
		Units,
		ComponentPct,
		QualityID,
		QualityOverride,
		DeprPct,
		DeprOverride,
		EffectiveYearBuilt,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		UnitPrice,
		AdjUnitPrice,
		ComponentValueRCN,
		ComponentValueRCNLD
	)
	select
		@dest_year,
		@dest_sup_num,
		sale_id,
		@dest_prop_id,
		@dest_imprv_id,
		@new_imprv_detail_id,
		section_id,
		pacs_component_id,
		ComponentID,
		Units,
		ComponentPct,
		QualityID,
		QualityOverride,
		DeprPct,
		DeprOverride,
		EffectiveYearBuilt,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		UnitPrice,
		AdjUnitPrice,
		ComponentValueRCN,
		ComponentValueRCNLD
	from dbo.imprv_detail_rms_component as rms with(nolock)
	where
		prop_val_yr = @tax_yr and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		prop_id = @source_prop_id and
		imprv_id = @source_imprv_id and
		imprv_det_id = @imprv_detail_id
	-- End Table: imprv_detail_rms_component

	-- Begin Table: imprv_detail_rms_addition
	insert dbo.imprv_detail_rms_addition with(rowlock) (
		prop_val_yr,
		sup_num,
		sale_id,
		prop_id,
		imprv_id,
		imprv_det_id,
		pacs_addition_id,
		AdditionTypeID,
		AdditionDesc,
		Units,
		CostValue,
		UseLocalMultiplier,
		ApplyTrend,
		DeprPct,
		DeprOverride,
		EffectiveYearBuilt,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		BaseDate,
		AdditionValueRCN,
		AdditionValueRCNLD
	)
	select
		@dest_year,
		@dest_sup_num,
		sale_id,
		@dest_prop_id,
		@dest_imprv_id,
		@new_imprv_detail_id,
		pacs_addition_id,
		AdditionTypeID,
		AdditionDesc,
		Units,
		CostValue,
		UseLocalMultiplier,
		ApplyTrend,
		DeprPct,
		DeprOverride,
		EffectiveYearBuilt,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		BaseDate,
		AdditionValueRCN,
		AdditionValueRCNLD
	from dbo.imprv_detail_rms_addition as rms with(nolock)
	where
		prop_val_yr = @tax_yr and
		sup_num = @source_sup_num and
		sale_id = @sale_id and
		prop_id = @source_prop_id and
		imprv_id = @source_imprv_id and
		imprv_det_id = @imprv_detail_id
	-- End Table: imprv_detail_rms_addition

	SkipResidentialMarshallSwift:
	
	DELETE income_improvement_level_detail
	WHERE
	income_yr = @tax_yr and
	sup_num = @source_sup_num and
	prop_id = @source_prop_id and
	imprv_id = @source_imprv_id and
	imprv_det_id = @imprv_detail_id

	DELETE imprv_detail
	WHERE
	imprv_det_id = @imprv_detail_id and
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @source_imprv_id and
	sup_num = @source_sup_num  and
	sale_id = @sale_id	

	IF @create_event = 1
	BEGIN
		exec dbo.InsertEvent
		@source_prop_id,		
		@event_type,	
		@event_desc,	
		@user_id,
		'A',
		@RefID2 = @imprv_detail_id,
		@RefID3 = @source_prop_id,
		@RefID4 = @dest_prop_id	
		
		IF (@source_prop_id <> @dest_prop_id)
		BEGIN
			exec dbo.InsertEvent
			@dest_prop_id,		
			@event_type,	
			@event_desc,	
			@user_id,
			'A',
			@RefID2 = @imprv_detail_id,
			@RefID3 = @source_prop_id,
			@RefID4 = @dest_prop_id	
		END
	END

	update property_val
	set recalc_flag = 'M'
	where prop_val_yr = @dest_year
	and sup_num = @dest_sup_num
	and prop_id = @dest_prop_id
	and recalc_flag = 'C'
	
	COMMIT TRAN

GO

