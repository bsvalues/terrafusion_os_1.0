
create procedure RecalcSelectLand
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
		select
			ld.prop_id,
			convert(smallint, ld.prop_val_yr),
			convert(smallint, ld.sup_num),
			ld.land_seg_id,
			ld.size_acres,
			ld.size_square_feet,
			isnull(ld.ls_mkt_id, -1),
			isnull(ld.ls_ag_id, -1),
			convert(
				bit,
				case ld.land_seg_homesite
					when 'T' then 1
					else 0
				end
			),
			ld.effective_front,
			ld.effective_depth,
			isnull(ld.mkt_unit_price, 0),
			isnull(ld.land_seg_mkt_val, 0),
			isnull(ld.mkt_flat_val, 0),
			upper(rtrim(isnull(ld.mkt_val_source, 'A'))),
			upper(rtrim(ld.ag_use_cd)),
			isnull(ld.ag_unit_price, 0),
			convert(
				bit,
				case ld.ag_apply
					when 'T' then 1
					else 0
				end
			),
			isnull(ld.ag_flat_val, 0),
			upper(rtrim(ld.ag_val_source)),
			isnull(ld.eff_size_acres, 0),
			convert(
				bit,
				case ld.eff_size_acres_override
					when 'T' then 1
					else 0
				end
			),
			isnull(ld.num_lots, 0),
			convert(
				bit,
				case ld.late_ag_apply
					when 'T' then 1
					else 0
				end
			),
			isnull(ld.ag_val, 0),
			convert(smallint, isnull(ld.effective_tax_year, 0)),
			upper(rtrim(ld.land_type_cd)),
			upper(rtrim(ld.state_cd)),
			isnull(ld.land_new_val, 0),
			isnull(ld.arb_val, 0),
			upper(rtrim(ld.land_class_code)),
			upper(rtrim(ld.land_influence_code)),
			ld.size_useable_acres,
			ld.size_useable_square_feet,
			isnull(ld.dist_val, 0),
			isnull(ld.timber_78_val, 0),
			isnull(ld.timber_78_val_pct, 0.00),
			isnull(ld.hs_pct_override,0),
			convert	(
						numeric(13,10),
						case ld.hs_pct_override
							when 1	then isnull(ld.hs_pct, 100.00)
							when 0	then 100.00
							else 100.00
						end
					),
			upper(rtrim(ld.land_soil_code)),
			upper(rtrim(ld.ag_land_type_cd)),
			upper(rtrim(ld.primary_use_cd)),
			isnull(ld.primary_use_override, 0),
			GetSchedFrom = case when use_type_schedule = 1 then type_schedule else null end,
			isnull(ld.new_construction_flag, 0),
			isnull(ld.new_construction_value, 0),
			isnull(ld.new_construction_value_override, 0),
			isnull(ld.width_front, 0),
			isnull(ld.non_taxed_mkt_val, 0),
			ld.ag_pbrs_pct,
			ld.locked_val,
			ld.locked_ag_val,
			upper(rtrim(ld.locked_ag_use_cd))
		from #recalc_prop_list as rpl with(nolock)
		join land_detail as ld with(nolock) on
			rpl.prop_id = ld.prop_id and
			rpl.sup_yr = ld.prop_val_yr and
			rpl.sup_num = ld.sup_num and
			ld.sale_id = @lSaleID
		order by
			ld.prop_id asc,
			ld.prop_val_yr asc,
			ld.sup_num asc,
			ld.land_seg_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ld.prop_id,
				convert(smallint, ld.prop_val_yr),
				convert(smallint, ld.sup_num),
				ld.land_seg_id,
				ld.size_acres,
				ld.size_square_feet,
				isnull(ld.ls_mkt_id, -1),
				isnull(ld.ls_ag_id, -1),
				convert(
					bit,
					case ld.land_seg_homesite
						when 'T' then 1
						else 0
					end
				),
				ld.effective_front,
				ld.effective_depth,
				isnull(ld.mkt_unit_price, 0),
				isnull(ld.land_seg_mkt_val, 0),
				isnull(ld.mkt_flat_val, 0),
				upper(rtrim(isnull(ld.mkt_val_source, 'A'))),
				upper(rtrim(ld.ag_use_cd)),
				isnull(ld.ag_unit_price, 0),
				convert(
					bit,
					case ld.ag_apply
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.ag_flat_val, 0),
				upper(rtrim(ld.ag_val_source)),
				isnull(ld.eff_size_acres, 0),
				convert(
					bit,
					case ld.eff_size_acres_override
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.num_lots, 0),
				convert(
					bit,
					case ld.late_ag_apply
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.ag_val, 0),
				convert(smallint, isnull(ld.effective_tax_year, 0)),
				upper(rtrim(ld.land_type_cd)),
				upper(rtrim(ld.state_cd)),
				isnull(ld.land_new_val, 0),
				isnull(ld.arb_val, 0),
				upper(rtrim(ld.land_class_code)),
				upper(rtrim(ld.land_influence_code)),
				ld.size_useable_acres,
				ld.size_useable_square_feet,
				isnull(ld.dist_val, 0),
				isnull(ld.timber_78_val, 0),
				isnull(ld.timber_78_val_pct, 0.00),
				isnull(ld.hs_pct_override,0),
				convert	(
						numeric(13,10),
						case ld.hs_pct_override
							when 1	then isnull(ld.hs_pct, 100.00)
							when 0	then 100.00
							else 100.00
						end
					),
				upper(rtrim(ld.land_soil_code)),
				upper(rtrim(ld.ag_land_type_cd)),
				upper(rtrim(ld.primary_use_cd)),
				isnull(ld.primary_use_override, 0),
				GetSchedFrom = case when use_type_schedule = 1 then type_schedule else null end,
				isnull(ld.new_construction_flag, 0),
				isnull(ld.new_construction_value, 0),
				isnull(ld.new_construction_value_override, 0),
				isnull(ld.width_front, 0),
				isnull(ld.non_taxed_mkt_val, 0),
				ld.ag_pbrs_pct,
				ld.locked_val,
				ld.locked_ag_val,
				upper(rtrim(ld.locked_ag_use_cd))
			from land_detail as ld with(nolock)
			where
				ld.prop_val_yr = @lYear and
				ld.sup_num = @lSupNum and
				ld.sale_id = @lSaleID
			order by
				ld.prop_id asc,
				ld.prop_val_yr asc,
				ld.sup_num asc,
				ld.land_seg_id asc
		end
		else
		begin
			select
				ld.prop_id,
				convert(smallint, ld.prop_val_yr),
				convert(smallint, ld.sup_num),
				ld.land_seg_id,
				ld.size_acres,
				ld.size_square_feet,
				isnull(ld.ls_mkt_id, -1),
				isnull(ld.ls_ag_id, -1),
				convert(
					bit,
					case ld.land_seg_homesite
						when 'T' then 1
						else 0
					end
				),
				ld.effective_front,
				ld.effective_depth,
				isnull(ld.mkt_unit_price, 0),
				isnull(ld.land_seg_mkt_val, 0),
				isnull(ld.mkt_flat_val, 0),
				upper(rtrim(isnull(ld.mkt_val_source, 'A'))),
				upper(rtrim(ld.ag_use_cd)),
				isnull(ld.ag_unit_price, 0),
				convert(
					bit,
					case ld.ag_apply
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.ag_flat_val, 0),
				upper(rtrim(ld.ag_val_source)),
				isnull(ld.eff_size_acres, 0),
				convert(
					bit,
					case ld.eff_size_acres_override
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.num_lots, 0),
				convert(
					bit,
					case ld.late_ag_apply
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.ag_val, 0),
				convert(smallint, isnull(ld.effective_tax_year, 0)),
				upper(rtrim(ld.land_type_cd)),
				upper(rtrim(ld.state_cd)),
				isnull(ld.land_new_val, 0),
				isnull(ld.arb_val, 0),
				upper(rtrim(ld.land_class_code)),
				upper(rtrim(ld.land_influence_code)),
				ld.size_useable_acres,
				ld.size_useable_square_feet,
				isnull(ld.dist_val, 0),
				isnull(ld.timber_78_val, 0),
				isnull(ld.timber_78_val_pct, 0.00),
				isnull(ld.hs_pct_override,0),
				convert	(
						numeric(13,10),
						case ld.hs_pct_override
							when 1	then isnull(ld.hs_pct, 100.00)
							when 0	then 100.00
							else 100.00
						end
					),
				upper(rtrim(ld.land_soil_code)),
				upper(rtrim(ld.ag_land_type_cd)),
				upper(rtrim(ld.primary_use_cd)),
				isnull(ld.primary_use_override, 0),
				GetSchedFrom = case when use_type_schedule = 1 then type_schedule else null end,
				isnull(ld.new_construction_flag, 0),
				isnull(ld.new_construction_value, 0),
				isnull(ld.new_construction_value_override, 0),
				isnull(ld.width_front, 0),
				isnull(ld.non_taxed_mkt_val, 0),
				ld.ag_pbrs_pct,
				ld.locked_val,
				ld.locked_ag_val,
				upper(rtrim(ld.locked_ag_use_cd))
			from land_detail as ld with(nolock)
			where
				ld.prop_id = @lPropID and
				ld.prop_val_yr = @lYear and
				ld.sup_num = @lSupNum and
				ld.sale_id = @lSaleID
			order by
				ld.prop_id asc,
				ld.prop_val_yr asc,
				ld.sup_num asc,
				ld.land_seg_id asc
		end
	end

	return( @@rowcount )

GO

