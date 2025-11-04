
create procedure [dbo].[LayerCopyImprovement]
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lSaleID_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lSaleID_To int,
	@lPropID_To int,
	
	@bAssignNewIDs bit = 0,
	/*
		Meaning
			0			Do not assign new IDs
			1			Assign new IDs
	*/

	@lImprovIDCopy int = null,
	/*
		Meaning:
			null		Copy all improvements
			not null	A specific imprv_id to copy - Implies @bAssignNewIDs = 1
	*/
	
	@lImprovDetailIDCopy int = null,
	/*
		Meaning
			null		Copy all details
			not null	A specific imprv_det_id to copy - Requires @lImprovIDCopy to be not null - 
	*/

	@bSkipEntityAssoc bit = 1,
	@bSkipExemptionAssoc bit = 1,
	@bSkipOwnerAssoc bit = 1,
	@lOwnerIDExemptionAndOwnerAssoc int = null,

	@szMethod varchar(23) = null,
	/*
		Meaning
			null		Nothing special
			CFYPL		Create future year property layer semantics
	*/
	
	@bOverrideImpliedAssignNewIDs bit = 0,
	/*
		Meaning
			0	-	Does nothing (default)
			1 - Overrides the automatic implication that a null @lImprovIDCopy means
					@bAssignNewIDs must = 1
					Put in for split merge due to lack of time to write a proper "LayerMoveImprovement",
					where I wanted to move a single land from one property to another and keep the land ID
					the same between the moves, thus allowing the user to move it back to the original property
					and still have the same ID
	*/
	@bCopyImprvLandSalesInfo bit = 0 -- If set to 1, then copy sale_id records too.

/*
	Returns:
		< 0		Error
		Zero	No Error
		> 0		The [first or only depending on input parameter] new imprv_id or imprv_det_id, whichever is applicable
*/

as


	declare @tblImprovID table (
		imprv_id_old int not null,
		imprv_id_new int not null,
		primary key clustered (imprv_id_old) with fillfactor = 100
	)

	declare @tblImprovDetailID table (
		imprv_det_id_old int not null,
		imprv_det_id_new int not null,
		primary key clustered (imprv_det_id_old) with fillfactor = 100
	)


set nocount on


	-- Begin - Validate supported operations

	-- We do not support copying a detail to a new property
	-- That is, when copying just a detail, we only support copying to the same property, same improvement
	if ( @lImprovDetailIDCopy is not null )
	begin
		if
		(
			-- Must be same property
			@lYear_From <> @lYear_To or
			@lSupNum_From <> @lSupNum_To or
			@lSaleID_From <> @lSaleID_To or
			@lPropID_From <> @lPropID_To or
			-- Must also specify imprv_id
			@lImprovIDCopy is null
		)
		begin
			raiserror('LayerCopyImprovement - Unsupported operation', 18, 1)
			return(-1)
		end

		-- Since we're copying to the same property, this is implied
		set @bAssignNewIDs = 1
	end

	-- End - Validate supported operations

	if ( @lImprovIDCopy is not null and @bOverrideImpliedAssignNewIDs = 0 )
	begin
		-- This is implied
		set @bAssignNewIDs = 1
	end

	declare @lNextID int
	set @lNextID = 0

	-- Begin - Get new IDs if necessary
	if ( @bAssignNewIDs = 1 )
	begin

		if ( @lImprovDetailIDCopy is null ) -- If copying entire improvement
		begin
			-- Get new imprv_ids
			declare @lNumImprov int

			insert @tblImprovID (imprv_id_old, imprv_id_new)
			select
				imprv_id, 0
			from dbo.imprv with(nolock)
			where
				prop_val_yr = @lYear_From and
				sup_num = @lSupNum_From and
				sale_id = @lSaleID_From and
				prop_id = @lPropID_From and
				(@lImprovIDCopy is null or imprv_id = @lImprovIDCopy)

			set @lNumImprov = @@rowcount
			if ( @lNumImprov > 0 )
			begin
				exec dbo.GetUniqueID 'imprv', @lNextID output, @lNumImprov, 0

				set rowcount 1
				while ( @lNumImprov > 0 )
				begin
					update @tblImprovID
					set imprv_id_new = @lNextID + @lNumImprov - 1
					where imprv_id_new = 0
					
					set @lNumImprov = @lNumImprov - 1
				end
				set rowcount 0
			end
		end
		else -- We are duplicating an existing detail (copying within) the same improvement
		begin
			-- Get new imprv_det_id
			exec dbo.GetUniqueID 'imprv_detail', @lNextID output, 1, 0

			insert @tblImprovDetailID (imprv_det_id_old, imprv_det_id_new)
			values (@lImprovDetailIDCopy, @lNextID)
		end


	end


	-- Begin Table: imprv
	if ( @lImprovDetailIDCopy is null )
	begin
		insert dbo.imprv with(rowlock) (
			prop_id,
			prop_val_yr,
			imprv_id,
			sup_num,
			sale_id,
			imprv_type_cd,
			imprv_sl_locked,
			primary_imprv,
			imprv_state_cd,
			imprv_homesite,
			imprv_desc,
			imprv_val,
			misc_cd,
			imp_new_yr,
			imp_new_val,
			imp_new_val_override,
			original_val,
			base_val,
			calc_val,
			adjusted_val,
			living_area_up,
			err_flag,
			imprv_image_url,
			imprv_cmnt,
			mbl_hm_make,
			mbl_hm_model,
			mbl_hm_sn,
			mbl_hm_hud_num,
			mbl_hm_title_num,
			imp_new_pc,
			flat_val,
			value_type,
			imprv_adj_amt,
			imprv_adj_factor,
			imprv_mass_adj_factor,
			imprv_val_source,
			economic_pct,
			physical_pct,
			functional_pct,
			economic_cmnt,
			physical_cmnt,
			functional_cmnt,
			effective_yr_blt,
			percent_complete,
			percent_complete_cmnt,
			ref_id1,
			num_imprv,
			mbl_hm_sn_2,
			mbl_hm_sn_3,
			mbl_hm_hud_num_2,
			mbl_hm_hud_num_3,
			stories,
			arb_val,
			dep_pct,
			dep_cmnt,
			dist_val,
			hs_pct,
			hs_pct_override,
			primary_use_cd,
			primary_use_override,
			secondary_use_cd,
			secondary_use_override,
			actual_year_built,
			building_number,
			building_name,
			flat_value_comment,
			flat_value_user_id,
			flat_value_date,
			building_id,
			permanent_crop_land_acres,
			permanent_crop_land_acres_override,
			permanent_crop_planted_acres,
			permanent_crop_planted_acres_override,
			mbl_hm_year,
			mbl_hm_tip_out
		)
		select
			@lPropID_To,
			@lYear_To,
			/*imprv_id = */ case when t.imprv_id_old is null then i.imprv_id else t.imprv_id_new end,
			@lSupNum_To,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			imprv_type_cd,
			imprv_sl_locked,
			primary_imprv,
			imprv_state_cd,
			imprv_homesite,
			imprv_desc,
			imprv_val,
			misc_cd,
			/* imp_new_yr = */ case when @szMethod = 'CFYPL' then @lYear_To else imp_new_yr end,
			/* imp_new_val = */ case when @szMethod = 'CFYPL' then 0 else imp_new_val end,
			/* imp_new_val_override = */ case when @szMethod = 'CFYPL' then '0' else imp_new_val_override end,
			original_val,
			base_val,
			calc_val,
			adjusted_val,
			living_area_up,
			err_flag,
			imprv_image_url,
			imprv_cmnt,
			mbl_hm_make,
			mbl_hm_model,
			mbl_hm_sn,
			mbl_hm_hud_num,
			mbl_hm_title_num,
			imp_new_pc,
			/* flat_val = */ case when @szMethod = 'CFYPL' and imprv_val_source <> 'F' then 0 else flat_val end,
			value_type,
			0,
			imprv_adj_factor,
			imprv_mass_adj_factor,
			imprv_val_source,
			economic_pct,
			physical_pct,
			functional_pct,
			economic_cmnt,
			physical_cmnt,
			functional_cmnt,
			effective_yr_blt,
			percent_complete,
			percent_complete_cmnt,
			ref_id1,
			num_imprv,
			mbl_hm_sn_2,
			mbl_hm_sn_3,
			mbl_hm_hud_num_2,
			mbl_hm_hud_num_3,
			stories,
			arb_val,
			dep_pct,
			dep_cmnt,
			dist_val,
			hs_pct,
			hs_pct_override,
			primary_use_cd,
			primary_use_override,
			secondary_use_cd,
			secondary_use_override,
			actual_year_built,
			building_number,
			building_name,
			flat_value_comment,
			flat_value_user_id,
			flat_value_date,
			building_id,
			permanent_crop_land_acres,
			permanent_crop_land_acres_override,
			permanent_crop_planted_acres,
			permanent_crop_planted_acres_override,
			mbl_hm_year,
			mbl_hm_tip_out
		from dbo.imprv as i with(nolock)
		left outer join @tblImprovID as t on
			t.imprv_id_old = i.imprv_id
		where
			i.prop_val_yr = @lYear_From and
			i.sup_num = @lSupNum_From and		-- Must copy sale information if not assigning new id's and prop_id and year are same
			((@bCopyImprvLandSalesInfo = 1) or (i.sale_id = @lSaleID_From)) and
			i.prop_id = @lPropID_From and
			(@lImprovIDCopy is null or i.imprv_id = @lImprovIDCopy)

		if ( @@rowcount = 0 )
		begin
			-- If nothing was copied, we can skip the rest of the tables
			return(0)
		end
	end
	-- End Table: imprv


	-- Begin Table: imprv_detail
	insert dbo.imprv_detail with(rowlock) (
		prop_id,
		prop_val_yr,
		imprv_id,
		imprv_det_id,
		sup_num,
		sale_id,
		imprv_det_class_cd,
		imprv_det_meth_cd,
		imprv_det_type_cd,
		seq_num,
		imprv_det_val,
		imprv_det_val_source,
		imprv_det_desc,
		imprv_det_area,
		imprv_det_area_type,
		condition_cd,
		cubic_area,
		calc_area,
		sketch_area,
		override_area,
		override_cubic_area,
		override_perimeter,
		perimeter,
		[length],
		width,
		height,
		unit_price,
		yr_new,
		yr_built,
		depreciation_yr,
		depreciation_yr_override,
		imprv_det_orig_val,
		imprv_det_orig_up,
		effective_tax_yr,
		imprv_det_adj_factor,
		imprv_det_adj_amt,
		imprv_det_calc_val,
		imprv_det_adj_val,
		imprv_det_flat_val,
		economic_pct,
		physical_pct,
		physical_pct_source,
		functional_pct,
		economic_pct_override,
		physical_pct_override,
		functional_pct_override,
		economic_cmnt,
		physical_cmnt,
		functional_cmnt,
		percent_complete,
		percent_complete_override,
		percent_complete_cmnt,
		new_value_flag,
		new_value,
		new_value_override,
		sketch_cmds,
		use_up_for_pct_base,
		ref_id1,
		reserved1,
		can_close_sketch,
		dep_pct,
		add_factor,
		add_factor_override,
		size_adj_pct,
		dep_pct_override,
		size_adj_pct_override,
		imprv_det_sub_class_cd,
		num_units,
		num_stories,
		stories_multiplier,
		lease_class,
		actual_year_built_override,
		flat_value_comment,
		flat_value_user_id,
		flat_value_date,
		depreciated_replacement_cost_new,
		floor_number,
		load_factor,
		actual_age,
		net_rentable_area,
		building_id,
		permanent_crop_acres,
		permanent_crop_irrigation_acres,
		permanent_crop_age_group,
		permanent_crop_trellis,
		permanent_crop_irrigation_system_type,
		permanent_crop_irrigation_sub_class,
		permanent_crop_density,
		imprv_det_cost_unit_price,
		imprv_det_ms_val,
		imprv_det_ms_unit_price,
		recalc_error_validate_flag,			/* Copy recalc fields */
		recalc_error_validate_date,
		recalc_error_validate_user_id
	)
	select
		@lPropID_To,
		@lYear_To,
		/*imprv_id = */ case when t.imprv_id_old is null then id.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then id.imprv_det_id else t2.imprv_det_id_new end,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		imprv_det_class_cd,
		imprv_det_meth_cd,
		imprv_det_type_cd,
		seq_num,
		imprv_det_val,
		imprv_det_val_source,
		imprv_det_desc,
		imprv_det_area,
		imprv_det_area_type,
		condition_cd,
		cubic_area,
		calc_area,
		sketch_area,
		override_area,
		override_cubic_area,
		override_perimeter,
		perimeter,
		[length],
		width,
		height,
		unit_price,
		yr_new,
		yr_built,
		depreciation_yr,
		depreciation_yr_override,
		imprv_det_orig_val,
		imprv_det_orig_up,
		effective_tax_yr,
		imprv_det_adj_factor,
		0,
		imprv_det_calc_val,
		imprv_det_adj_val, 
		/* imprv_det_flat_val = */ case when @szMethod = 'CFYPL' and imprv_det_val_source <> 'F' then 0 else imprv_det_flat_val end,
		economic_pct,
		physical_pct,
		physical_pct_source,
		functional_pct,
		economic_pct_override,
		physical_pct_override,
		functional_pct_override,
		economic_cmnt,
		physical_cmnt,
		functional_cmnt,
		percent_complete,
		percent_complete_override,
		percent_complete_cmnt,
		/* new_value_flag = */ case when @szMethod = 'CFYPL' then 'F' else new_value_flag end,
		/* new_value = */ case when @szMethod = 'CFYPL' then 0 else new_value end,
		/* new_value_override = */ case when @szMethod = 'CFYPL' then 'F' else new_value_override end,
		sketch_cmds,
		use_up_for_pct_base,
		ref_id1,
		reserved1,
		can_close_sketch,
		dep_pct,
		add_factor,
		add_factor_override,
		size_adj_pct,
		dep_pct_override,
		size_adj_pct_override,
		imprv_det_sub_class_cd,
		num_units,
		num_stories,
		stories_multiplier,
		lease_class,
		actual_year_built_override,
		flat_value_comment,
		flat_value_user_id,
		flat_value_date,
		depreciated_replacement_cost_new,
		floor_number,
		load_factor,
		actual_age,
		net_rentable_area,
		building_id,
		permanent_crop_acres,
		permanent_crop_irrigation_acres,
		permanent_crop_age_group,
		permanent_crop_trellis,
		permanent_crop_irrigation_system_type,
		permanent_crop_irrigation_sub_class,
		permanent_crop_density,
		imprv_det_cost_unit_price,
		imprv_det_ms_val,
		imprv_det_ms_unit_price,
		recalc_error_validate_flag,			/* Copy Recalc Fields */
		recalc_error_validate_date,
		recalc_error_validate_user_id
	from dbo.imprv_detail as id with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = id.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = id.imprv_det_id
	where
		id.prop_val_yr = @lYear_From and
		id.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (id.sale_id = @lSaleID_From)) and
		id.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or id.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or id.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail


	-- Begin Table: imprv_det_adj
	insert dbo.imprv_det_adj with(rowlock) (
		prop_id,
		prop_val_yr,
		imprv_id,
		imprv_det_id,
		imprv_det_adj_seq,
		sup_num,
		sale_id,
		imprv_adj_type_cd,
		imprv_det_adj_cd,
		imprv_det_adj_desc,
		imprv_det_adj_pc,
		imprv_det_adj_amt,
		sys_flag,
		imprv_det_adj_lid_year_added,
		imprv_det_adj_lid_orig_value,
		imprv_det_adj_lid_econ_life,
		imprv_det_adj_lid_residual_pct,
		imprv_det_adj_method
	)
	select
		@lPropID_To,
		@lYear_To,
		/*imprv_id = */ case when t.imprv_id_old is null then ida.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then ida.imprv_det_id else t2.imprv_det_id_new end,
		imprv_det_adj_seq,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		imprv_adj_type_cd,
		imprv_det_adj_cd,
		imprv_det_adj_desc,
		imprv_det_adj_pc,
		imprv_det_adj_amt,
		sys_flag,
		imprv_det_adj_lid_year_added,
		imprv_det_adj_lid_orig_value,
		imprv_det_adj_lid_econ_life,
		imprv_det_adj_lid_residual_pct,
		imprv_det_adj_method
	from dbo.imprv_det_adj as ida with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = ida.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = ida.imprv_det_id
	where
		ida.prop_val_yr = @lYear_From and
		ida.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (ida.sale_id = @lSaleID_From)) and
		ida.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or ida.imprv_id = @lImprovIDCopy) and
			--Remodel Adjustments should never be copied unless this is a supplement
		(ida.imprv_adj_type_cd <> 'RMD' or (@lPropID_From = @lPropID_To and @lSupNum_From <> @lSupNum_To and @lYear_From = @lYear_To)) and
		(@lImprovDetailIDCopy is null or ida.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_det_adj


	-- Begin Table: imprv_attr
	insert dbo.imprv_attr with(rowlock) (
		imprv_id,
		prop_id,
		imprv_det_id,
		imprv_attr_id,
		prop_val_yr,
		sup_num,
		sale_id,
		i_attr_val_id,
		i_attr_val_cd,
		imprv_attr_val,
		i_attr_unit,
		i_attr_up,
		i_attr_factor
	)
	select
		/*imprv_id = */ case when t.imprv_id_old is null then ia.imprv_id else t.imprv_id_new end,
		@lPropID_To,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then ia.imprv_det_id else t2.imprv_det_id_new end,
		imprv_attr_id,
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		i_attr_val_id,
		i_attr_val_cd,
		imprv_attr_val,
		i_attr_unit,
		i_attr_up,
		i_attr_factor
	from dbo.imprv_attr as ia with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = ia.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = ia.imprv_det_id
	where
		ia.prop_val_yr = @lYear_From and
		ia.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (ia.sale_id = @lSaleID_From)) and
		ia.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or ia.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or ia.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_attr

	if not exists (
		select *
		from ms_config with(nolock)
		where year = @lYear_To and commercial_enabled = 1
	)
	begin
		goto SkipCommercialMarshallSwift
	end
	
	-- Begin Table: imprv_detail_cms_estimate
	insert dbo.imprv_detail_cms_estimate with (rowlock) (
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
	select 
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then idce.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then idce.imprv_det_id else t2.imprv_det_id_new end,
		zip_code,
		case when effective_year_built > @lYear_To then @lYear_To else effective_year_built end,
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
	from dbo.imprv_detail_cms_estimate as idce with (nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = idce.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = idce.imprv_det_id
	where
		idce.prop_val_yr = @lYear_From and
		idce.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (idce.sale_id = @lSaleID_From)) and
		idce.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or idce.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or idce.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail_cms_estimate
	
	-- Begin Table: imprv_detail_cms_section
	insert dbo.imprv_detail_cms_section with (rowlock) (
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
	select 
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then idcs.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then idcs.imprv_det_id else t2.imprv_det_id_new end,
		section_id,
		section_type,
		section_description,
		area,
		stories,
		perimeter_shape_flag,
		perimeter,
		shape,
		case when effective_year_built > @lYear_To then @lYear_To else effective_year_built end,
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
	from dbo.imprv_detail_cms_section as idcs with (nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = idcs.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = idcs.imprv_det_id
	where
		idcs.prop_val_yr = @lYear_From and
		idcs.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (idcs.sale_id = @lSaleID_From)) and
		idcs.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or idcs.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or idcs.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail_cms_section
	
	-- Begin Table: imprv_detail_cms_occupancy
	insert dbo.imprv_detail_cms_occupancy with (rowlock) (
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
		basement_typical_life_override,
		occupancy_name
	)
	select
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then idco.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then idco.imprv_det_id else t2.imprv_det_id_new end,
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
		case when basement_effective_year_built > @lYear_To then @lYear_To else basement_effective_year_built end,
		basement_effective_year_built_override,
		basement_typical_life,
		basement_typical_life_override,
		occupancy_name
	from dbo.imprv_detail_cms_occupancy as idco with (nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = idco.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = idco.imprv_det_id
	where
		idco.prop_val_yr = @lYear_From and
		idco.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (idco.sale_id = @lSaleID_From)) and
		idco.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or idco.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or idco.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail_cms_occupancy
	
	-- Begin Table: imprv_detail_cms_component
	insert dbo.imprv_detail_cms_component with (rowlock) (
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
		depreciated_cost
	)
	select
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then idcc.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then idcc.imprv_det_id else t2.imprv_det_id_new end,
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
		depreciated_cost
	from dbo.imprv_detail_cms_component as idcc with (nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = idcc.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = idcc.imprv_det_id
	where
		idcc.prop_val_yr = @lYear_From and
		idcc.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (idcc.sale_id = @lSaleID_From)) and
		idcc.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or idcc.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or idcc.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail_cms_component
	
	-- Begin Table: imprv_detail_cms_addition
	insert dbo.imprv_detail_cms_addition with (rowlock) (
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
		depreciated_cost
	)
	select
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then idca.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then idca.imprv_det_id else t2.imprv_det_id_new end,
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
		depreciated_cost
	from dbo.imprv_detail_cms_addition as idca with (nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = idca.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = idca.imprv_det_id
	where
		idca.prop_val_yr = @lYear_From and
		idca.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (idca.sale_id = @lSaleID_From)) and
		idca.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or idca.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or idca.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail_cms_addition

	SkipCommercialMarshallSwift:
	
	if not exists (
		select *
		from ms_config with(nolock)
		where year = @lYear_To and residential_enabled = 1
	)
	begin
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
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then rms.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then rms.imprv_det_id else t2.imprv_det_id_new end,
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
		case when EffectiveYearBuilt > @lYear_To then @lYear_To else EffectiveYearBuilt end,
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
	left outer join @tblImprovID as t on
		t.imprv_id_old = rms.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = rms.imprv_det_id
	where
		rms.prop_val_yr = @lYear_From and
		rms.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (rms.sale_id = @lSaleID_From)) and
		rms.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or rms.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or rms.imprv_det_id = @lImprovDetailIDCopy)
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
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then rms.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then rms.imprv_det_id else t2.imprv_det_id_new end,
		section_id,
		GroupTypeID,
		SectionSize,
		QualityID,
		QualityOverride,
		DeprPct,
		DeprOverride,
		case when EffectiveYearBuilt > @lYear_To then @lYear_To else EffectiveYearBuilt end,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		SectionValueRCN,
		SectionValueRCNLD
	from dbo.imprv_detail_rms_section as rms with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = rms.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = rms.imprv_det_id
	where
		rms.prop_val_yr = @lYear_From and
		rms.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (rms.sale_id = @lSaleID_From)) and
		rms.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or rms.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or rms.imprv_det_id = @lImprovDetailIDCopy)
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
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then rms.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then rms.imprv_det_id else t2.imprv_det_id_new end,
		section_id,
		pacs_component_id,
		ComponentID,
		Units,
		ComponentPct,
		QualityID,
		QualityOverride,
		DeprPct,
		DeprOverride,
		case when EffectiveYearBuilt > @lYear_To then @lYear_To else EffectiveYearBuilt end,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		UnitPrice,
		AdjUnitPrice,
		ComponentValueRCN,
		ComponentValueRCNLD
	from dbo.imprv_detail_rms_component as rms with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = rms.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = rms.imprv_det_id
	where
		rms.prop_val_yr = @lYear_From and
		rms.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (rms.sale_id = @lSaleID_From)) and
		rms.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or rms.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or rms.imprv_det_id = @lImprovDetailIDCopy)
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
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*imprv_id = */ case when t.imprv_id_old is null then rms.imprv_id else t.imprv_id_new end,
		/*imprv_det_id = */ case when t2.imprv_det_id_old is null then rms.imprv_det_id else t2.imprv_det_id_new end,
		pacs_addition_id,
		AdditionTypeID,
		AdditionDesc,
		Units,
		CostValue,
		UseLocalMultiplier,
		ApplyTrend,
		DeprPct,
		DeprOverride,
		case when EffectiveYearBuilt > @lYear_To then @lYear_To else EffectiveYearBuilt end,
		EffectiveYearBuiltOverride,
		TypicalLife,
		TypicalLifeOverride,
		BaseDate,
		AdditionValueRCN,
		AdditionValueRCNLD
	from dbo.imprv_detail_rms_addition as rms with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = rms.imprv_id
	left outer join @tblImprovDetailID as t2 on
		t2.imprv_det_id_old = rms.imprv_det_id
	where
		rms.prop_val_yr = @lYear_From and
		rms.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (rms.sale_id = @lSaleID_From)) and
		rms.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or rms.imprv_id = @lImprovIDCopy) and
		(@lImprovDetailIDCopy is null or rms.imprv_det_id = @lImprovDetailIDCopy)
	-- End Table: imprv_detail_rms_addition
	
	SkipResidentialMarshallSwift:
	
	if ( @lImprovDetailIDCopy is not null )
	begin
		-- Finished since we only copied a detail
		RETURN(@lNextID)
	end




	-- Begin Table: imprv_sketch_note
	insert dbo.imprv_sketch_note with(rowlock) (
		prop_id,
		prop_val_yr,
		imprv_id,
		sup_num,
		sale_id,
		seq_num,
		NoteType,
		xLocation,
		yLocation,
		NoteText,
		xLine,
		yLine,
		NoteLineType,
		NoteBorderType,
		NoteFontSize,
		NoteJustification,
		NoteColor
	)
	select
		@lPropID_To,
		@lYear_To,
		/*imprv_id = */ case when t.imprv_id_old is null then isn.imprv_id else t.imprv_id_new end,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		seq_num,
		NoteType,
		xLocation,
		yLocation,
		NoteText,
		xLine,
		yLine,
		NoteLineType,
		NoteBorderType,
		NoteFontSize,
		NoteJustification,
		NoteColor
	from dbo.imprv_sketch_note as isn with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = isn.imprv_id
	where
		isn.prop_val_yr = @lYear_From and
		isn.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (isn.sale_id = @lSaleID_From)) and
		isn.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or isn.imprv_id = @lImprovIDCopy)
	-- End Table: imprv_sketch_note
	
	-- Begin Table: imprv_sketch
	insert dbo.imprv_sketch with(rowlock) (
		prop_id,
		prop_val_yr,
		imprv_id,
		sup_num,
		sale_id,
		sketch
)	
	select
		@lPropID_To,
		@lYear_To,
		case when t.imprv_id_old is null then iss.imprv_id else t.imprv_id_new end,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		sketch
	from dbo.imprv_sketch as iss with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = iss.imprv_id
	where
		iss.prop_val_yr = @lYear_From and
		iss.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (iss.sale_id = @lSaleID_From)) and
		iss.prop_id = @lPropID_From and
		(@lImprovIDCopy is null or iss.imprv_id = @lImprovIDCopy)
	-- End Table: imprv_sketch

	-- Begin Table: pacs_image (improvement detail sketch images)
	declare @image_id int
	declare @ref_id int
	declare @ref_type varchar(5)
	declare @new_image_id int
	declare @new_basedir varchar(4000)
	declare	@new_subdir varchar(4000)
	declare @new_name varchar(4000)
	declare @new_path varchar(4000)
	declare @old_path varchar(4000)
	declare @copy_cmd varchar(4000)

	declare images_to_copy cursor for
	select image_id, ref_id, ref_type, location
	from dbo.pacs_image pim with(nolock)
	left outer join @tblImprovID t on
		t.imprv_id_old = pim.ref_id1
	where
		ref_type in ('SKTCH', 'PI') and
		pim.ref_id = @lPropID_From and
		pim.ref_year = @lYear_From and
		(@lImprovIDCopy is null or pim.ref_id1 = @lImprovIDCopy) and
		pim.ref_id2 = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (pim.ref_id3 = @lSaleID_From))

	open images_to_copy
	fetch next from images_to_copy into @image_id, @ref_id, @ref_type, @old_path

	while @@fetch_status = 0
	begin
		exec GetNextImageIDOutput @new_subdir output, @new_image_id output, @new_basedir output

		set @new_name = convert(varchar(50), @new_image_id) + '.jpg'
		set @new_path = @new_basedir + '\' + @new_subdir + '\' + @new_name

		insert dbo.pacs_image with(rowlock) (
			image_id, image_type, location, image_nm, 
			scan_dt, expiration_dt, sub_type, rec_type, eff_yr, status_cd, status_dt,
			comment, image_dt, chg_reason, pacs_user_id, status_user_id,
			ref_id, ref_type, ref_year, expiry_dt_override, role_attribute_id,
			ref_id1, ref_id2, ref_id3
		)

		select
			@new_image_id, image_type, @new_path, @new_name,
			scan_dt, expiration_dt, sub_type, rec_type, eff_yr, status_cd, status_dt,
			comment, image_dt, chg_reason, pacs_user_id, status_user_id,
			@lPropID_To, ref_type, @lYear_To, expiry_dt_override, role_attribute_id,
			case when t.imprv_id_old is null then ref_id1 else t.imprv_id_new end,
			@lSupNum_To, 
			case when @bCopyImprvLandSalesInfo = 1 then ref_id3 else @lSaleID_To end
		 
		from pacs_image pim with(nolock)

		left outer join @tblImprovID as t on
		t.imprv_id_old = pim.ref_id1

		where pim.image_id = @image_id 
		and pim.ref_id = @ref_id
		and pim.ref_type = @ref_type
	

		set @copy_cmd = 'copy "' + @old_path + '" "' + @new_path + '"'
		exec xp_cmdshell @copy_cmd

		fetch next from images_to_copy into @image_id, @ref_id, @ref_type, @old_path
	end

	close images_to_copy
	deallocate images_to_copy
	-- End Table: pacs_image

	-- Begin Table: imprv_adj
	insert dbo.imprv_adj with(rowlock) (
		prop_id,
		prop_val_yr,
		imprv_id,
		imprv_adj_seq,
		sale_id,
		sup_num,
		imprv_adj_type_cd,
		imprv_adj_desc,
		imprv_adj_pc,
		imprv_adj_amt,
		year_added,
		imprv_adj_method
	)
	select
		@lPropID_To,
		@lYear_To,
		/*imprv_id = */ case when t.imprv_id_old is null then ia.imprv_id else t.imprv_id_new end,
		imprv_adj_seq,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lSupNum_To,
		imprv_adj_type_cd,
		imprv_adj_desc,
		imprv_adj_pc,
		imprv_adj_amt,
		year_added,
		imprv_adj_method
	from dbo.imprv_adj as ia with(nolock)
	left outer join @tblImprovID as t on
		t.imprv_id_old = ia.imprv_id
	where
		ia.prop_val_yr = @lYear_From and
		ia.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (ia.sale_id = @lSaleID_From)) and
		ia.prop_id = @lPropID_From and
			--Remodel Adjustments should never be copied unless this is a supplement
		(imprv_adj_type_cd <> 'RMD' or (@lPropID_From = @lPropID_To and @lSupNum_From <> @lSupNum_To and @lYear_From = @lYear_To)) and
		(@lImprovIDCopy is null or ia.imprv_id = @lImprovIDCopy)
	-- End Table: imprv_adj

	if ( @bSkipEntityAssoc = 0 )
	begin
		-- Begin Table: imprv_entity_assoc
		insert dbo.imprv_entity_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			imprv_id,
			sale_id,
			entity_id,
			entity_pct
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*imprv_id = */ case when t.imprv_id_old is null then iea.imprv_id else t.imprv_id_new end,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			iea.entity_id,
			iea.entity_pct
		from dbo.imprv_entity_assoc as iea with(nolock)
		join dbo.tax_rate as tr with(nolock) on
			tr.tax_rate_yr = @lYear_To and
			tr.entity_id = iea.entity_id
		left outer join @tblImprovID as t on
			t.imprv_id_old = iea.imprv_id
		where
			iea.prop_val_yr = @lYear_From and
			iea.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (iea.sale_id = @lSaleID_From)) and
			iea.prop_id = @lPropID_From and
			(@lImprovIDCopy is null or iea.imprv_id = @lImprovIDCopy)
		-- End Table: imprv_entity_assoc
	end

	if ( @bSkipExemptionAssoc = 0 )
	begin
		-- Begin Table: imprv_exemption_assoc
		insert dbo.imprv_exemption_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			imprv_id,
			sale_id,
			entity_id,
			exmpt_type_cd,
			owner_id,
			amount,
			exempt_pct,
			value_type,
			calc_amount
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*imprv_id = */ case when t.imprv_id_old is null then iea.imprv_id else t.imprv_id_new end,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			entity_id,
			exmpt_type_cd,
			owner_id,
			amount,
			exempt_pct,
			value_type,
			calc_amount
		from dbo.imprv_exemption_assoc as iea with(nolock)
		left outer join @tblImprovID as t on
			t.imprv_id_old = iea.imprv_id
		where
			iea.prop_val_yr = @lYear_From and
			iea.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (iea.sale_id = @lSaleID_From)) and
			iea.prop_id = @lPropID_From and
			(@lImprovIDCopy is null or iea.imprv_id = @lImprovIDCopy) and
			(@lOwnerIDExemptionAndOwnerAssoc is null or iea.owner_id = @lOwnerIDExemptionAndOwnerAssoc)
		-- End Table: imprv_exemption_assoc
	end

	if ( @bSkipOwnerAssoc = 0 )
	begin
		insert dbo.imprv_owner_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			imprv_id,
			sale_id,
			owner_id,
			owner_pct
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*imprv_id = */ case when t.imprv_id_old is null then ioa.imprv_id else t.imprv_id_new end,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			owner_id,
			owner_pct
		from dbo.imprv_owner_assoc as ioa with(nolock)
		left outer join @tblImprovID as t on
			t.imprv_id_old = ioa.imprv_id
		where
			ioa.prop_val_yr = @lYear_From and
			ioa.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (ioa.sale_id = @lSaleID_From)) and
			ioa.prop_id = @lPropID_From and
			(@lImprovIDCopy is null or ioa.imprv_id = @lImprovIDCopy) and
			(@lOwnerIDExemptionAndOwnerAssoc is null or ioa.owner_id = @lOwnerIDExemptionAndOwnerAssoc)
		-- End Table: imprv_owner_assoc
	end

	if (@lPropID_From = @lPropID_To and @lSupNum_From = @lSupNum_To and @lYear_From = @lYear_To)
	begin
		insert dbo.property_exemption_dor_detail with(rowlock)
		(
			exmpt_tax_yr,
			owner_tax_yr,
			sup_num,
			prop_id,
			owner_id,
			exmpt_type_cd,
			item_type,
			item_id,
			value_type,
			exmpt_amount,
			exmpt_percent
		)
		select
			@lYear_To,
			@lYear_To,
			@lSupNum_To,
			@lPropID_To,
			owner_id,
			exmpt_type_cd,
			item_type,
			t.imprv_id_new as item_id,
			value_type,
			exmpt_amount,
			exmpt_percent
		from dbo.property_exemption_dor_detail pedd
		join @tblImprovID t
			on t.imprv_id_old = pedd.item_id
		where pedd.exmpt_tax_yr = @lYear_From
			and pedd.owner_tax_yr = @lYear_From
			and pedd.sup_num = @lSupNum_From
			and pedd.prop_id = @lPropID_From
			and pedd.item_type = 'I'
		and not exists(
			select 1 from dbo.property_exemption_dor_detail pedd2 with(nolock)
			where pedd2.exmpt_tax_yr = @lYear_To
			and pedd2.owner_tax_yr = @lYear_To
			and pedd2.sup_num = @lSupNum_To
			and pedd2.prop_id = @lPropID_To
			and pedd2.owner_id = pedd.owner_id
			and pedd2.exmpt_type_cd = pedd.exmpt_type_cd
			and pedd2.item_type = pedd.item_type
			and pedd2.item_id = t.imprv_id_new
		)
	end

	return(@lNextID)

GO

