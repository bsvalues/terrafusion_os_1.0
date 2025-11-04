
create procedure LayerCopyLand
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

	@lLandSegIDCopy int = null,
	/*
		Meaning:
			null		Copy all land segments
			not null	A specific land_seg_id to copy - Implies @bAssignNewIDs = 1
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
			1 - Overrides the automatic implication that a null @lLandSegIDCopy means
					@bAssignNewIDs must = 1
					Put in for split merge due to lack of time to write a propert "LayerMoveLand",
					where I wanted to move a single land from one property to another and keep the land ID
					the same between the moves, thus allowing the user to move it back to the original property
					and still have the same ID
	*/
	@bCopyImprvLandSalesInfo bit = 0 -- If set to 1, then copy sale_id records too.

/*
	Returns:
		< 0		Error
		Zero	No Error
		> 0		The [first or only depending on input parameter] new land_seg_id
*/

as

	declare @tblLandSegID table (
		land_seg_id_old int not null,
		land_seg_id_new int not null,
		primary key clustered (land_seg_id_old) with fillfactor = 100
	)

set nocount on

	if ( @lLandSegIDCopy is not null and @bOverrideImpliedAssignNewIDs = 0 )
	begin
		-- This is implied
		set @bAssignNewIDs = 1
	end

	declare @lNextID int
	set @lNextID = 0

	-- Begin - Get new IDs if necessary
	if ( @bAssignNewIDs = 1 )
	begin
		-- Get new land_seg_ids
		declare @lNumLand int

		insert @tblLandSegID (land_seg_id_old, land_seg_id_new)
		select
			land_seg_id, 0
		from dbo.land_detail with(nolock)
		where
			prop_val_yr = @lYear_From and
			sup_num = @lSupNum_From and
			sale_id = @lSaleID_From and
			prop_id = @lPropID_From and
			(@lLandSegIDCopy is null or land_seg_id = @lLandSegIDCopy)

		set @lNumLand = @@rowcount
		if ( @lNumLand > 0 )
		begin
			exec dbo.GetUniqueID 'land_detail', @lNextID output, @lNumLand, 0

			set rowcount 1
			while ( @lNumLand > 0 )
			begin
				update @tblLandSegID
				set land_seg_id_new = @lNextID + @lNumLand - 1
				where land_seg_id_new = 0
				
				set @lNumLand = @lNumLand - 1
			end
			set rowcount 0
		end
	end


	-- Begin Table: land_detail
	insert dbo.land_detail with(rowlock) (
		prop_id,
		prop_val_yr,
		land_seg_id,
		sup_num,
		sale_id,
		ls_mkt_id,
		ls_ag_id,
		land_type_cd,
		land_seg_desc,
		land_seg_sl_lock,
		state_cd,
		land_seg_homesite,
		size_acres,
		size_square_feet,
		effective_front,
		effective_depth,
		mkt_unit_price,
		land_seg_mkt_val,
		mkt_calc_val,
		mkt_adj_val,
		mkt_flat_val,
		ag_loss,
		mkt_val_source,
		ag_use_cd,
		ag_unit_price,
		ag_apply,
		ag_val,
		ag_calc_val,
		ag_adj_val,
		ag_flat_val,
		ag_val_type,
		ag_timb_conv_dt,
		ag_val_source,
		ag_eff_tax_year,
		land_seg_comment,
		ag_apply_yr,
		land_seg_orig_val,
		land_seg_up,
		land_adj_type_cd,
		width_front,
		width_back,
		depth_right,
		depth_left,
		eff_size_acres,
		land_adj_amt,
		land_adj_factor,
		land_mass_adj_factor,
		effective_tax_year,
		land_new_val,
		late_ag_apply,
		ref_id1,
		oa_mkt_val,
		oa_ag_val,
		eff_size_acres_override,
		num_lots,
		new_ag,
		new_ag_prev_val,
		new_ag_prev_val_override,
		appraisal_cd,
		arb_val,
		land_class_code,
		land_influence_code,
		size_useable_acres,
		size_useable_square_feet,
		dist_val,
		timber_78_val,
		timber_78_val_pct,
		hs_pct,
		hs_pct_override,
		land_soil_code,
		ag_land_type_cd,
		prev_st_land_type_cd,
		flat_value_comment,
		flat_value_user_id,
		flat_value_dt,
		misc_value,
		new_construction_flag,
		new_construction_value,
		new_construction_value_override,
		last_import_date,
		last_import_user_id,
		assessment_yr_qualified,
		recording_number,
		application_number,
		current_use_effective_acres,
		primary_use_cd,
		primary_use_override,
		sub_use_cd,
		use_type_schedule,
		type_schedule,
		waterfront_footage,
		ag_pbrs_pct
	)
	select
		@lPropID_To,
		@lYear_To,
		/*land_seg_id = */ case when t.land_seg_id_old is null then ld.land_seg_id else t.land_seg_id_new end,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		lsched_mkt.ls_id,
		lsched_ag.ls_id,
		land_type_cd,
		land_seg_desc,
		land_seg_sl_lock,
		state_cd,
		land_seg_homesite,
		size_acres,
		size_square_feet,
		effective_front,
		effective_depth,
		mkt_unit_price,
		land_seg_mkt_val,
		mkt_calc_val,
		mkt_adj_val,
		/* mkt_flat_val = */ case when @szMethod = 'CFYPL' and mkt_val_source <> 'F' then 0 else mkt_flat_val end,
		ag_loss,
		mkt_val_source,
		ag_use_cd,
		ag_unit_price,
		ag_apply,
		ag_val,
		ag_calc_val,
		ag_adj_val,
		/* ag_flat_val = */ case when @szMethod = 'CFYPL' and mkt_val_source <> 'F' then 0 else ag_flat_val end,
		ag_val_type,
		ag_timb_conv_dt,
		ag_val_source,
		ag_eff_tax_year,
		land_seg_comment,
		ag_apply_yr,
		land_seg_orig_val,
		land_seg_up,
		land_adj_type_cd,
		width_front,
		width_back,
		depth_right,
		depth_left,
		eff_size_acres,
		land_adj_amt,
		land_adj_factor,
		land_mass_adj_factor,
		/* effective_tax_year = */ case when @szMethod = 'CFYPL' then null else effective_tax_year end,
		/* land_new_val = */ case when @szMethod = 'CFYPL' then 0 else land_new_val end,
		/* late_ag_apply = */ case when @szMethod = 'CFYPL' then 'F' else late_ag_apply end,
		ref_id1,
		oa_mkt_val,
		oa_ag_val,
		eff_size_acres_override,
		num_lots,
		new_ag,
		new_ag_prev_val,
		new_ag_prev_val_override,
		appraisal_cd,
		arb_val,
		land_class_code,
		land_influence_code,
		size_useable_acres,
		size_useable_square_feet,
		dist_val,
		timber_78_val,
		timber_78_val_pct,
		hs_pct,
		hs_pct_override,
		land_soil_code,
		ag_land_type_cd,
		prev_st_land_type_cd,
		flat_value_comment,
		flat_value_user_id,
		flat_value_dt,
		misc_value,
		new_construction_flag,
		new_construction_value,
		new_construction_value_override,
		last_import_date,
		last_import_user_id,
		assessment_yr_qualified,
		recording_number,
		application_number,
		current_use_effective_acres,
		primary_use_cd,
		primary_use_override,
		sub_use_cd,
		use_type_schedule,
		type_schedule,
		waterfront_footage,
		ag_pbrs_pct
	from dbo.land_detail as ld with(nolock)
	left outer join dbo.land_sched as lsched_mkt with(nolock) on
		lsched_mkt.ls_id = ld.ls_mkt_id and
		lsched_mkt.ls_ag_or_mkt = 'M' and
		lsched_mkt.ls_year = @lYear_To
	left outer join dbo.land_sched as lsched_ag with(nolock) on
		lsched_ag.ls_id = ld.ls_ag_id and
		lsched_ag.ls_ag_or_mkt = 'A' and
		lsched_ag.ls_year = @lYear_To
	left outer join @tblLandSegID as t on
		t.land_seg_id_old = ld.land_seg_id
	where
		ld.prop_val_yr = @lYear_From and
		ld.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (ld.sale_id = @lSaleID_From)) and
		ld.prop_id = @lPropID_From and
		(@lLandSegIDCopy is null or ld.land_seg_id = @lLandSegIDCopy)
	-- End Table: land_detail


	if ( @@rowcount = 0 )
	begin
		-- If nothing was copied, we can skip the rest of the tables
		return(0)
	end

	
	-- land_detail_characteristic
	insert dbo.land_detail_characteristic (
		prop_val_yr,
		sup_num,
		sale_id,
		prop_id,
		land_seg_id,
		characteristic_cd,
		[override],
		determinant_cd
	)
	select
		@lYear_To,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		@lPropID_To,
		/*land_seg_id = */ case when t.land_seg_id_old is null then ldc.land_seg_id else t.land_seg_id_new end,
		characteristic_cd,
		[override],
		determinant_cd
	from dbo.land_detail_characteristic as ldc with(nolock)
	left outer join @tblLandSegID as t on
		t.land_seg_id_old = ldc.land_seg_id
	where
		ldc.prop_val_yr = @lYear_From and
		ldc.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (ldc.sale_id = @lSaleID_From)) and
		ldc.prop_id = @lPropID_From and
		(@lLandSegIDCopy is null or ldc.land_seg_id = @lLandSegIDCopy)
		
	-- property_land_misc_code
	if ( @lLandSegIDCopy is null )
	begin
		insert dbo.property_land_misc_code (
			prop_val_yr,
			sup_num,
			sale_id,
			prop_id,
			misc_id,
			county_indicator,
			cycle,
			region_cd,
			hood_cd,
			subset_cd,
			misc_code,
			value,
			[index],
			indexed_value
		)
		select
			@lYear_To,
			@lSupNum_To,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			@lPropID_To,
			misc_id,
			county_indicator,
			cycle,
			region_cd,
			hood_cd,
			subset_cd,
			misc_code,
			value,
			[index],
			indexed_value
		from dbo.property_land_misc_code as plmc with(nolock)
		where
			plmc.prop_val_yr = @lYear_From and
			plmc.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (plmc.sale_id = @lSaleID_From)) and
			plmc.prop_id = @lPropID_From and
			not exists
			(	select * from property_land_misc_code plmc2 with(nolock)
				where
					plmc2.prop_val_yr = @lYear_To and
					plmc2.sup_num = @lSupNum_To and
					plmc2.sale_id = @lSaleID_To and
					plmc2.prop_id = @lPropID_To and
					plmc2.misc_code = plmc.misc_code
			)
	end
	
	if ( @bAssignNewIDs = 0 )
	begin
		-- Copy all user_land_detail records for the property,
		-- or just the one specific land detail if @lLandSegIDCopy is not null.
		exec dbo.LayerCopyUserTableLand
			@lYear_From, @lSupNum_From, @lPropID_From,
			@lYear_To, @lSupNum_To, @lPropID_To, @lLandSegIDCopy
	end
	else
	begin
		declare
			@lLandSegIDOld int,
			@lLandSegIDNew int
		-- Unfortunately table variables cannot be passed to stored procedures.
		-- So, we must open a cursor and call LayerCopyUserTableLand once
		-- for each row to copy, passing the new segment ID along
		declare curULDRows cursor
		for
			select ld.land_seg_id, t.land_seg_id_new
			from land_detail as ld with(nolock)
			join @tblLandSegID as t on
				t.land_seg_id_old = ld.land_seg_id
			where
				ld.prop_val_yr = @lYear_From and
				ld.sup_num = @lSupNum_From and
				ld.sale_id = 0 and
				ld.prop_id = @lPropID_From and
				(@lLandSegIDCopy is null or ld.land_seg_id = @lLandSegIDCopy)
		for read only
		
		open curULDRows
		fetch next from curULDRows into @lLandSegIDOld, @lLandSegIDNew
		
		while ( @@fetch_status = 0 )
		begin
			exec dbo.LayerCopyUserTableLand
				@lYear_From, @lSupNum_From, @lPropID_From,
				@lYear_To, @lSupNum_To, @lPropID_To,
				@lLandSegIDOld, @lLandSegIDNew
				
			fetch next from curULDRows into @lLandSegIDOld, @lLandSegIDNew
		end
		
		close curULDRows
		deallocate curULDRows
	end

	-- Begin Table: land_adj
	insert dbo.land_adj with(rowlock) (
		prop_id,
		prop_val_yr,
		land_seg_id,
		land_seg_adj_seq,
		sup_num,
		sale_id,
		land_value,
		land_seg_adj_dt,
		land_seg_adj_type,
		land_seg_adj_desc,
		land_seg_adj_cd,
		land_seg_adj_pc,
		land_seg_adj_method
	)
	select
		@lPropID_To,
		@lYear_To,
		/*land_seg_id = */ case when t.land_seg_id_old is null then la.land_seg_id else t.land_seg_id_new end,
		land_seg_adj_seq,
		@lSupNum_To,
		case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
		land_value,
		land_seg_adj_dt,
		land_seg_adj_type,
		land_seg_adj_desc,
		land_seg_adj_cd,
		land_seg_adj_pc,
		land_seg_adj_method
	from dbo.land_adj as la with(nolock)
	left outer join @tblLandSegID as t on
		t.land_seg_id_old = la.land_seg_id
	where
		la.prop_val_yr = @lYear_From and
		la.sup_num = @lSupNum_From and
		((@bCopyImprvLandSalesInfo = 1) or (la.sale_id = @lSaleID_From)) and
		la.prop_id = @lPropID_From and
		(@lLandSegIDCopy is null or la.land_seg_id = @lLandSegIDCopy)
	-- End Table: land_adj


	if ( @bSkipEntityAssoc = 0 )
	begin
		-- Begin Table: land_entity_assoc
		insert dbo.land_entity_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			land_seg_id,
			sale_id,
			entity_id,
			entity_pct
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*land_seg_id = */ case when t.land_seg_id_old is null then lea.land_seg_id else t.land_seg_id_new end,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			lea.entity_id,
			lea.entity_pct
		from dbo.land_entity_assoc as lea with(nolock)
		join dbo.tax_rate as tr with(nolock) on
			tr.tax_rate_yr = @lYear_To and
			tr.entity_id = lea.entity_id
		left outer join @tblLandSegID as t on
			t.land_seg_id_old = lea.land_seg_id
		where
			lea.prop_val_yr = @lYear_From and
			lea.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (lea.sale_id = @lSaleID_From)) and
			lea.prop_id = @lPropID_From and
			(@lLandSegIDCopy is null or lea.land_seg_id = @lLandSegIDCopy)
		-- End Table: imprv_entity_assoc
	end

	if ( @bSkipExemptionAssoc = 0 )
	begin
		-- Begin Table: land_exemption_assoc
		insert dbo.land_exemption_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			land_seg_id,
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
			/*land_seg_id = */ case when t.land_seg_id_old is null then lea.land_seg_id else t.land_seg_id_new end,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			entity_id,
			exmpt_type_cd,
			owner_id,
			amount,
			exempt_pct,
			value_type,
			calc_amount
		from dbo.land_exemption_assoc as lea with(nolock)
		left outer join @tblLandSegID as t on
			t.land_seg_id_old = lea.land_seg_id
		where
			lea.prop_val_yr = @lYear_From and
			lea.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (lea.sale_id = @lSaleID_From)) and
			lea.prop_id = @lPropID_From and
			(@lLandSegIDCopy is null or lea.land_seg_id = @lLandSegIDCopy) and
			(@lOwnerIDExemptionAndOwnerAssoc is null or lea.owner_id = @lOwnerIDExemptionAndOwnerAssoc)
		-- End Table: land_exemption_assoc
	end

	if ( @bSkipOwnerAssoc = 0 )
	begin
		insert dbo.land_owner_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			land_seg_id,
			sale_id,
			owner_id,
			owner_pct
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*land_seg_id = */ case when t.land_seg_id_old is null then loa.land_seg_id else t.land_seg_id_new end,
			case when @bCopyImprvLandSalesInfo = 1 then sale_id else @lSaleID_To end,
			owner_id,
			owner_pct
		from dbo.land_owner_assoc as loa with(nolock)
		left outer join @tblLandSegID as t on
			t.land_seg_id_old = loa.land_seg_id
		where
			loa.prop_val_yr = @lYear_From and
			loa.sup_num = @lSupNum_From and
			((@bCopyImprvLandSalesInfo = 1) or (loa.sale_id = @lSaleID_From)) and
			loa.prop_id = @lPropID_From and
			(@lLandSegIDCopy is null or loa.land_seg_id = @lLandSegIDCopy) and
			(@lOwnerIDExemptionAndOwnerAssoc is null or loa.owner_id = @lOwnerIDExemptionAndOwnerAssoc)
		-- End Table: land_owner_assoc
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
			t.land_seg_id_new as item_id,
			value_type,
			exmpt_amount,
			exmpt_percent
		from dbo.property_exemption_dor_detail pedd
		join @tblLandSegID t
			on t.land_seg_id_old = pedd.item_id
		where pedd.exmpt_tax_yr = @lYear_From
			and pedd.owner_tax_yr = @lYear_From
			and pedd.sup_num = @lSupNum_From
			and pedd.prop_id = @lPropID_From
			and pedd.item_type = 'L'
		and not exists(
			select 1 from dbo.property_exemption_dor_detail pedd2 with(nolock)
			where pedd2.exmpt_tax_yr = @lYear_To
			and pedd2.owner_tax_yr = @lYear_To
			and pedd2.sup_num = @lSupNum_To
			and pedd2.prop_id = @lPropID_To
			and pedd2.owner_id = pedd.owner_id
			and pedd2.exmpt_type_cd = pedd.exmpt_type_cd
			and pedd2.item_type = pedd.item_type
			and pedd2.item_id = t.land_seg_id_new
		)
	end

	return(@lNextID)

GO

