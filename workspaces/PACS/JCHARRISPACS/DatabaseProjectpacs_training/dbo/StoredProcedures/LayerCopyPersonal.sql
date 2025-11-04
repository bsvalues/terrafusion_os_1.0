
create procedure LayerCopyPersonal
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,

	@bAssignNewIDs bit = 0,
	/*
		Meaning
			0			Do not assign new IDs
			1			Assign new IDs
	*/

	@lPPSegIDCopy int = null,
	/*
		Meaning:
			null		Copy all pp segments
			not null	A specific pp_seg_id to copy - Implies @bAssignNewIDs = 1
	*/
	
	@bSkipEntityAssoc bit = 1,
	@bSkipExemptionAssoc bit = 1,
	@bSkipOwnerAssoc bit = 1,
	@lOwnerIDExemptionAndOwnerAssoc int = null,

	@szMethod varchar(23) = null
	/*
		Meaning
			null		Nothing special
			CFYPL		Create future year property layer semantics
	*/

/*
	Returns:
		< 0		Error
		Zero	No Error
		> 0		The [first or only depending on input parameter] new pp_seg_id
*/

as

	declare @tblPPSegID table (
		pp_seg_id_old int not null,
		pp_seg_id_new int not null,
		primary key clustered (pp_seg_id_old) with fillfactor = 100
	)

set nocount on

	if ( @lPPSegIDCopy is not null )
	begin
		-- This is implied
		set @bAssignNewIDs = 1
	end

	declare @lNextID int
	set @lNextID = 0

	-- Begin - Get new IDs if necessary
	if ( @bAssignNewIDs = 1 )
	begin
		-- Get new pp_seg_ids
		declare @lNumPP int

		insert @tblPPSegID (pp_seg_id_old, pp_seg_id_new)
		select
			pp_seg_id, 0
		from dbo.pers_prop_seg with(nolock)
		where
			prop_val_yr = @lYear_From and
			sup_num = @lSupNum_From and
			prop_id = @lPropID_From and
			(@lPPSegIDCopy is null or pp_seg_id = @lPPSegIDCopy)

		set @lNumPP = @@rowcount
		if ( @lNumPP > 0 )
		begin
			exec dbo.GetUniqueID 'pers_prop_seg', @lNextID output, @lNumPP, 0

			set rowcount 1
			while ( @lNumPP > 0 )
			begin
				update @tblPPSegID
				set pp_seg_id_new = @lNextID + @lNumPP - 1
				where pp_seg_id_new = 0
				
				set @lNumPP = @lNumPP - 1
			end
			set rowcount 0
		end
	end


	-- Begin Table: pers_prop_seg
	insert dbo.pers_prop_seg with(rowlock) (
		prop_id,
		prop_val_yr,
		sup_num,
		pp_seg_id,
		sale_id,
		pp_sched_cd,
		pp_table_meth_cd,
		pp_type_cd,
		pp_class_cd,
		pp_density_cd,
		pp_adj_cd,
		pp_area,
		pp_unit_count,
		pp_yr_aquired,
		pp_dep_method,
		pp_pct_good,
		pp_orig_cost,
		pp_economic_pct,
		pp_physical_pct,
		pp_flat_val,
		pp_rendered_val,
		pp_prior_yr_val,
		pp_last_notice_val,
		pp_method_val,
		pp_appraised_val,
		pp_appraise_meth,
		pp_new_val,
		pp_new_val_yr,
		pp_mkt_val,
		pp_comment,
		pp_unit_price,
		pp_qual_cd,
		pp_description,
		pp_sic_cd,
		pp_mkt_val_cd,
		pp_state_cd,
		pp_deprec_type_cd,
		pp_deprec_deprec_cd,
		pp_deprec_override,
		pp_deprec_pct,
		pp_active_flag,
		pp_make,
		pp_model,
		pp_vin,
		pp_matching_status,
		pp_matching_dt,
		pp_year,
		pp_license,
		pp_condition_cd,
		arb_val,
		pp_special_val,
		pp_subseg_val,
		sp_method,
		sp_per_unit_val,
		sp_per_area_val,
		sp_units_area_number,
		dist_val,
		pp_new_val_override,
		pp_new_val_yr_override,
		pp_new_segment,
		farm_asset
	)
	select
		@lPropID_To,
		@lYear_To,
		@lSupNum_To,
		/*pp_seg_id = */ case when t.pp_seg_id_old is null then pps.pp_seg_id else t.pp_seg_id_new end,
		sale_id,
		pp_sched_cd,
		pp_table_meth_cd,
		pp_type_cd,
		pp_class_cd,
		pp_density_cd,
		pp_adj_cd,
		pp_area,
		pp_unit_count,
		pp_yr_aquired,
		pp_dep_method,
		pp_pct_good,
		pp_orig_cost,
		pp_economic_pct,
		pp_physical_pct,
		/* pp_flat_val = */ case when @szMethod = 'CFYPL' and pp_appraise_meth <> 'F' then 0 else pp_flat_val end,
		/* pp_rendered_val = */ case when @szMethod = 'CFYPL' then 0 else pp_rendered_val end,
		/* pp_prior_yr_val = */ case when @szMethod = 'CFYPL' then pp_appraised_val else pp_prior_yr_val end,
		pp_last_notice_val,
		pp_method_val,
		pp_appraised_val,
		/* pp_appraise_meth = */ case when @szMethod = 'CFYPL' and pp_appraise_meth = 'R' then 'A' else pp_appraise_meth end,
		/* pp_new_val = */ case when @szMethod = 'CFYPL' then 0 else pp_new_val end,
		null,	-- pp_new_val_yr is now obsolete
		pp_mkt_val,
		pp_comment,
		pp_unit_price,
		pp_qual_cd,
		pp_description,
		pp_sic_cd,
		pp_mkt_val_cd,
		pp_state_cd,
		pp_deprec_type_cd,
		pp_deprec_deprec_cd,
		pp_deprec_override,
		pp_deprec_pct,
		pp_active_flag,
		pp_make,
		pp_model,
		pp_vin,
		pp_matching_status,
		pp_matching_dt,
		pp_year,
		pp_license,
		pp_condition_cd,
		arb_val,
		pp_special_val,
		pp_subseg_val,
		sp_method,
		sp_per_unit_val,
		sp_per_area_val,
		sp_units_area_number,
		dist_val,
		/* pp_new_val_override = */ case when @szMethod = 'CFYPL' then 0 else pp_new_val_override end,
		0,	--- pp_new_val_yr_override is now obsolete
		/* pp_new_segment = */ case when @szMethod = 'CFYPL' then 0 else pp_new_segment end,
		farm_asset
	from dbo.pers_prop_seg as pps with(nolock)
	left outer join @tblPPSegID as t on
		t.pp_seg_id_old = pps.pp_seg_id
	where
		pps.prop_val_yr = @lYear_From and
		pps.sup_num = @lSupNum_From and
		pps.prop_id = @lPropID_From and
		(@lPPSegIDCopy is null or pps.pp_seg_id = @lPPSegIDCopy)
	-- End Table: pers_prop_seg


	if ( @@rowcount = 0 )
	begin
		-- If nothing was copied, we can skip the rest of the tables
		return(0)
	end


	-- Begin Table: pers_prop_sub_seg
	insert dbo.pers_prop_sub_seg with(rowlock) (
		prop_id,
		prop_val_yr,
		sup_num,
		pp_seg_id,
		pp_sub_seg_id,
		descrip,
		pp_orig_cost,
		pp_yr_aquired,
		pp_new_used,
		pp_type_cd,
		pp_dep_pct,
		pp_pct_good,
		pp_economic_pct,
		pp_physical_pct,
		pp_flat_val,
		pp_rendered_val,
		pp_mkt_val,
		calc_method_flag,
		pp_sic_cd,
		pp_sic_desc,
		pp_dep_type_cd,
		pp_dep_deprec_cd,
		pp_veh_year,
		pp_veh_make,
		pp_veh_model,
		pp_veh_vin,
		pp_veh_license,
		asset_id
	)
	select
		@lPropID_To,
		@lYear_To,
		@lSupNum_To,
		/*pp_seg_id = */ case when t.pp_seg_id_old is null then ppss.pp_seg_id else t.pp_seg_id_new end,
		pp_sub_seg_id,
		descrip,
		pp_orig_cost,
		pp_yr_aquired,
		pp_new_used,
		pp_type_cd,
		pp_dep_pct,
		pp_pct_good,
		pp_economic_pct,
		pp_physical_pct,
		pp_flat_val,
		pp_rendered_val,
		pp_mkt_val,
		calc_method_flag,
		pp_sic_cd,
		pp_sic_desc,
		pp_dep_type_cd,
		pp_dep_deprec_cd,
		pp_veh_year,
		pp_veh_make,
		pp_veh_model,
		pp_veh_vin,
		pp_veh_license,
		asset_id
	from dbo.pers_prop_sub_seg as ppss with(nolock)
	left outer join @tblPPSegID as t on
		t.pp_seg_id_old = ppss.pp_seg_id
	where
		ppss.prop_val_yr = @lYear_From and
		ppss.sup_num = @lSupNum_From and
		ppss.prop_id = @lPropID_From and
		(@lPPSegIDCopy is null or ppss.pp_seg_id = @lPPSegIDCopy)
	-- End Table: pers_prop_sub_seg


	-- Begin Table: pp_seg_sched_assoc
	insert dbo.pp_seg_sched_assoc with(rowlock) (
		prop_id,
		pp_seg_id,
		prop_val_yr,
		sup_num,
		sale_id,
		pp_sched_id,
		value_method,
		table_code,
		segment_type,
		active_flag,
		unit_price,
		flat_price_flag
	)
	select
		@lPropID_To,
		/*pp_seg_id = */ case when t.pp_seg_id_old is null then ppssa.pp_seg_id else t.pp_seg_id_new end,
		@lYear_To,
		@lSupNum_To,
		sale_id,
		pp_sched_id,
		value_method,
		table_code,
		segment_type,
		active_flag,
		unit_price,
		flat_price_flag
	from dbo.pp_seg_sched_assoc as ppssa with(nolock)
	left outer join @tblPPSegID as t on
		t.pp_seg_id_old = ppssa.pp_seg_id
	where
		ppssa.prop_val_yr = @lYear_From and
		ppssa.sup_num = @lSupNum_From and
		ppssa.prop_id = @lPropID_From and
		ppssa.sale_id = 0 and -- Because it is still part of the primary key, can be removed sometime later
		(@lPPSegIDCopy is null or ppssa.pp_seg_id = @lPPSegIDCopy)
	-- End Table: pp_seg_sched_assoc

	if ( @bSkipEntityAssoc = 0 )
	begin
		-- Begin Table: pers_prop_entity_assoc
		insert dbo.pers_prop_entity_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			pp_seg_id,
			sale_id,
			entity_id,
			entity_pct
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*pp_seg_id = */ case when t.pp_seg_id_old is null then ppea.pp_seg_id else t.pp_seg_id_new end,
			0,
			ppea.entity_id,
			ppea.entity_pct
		from dbo.pers_prop_entity_assoc as ppea with(nolock)
		join dbo.tax_rate as tr with(nolock) on
			tr.tax_rate_yr = @lYear_To and
			tr.entity_id = ppea.entity_id
		left outer join @tblPPSegID as t on
			t.pp_seg_id_old = ppea.pp_seg_id
		where
			ppea.prop_val_yr = @lYear_From and
			ppea.sup_num = @lSupNum_From and
			ppea.sale_id = 0 and
			ppea.prop_id = @lPropID_From and
			(@lPPSegIDCopy is null or ppea.pp_seg_id = @lPPSegIDCopy)
		-- End Table: imprv_entity_assoc
	end

	if ( @bSkipExemptionAssoc = 0 )
	begin
		-- Begin Table: pers_prop_exemption_assoc
		insert dbo.pers_prop_exemption_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			pp_seg_id,
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
			/*pp_seg_id = */ case when t.pp_seg_id_old is null then ppea.pp_seg_id else t.pp_seg_id_new end,
			0,
			entity_id,
			exmpt_type_cd,
			owner_id,
			amount,
			exempt_pct,
			value_type,
			calc_amount
		from dbo.pers_prop_exemption_assoc as ppea with(nolock)
		left outer join @tblPPSegID as t on
			t.pp_seg_id_old = ppea.pp_seg_id
		where
			ppea.prop_val_yr = @lYear_From and
			ppea.sup_num = @lSupNum_From and
			ppea.sale_id = 0 and
			ppea.prop_id = @lPropID_From and
			(@lPPSegIDCopy is null or ppea.pp_seg_id = @lPPSegIDCopy) and
			(@lOwnerIDExemptionAndOwnerAssoc is null or ppea.owner_id = @lOwnerIDExemptionAndOwnerAssoc)
		-- End Table: pers_prop_exemption_assoc
	end

	if ( @bSkipOwnerAssoc = 0 )
	begin
		insert dbo.pers_prop_owner_assoc with(rowlock) (
			prop_id,
			sup_num,
			prop_val_yr,
			pp_seg_id,
			sale_id,
			owner_id,
			owner_pct
		)
		select
			@lPropID_To,
			@lSupNum_To,
			@lYear_To,
			/*pp_seg_id = */ case when t.pp_seg_id_old is null then ppoa.pp_seg_id else t.pp_seg_id_new end,
			0,
			owner_id,
			owner_pct
		from dbo.pers_prop_owner_assoc as ppoa with(nolock)
		left outer join @tblPPSegID as t on
			t.pp_seg_id_old = ppoa.pp_seg_id
		where
			ppoa.prop_val_yr = @lYear_From and
			ppoa.sup_num = @lSupNum_From and
			ppoa.sale_id = 0 and
			ppoa.prop_id = @lPropID_From and
			(@lPPSegIDCopy is null or ppoa.pp_seg_id = @lPPSegIDCopy) and
			(@lOwnerIDExemptionAndOwnerAssoc is null or ppoa.owner_id = @lOwnerIDExemptionAndOwnerAssoc)
		-- End Table: pers_prop_owner_assoc
	end

	return(@lNextID)

GO

