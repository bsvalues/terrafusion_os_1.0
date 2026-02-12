
create procedure RecalcSelectPersonalPropertySegment
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0 -- No longer used
as

	if ( @lPacsUserID != 0 )
	begin
			select
				pps.prop_id,
				convert(smallint, pps.prop_val_yr),
				convert(smallint, pps.sup_num),
				pps.pp_seg_id,
				upper(rtrim(pps.pp_class_cd)),
				upper(rtrim(pps.pp_density_cd)),
				pps.pp_area,
				pps.pp_unit_count,
				convert(smallint, isnull(pps.pp_yr_aquired, 0)),
				pps.pp_pct_good,
				isnull(pps.pp_orig_cost, 0),
				pps.pp_economic_pct,
				pps.pp_physical_pct,
				isnull(pps.pp_flat_val, 0),
				isnull(pps.pp_rendered_val, 0),
				isnull(pps.pp_prior_yr_val, 0),
				isnull(pps.pp_last_notice_val, 0),
				upper(rtrim(pps.pp_appraise_meth)),
				isnull(pps.pp_new_val, 0),
				upper(rtrim(pps.pp_qual_cd)),
				upper(rtrim(pps.pp_deprec_type_cd)),
				upper(rtrim(pps.pp_deprec_deprec_cd)),
				convert(
					bit,
					case pps.pp_deprec_override
						when 'T' then 1
						else 0
					end
				),
				pps.pp_deprec_pct,
				pps.pp_unit_price,
				isnull(pps.pp_appraised_val, 0),
				upper(rtrim(pps.pp_state_cd)),
				isnull(pps.arb_val, 0),
				isnull(pps.pp_special_val, 0),
				isnull(pps.sp_per_unit_val, 0),
				isnull(pps.sp_per_area_val, 0),
				isnull(pps.sp_units_area_number, 0),
				upper(rtrim(pps.sp_method)),
				isnull(pps.dist_val, 0),
				pps.pp_new_segment,
				pps.pp_new_val_override,
				pps.farm_asset,
				pps.locked_val

			from #recalc_prop_list as rpl with(nolock)
			join pers_prop_seg as pps with(nolock) on
				rpl.prop_id = pps.prop_id and
				rpl.sup_yr = pps.prop_val_yr and
				rpl.sup_num = pps.sup_num and
				pps.pp_active_flag = 'T'
			order by
				pps.prop_id asc,
				pps.prop_val_yr asc,
				pps.sup_num asc,
				pps.pp_seg_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				pps.prop_id,
				convert(smallint, pps.prop_val_yr),
				convert(smallint, pps.sup_num),
				pps.pp_seg_id,
				upper(rtrim(pps.pp_class_cd)),
				upper(rtrim(pps.pp_density_cd)),
				pps.pp_area,
				pps.pp_unit_count,
				convert(smallint, isnull(pps.pp_yr_aquired, 0)),
				pps.pp_pct_good,
				isnull(pps.pp_orig_cost, 0),
				pps.pp_economic_pct,
				pps.pp_physical_pct,
				isnull(pps.pp_flat_val, 0),
				isnull(pps.pp_rendered_val, 0),
				isnull(pps.pp_prior_yr_val, 0),
				isnull(pps.pp_last_notice_val, 0),
				upper(rtrim(pps.pp_appraise_meth)),
				isnull(pps.pp_new_val, 0),
				upper(rtrim(pps.pp_qual_cd)),
				upper(rtrim(pps.pp_deprec_type_cd)),
				upper(rtrim(pps.pp_deprec_deprec_cd)),
				convert(
					bit,
					case pps.pp_deprec_override
						when 'T' then 1
						else 0
					end
				),
				pps.pp_deprec_pct,
				pps.pp_unit_price,
				isnull(pps.pp_appraised_val, 0),
				upper(rtrim(pps.pp_state_cd)),
				isnull(pps.arb_val, 0),
				isnull(pps.pp_special_val, 0),
				isnull(pps.sp_per_unit_val, 0),
				isnull(pps.sp_per_area_val, 0),
				isnull(pps.sp_units_area_number, 0),
				upper(rtrim(pps.sp_method)),
				isnull(pps.dist_val, 0),
				pps.pp_new_segment,
				pps.pp_new_val_override,
				pps.farm_asset,
				pps.locked_val

			from pers_prop_seg as pps with(nolock)
			where
				pps.prop_val_yr = @lYear and
				pps.sup_num = @lSupNum and
				pps.pp_active_flag = 'T'
			order by
				pps.prop_id asc,
				pps.prop_val_yr asc,
				pps.sup_num asc,
				pps.pp_seg_id asc
		end
		else
		begin
			select
				pps.prop_id,
				convert(smallint, pps.prop_val_yr),
				convert(smallint, pps.sup_num),
				pps.pp_seg_id,
				upper(rtrim(pps.pp_class_cd)),
				upper(rtrim(pps.pp_density_cd)),
				pps.pp_area,
				pps.pp_unit_count,
				convert(smallint, isnull(pps.pp_yr_aquired, 0)),
				pps.pp_pct_good,
				isnull(pps.pp_orig_cost, 0),
				pps.pp_economic_pct,
				pps.pp_physical_pct,
				isnull(pps.pp_flat_val, 0),
				isnull(pps.pp_rendered_val, 0),
				isnull(pps.pp_prior_yr_val, 0),
				isnull(pps.pp_last_notice_val, 0),
				upper(rtrim(pps.pp_appraise_meth)),
				isnull(pps.pp_new_val, 0),
				upper(rtrim(pps.pp_qual_cd)),
				upper(rtrim(pps.pp_deprec_type_cd)),
				upper(rtrim(pps.pp_deprec_deprec_cd)),
				convert(
					bit,
					case pps.pp_deprec_override
						when 'T' then 1
						else 0
					end
				),
				pps.pp_deprec_pct,
				pps.pp_unit_price,
				isnull(pps.pp_appraised_val, 0),
				upper(rtrim(pps.pp_state_cd)),
				isnull(pps.arb_val, 0),
				isnull(pps.pp_special_val, 0),
				isnull(pps.sp_per_unit_val, 0),
				isnull(pps.sp_per_area_val, 0),
				isnull(pps.sp_units_area_number, 0),
				upper(rtrim(pps.sp_method)),
				isnull(pps.dist_val, 0),
				pps.pp_new_segment,
				pps.pp_new_val_override,
				pps.farm_asset,
				pps.locked_val

			from pers_prop_seg as pps with(nolock)
			where
				pps.prop_id = @lPropID and
				pps.prop_val_yr = @lYear and
				pps.sup_num = @lSupNum and
				pps.pp_active_flag = 'T'
			order by
				pps.prop_id asc,
				pps.prop_val_yr asc,
				pps.sup_num asc,
				pps.pp_seg_id asc
		end
	end

	return( @@rowcount )

GO

