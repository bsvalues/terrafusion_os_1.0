
create procedure RecalcSelectProperty
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				p.prop_id,
				convert(smallint, pv.prop_val_yr),
				convert(smallint, pv.sup_num),
				convert(
					tinyint,
					case p.prop_type_cd
						when 'R'  then 0
						when 'MH' then 1
						when 'P'  then 2
						when 'MN' then 3
						when 'A'  then 4
					end
				),
				upper(rtrim(pv.shared_prop_cad_code)),
				isnull(upper(rtrim(pv.hood_cd)), ''),
				case p.prop_type_cd 
					when 'MH' then upper(left(rtrim(isnull(pv.mbl_hm_park, '')), 10))
					else isnull(upper(rtrim(pv.abs_subdv_cd)), '')
				end,
				convert(
					tinyint,
					case pv.appr_method
						when 'C' then 0
						when 'I' then 1
						when 'S' then 2
						when 'A' then 3
						when 'D' then 4
						when 'G' then 5
						else 0
					end
				),
				pv.eff_size_acres,
				convert(int, isnull(pv.oil_wells, 0)),
				convert(
					bit,
					case pv.oil_wells_apply_adjust
						when 'T' then 1
						else 0
					end
				),
				convert(smallint, isnull(pv.hscap_prev_reappr_yr, 0)),
				convert(smallint, isnull(pv.hscap_base_yr, 0)),
				convert(
					bit,
					case pv.hscap_base_yr_override
						when 'T' then 1
						else 0
					end
				),
				isnull(pv.hscap_prevhsval, 0),
				isnull(pv.hscap_newhsval, 0),
				convert(
					bit,
					case pv.hscap_override_prevhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.hscap_override_newhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.vit_flag
						when 'T' then 1
						else 0
					end
				),
				isnull(pv.market, 0),
				upper(rtrim(p.state_cd)),
				isnull(pv.assessed_val, 0),
				convert(
					bit,
					case pv.udi_parent
						when 'T' then 1
						else 0
					end
				),
				case
					when pv.udi_status is null then pv.udi_parent_prop_id
					else null
				end,
				pv.rgn_cd,
				pv.subset_cd,
				pv.map_id,
				p.road_access,
				p.topography,
				p.utilities,
				p.zoning,
				upper(rtrim(pv.property_use_cd)),
				pv.sub_market_cd,
				pv.visibility_access_cd,
				pv.last_appraisal_dt,
				IsNull(pv.timber_78, 0),
				convert(bit, case p.reference_flag when 'T' then 1 else 0 end),
				left(pv.mbl_hm_park, 10),
				pv.dist_vit_val,
				isnull(pv.cycle, -1),
				isnull(pv.cycle_override, 0),
				upper(rtrim(pv.secondary_use_cd)),
				isnull(pv.apply_miscellaneous_codes, 0),
				upper(rtrim(pv.sub_type)),
				convert(numeric(14,0), pv.dor_value),
				pyc.lMarketValPropGridID,
				pv.has_locked_values
			from #recalc_prop_list as rpl with(nolock)
			join property_val as pv with(nolock) on
				rpl.prop_id = pv.prop_id and
				rpl.sup_yr = pv.prop_val_yr and
				rpl.sup_num = pv.sup_num
			join property as p with(nolock) on
				pv.prop_id = p.prop_id
			left outer join comparable_grid_prop_year_comptype as pyc with(nolock) on
				pyc.lYear = pv.prop_val_yr and
				pyc.lPropID = pv.prop_id and
				pyc.szCompType = 'S'
			order by
				p.prop_id asc,
				pv.prop_val_yr asc,
				pv.sup_num asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				p.prop_id,
				convert(smallint, pv.prop_val_yr),
				convert(smallint, pv.sup_num),
				convert(
					tinyint,
					case p.prop_type_cd
						when 'R'  then 0
						when 'MH' then 1
						when 'P'  then 2
						when 'MN' then 3
						when 'A'  then 4
					end
				),
				upper(rtrim(pv.shared_prop_cad_code)),
				isnull(upper(rtrim(pv.hood_cd)), ''),
				case p.prop_type_cd 
					when 'MH' then upper(left(rtrim(isnull(pv.mbl_hm_park, '')), 10))
					else isnull(upper(rtrim(pv.abs_subdv_cd)), '')
				end,
				convert(
					tinyint,
					case pv.appr_method
						when 'C' then 0
						when 'I' then 1
						when 'S' then 2
						when 'A' then 3
						when 'D' then 4
						when 'G' then 5
						else 0
					end
				),
				pv.eff_size_acres,
				convert(int, isnull(pv.oil_wells, 0)),
				convert(
					bit,
					case pv.oil_wells_apply_adjust
						when 'T' then 1
						else 0
					end
				),
				convert(smallint, isnull(pv.hscap_prev_reappr_yr, 0)),
				convert(smallint, isnull(pv.hscap_base_yr, 0)),
				convert(
					bit,
					case pv.hscap_base_yr_override
						when 'T' then 1
						else 0
					end
				),
				isnull(pv.hscap_prevhsval, 0),
				isnull(pv.hscap_newhsval, 0),
				convert(
					bit,
					case pv.hscap_override_prevhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.hscap_override_newhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.vit_flag
						when 'T' then 1
						else 0
					end
				),
				isnull(pv.market, 0),
				upper(rtrim(p.state_cd)),
				isnull(pv.assessed_val, 0),
				convert(
					bit,
					case pv.udi_parent
						when 'T' then 1
						else 0
					end
				),
				case
					when pv.udi_status is null then pv.udi_parent_prop_id
					else null
				end,
				pv.rgn_cd,
				pv.subset_cd,
				pv.map_id,
				p.road_access,
				p.topography,
				p.utilities,
				p.zoning,
				upper(rtrim(pv.property_use_cd)),
				pv.sub_market_cd,
				pv.visibility_access_cd,
				pv.last_appraisal_dt,
				IsNull(pv.timber_78, 0),
				convert(bit, case p.reference_flag when 'T' then 1 else 0 end),
				left(pv.mbl_hm_park, 10),
				pv.dist_vit_val,
				isnull(pv.cycle, -1),
				isnull(pv.cycle_override, 0),
				upper(rtrim(pv.secondary_use_cd)),
				isnull(pv.apply_miscellaneous_codes, 0),
				upper(rtrim(pv.sub_type)),
				convert(numeric(14,0), pv.dor_value),
				pyc.lMarketValPropGridID,
				pv.has_locked_values
			from property_val as pv with(nolock)
			join property as p with(nolock) on
				pv.prop_id = p.prop_id
			left outer join comparable_grid_prop_year_comptype as pyc with(nolock) on
				pyc.lYear = pv.prop_val_yr and
				pyc.lPropID = pv.prop_id and
				pyc.szCompType = 'S'
			where
				pv.prop_val_yr = @lYear and
				pv.sup_num = @lSupNum and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			order by
				p.prop_id asc,
				pv.prop_val_yr asc,
				pv.sup_num asc
		end
		else
		begin
			select
				p.prop_id,
				convert(smallint, pv.prop_val_yr),
				convert(smallint, pv.sup_num),
				convert(
					tinyint,
					case p.prop_type_cd
						when 'R'  then 0
						when 'MH' then 1
						when 'P'  then 2
						when 'MN' then 3
						when 'A'  then 4
					end
				),
				upper(rtrim(pv.shared_prop_cad_code)),
				isnull(upper(rtrim(pv.hood_cd)), ''),
				case p.prop_type_cd 
					when 'MH' then upper(left(rtrim(isnull(pv.mbl_hm_park, '')), 10))
					else isnull(upper(rtrim(pv.abs_subdv_cd)), '')
				end,
				convert(
					tinyint,
					case pv.appr_method
						when 'C' then 0
						when 'I' then 1
						when 'S' then 2
						when 'A' then 3
						when 'D' then 4
						when 'G' then 5
						else 0
					end
				),
				pv.eff_size_acres,
				convert(int, isnull(pv.oil_wells, 0)),
				convert(
					bit,
					case pv.oil_wells_apply_adjust
						when 'T' then 1
						else 0
					end
				),
				convert(smallint, isnull(pv.hscap_prev_reappr_yr, 0)),
				convert(smallint, isnull(pv.hscap_base_yr, 0)),
				convert(
					bit,
					case pv.hscap_base_yr_override
						when 'T' then 1
						else 0
					end
				),
				isnull(pv.hscap_prevhsval, 0),
				isnull(pv.hscap_newhsval, 0),
				convert(
					bit,
					case pv.hscap_override_prevhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.hscap_override_newhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.vit_flag
						when 'T' then 1
						else 0
					end
				),
				isnull(pv.market, 0),
				upper(rtrim(p.state_cd)),
				isnull(pv.assessed_val, 0),
				convert(
					bit,
					case pv.udi_parent
						when 'T' then 1
						else 0
					end
				),
				case
					when pv.udi_status is null then pv.udi_parent_prop_id
					else null
				end,
				pv.rgn_cd,
				pv.subset_cd,
				pv.map_id,
				p.road_access,
				p.topography,
				p.utilities,
				p.zoning,
				upper(rtrim(pv.property_use_cd)),
				pv.sub_market_cd,
				pv.visibility_access_cd,
				pv.last_appraisal_dt,
				IsNull(pv.timber_78, 0),
				convert(bit, case p.reference_flag when 'T' then 1 else 0 end),
				left(pv.mbl_hm_park, 10),
				pv.dist_vit_val,
				isnull(pv.cycle, -1),
				isnull(pv.cycle_override, 0),
				upper(rtrim(pv.secondary_use_cd)),
				isnull(pv.apply_miscellaneous_codes, 0),
				upper(rtrim(pv.sub_type)),
				convert(numeric(14,0), pv.dor_value),
				pyc.lMarketValPropGridID,
				pv.has_locked_values
			from property_val as pv with(nolock)
			join property as p with(nolock) on
				pv.prop_id = p.prop_id
			left outer join comparable_grid_prop_year_comptype as pyc with(nolock) on
				pyc.lYear = pv.prop_val_yr and
				pyc.lPropID = pv.prop_id and
				pyc.szCompType = 'S'
			where
				pv.prop_id = @lPropID and
				pv.prop_val_yr = @lYear and
				pv.sup_num = @lSupNum
			order by
				p.prop_id asc,
				pv.prop_val_yr asc,
				pv.sup_num asc
		end
	end

	return( @@rowcount )

GO

