
create procedure RecalcSelectImprovementDetail
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				id.prop_id,
				convert(smallint, id.prop_val_yr),
				convert(smallint, id.sup_num),
				id.imprv_id,
				id.imprv_det_id,
				isnull(id.economic_pct, 100.00),
				isnull(id.functional_pct, 100.00),
				isnull(id.physical_pct, 100.00),
				isnull(id.percent_complete, 100.00),
				id.dep_pct,
				id.size_adj_pct,
				convert(
					bit,
					case id.economic_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.functional_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.physical_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.percent_complete_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.dep_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.size_adj_pct_override
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(id.imprv_det_class_cd)),
				upper(rtrim(id.imprv_det_meth_cd)),
				upper(rtrim(id.imprv_det_type_cd)),
				upper(rtrim(id.condition_cd)),
				convert(smallint, isnull(id.depreciation_yr, 0)),
				convert(
					bit,
					case id.depreciation_yr_override
						when 'T' then 1
						else 0
					end
				),
				case when id.imprv_det_area_type = 'C' then id.calc_area else id.sketch_area end,
				convert(
					bit,
					case id.use_up_for_pct_base
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(isnull(id.imprv_det_val_source, 'A'))),
				isnull(id.imprv_det_flat_val, 0),
				isnull(id.unit_price, 0),
				upper(rtrim(id.new_value_flag)),
				isnull(id.new_value, 0),
				convert(
					bit,
					case id.new_value_override
						when 'T' then 1
						else 0
					end
				),
				id.add_factor,
				convert(
					bit,
					case id.add_factor_override
						when 'T' then 1
						else 0
					end
				),
				convert(smallint, isnull(id.yr_built, 0)),
				upper(rtrim(id.imprv_det_sub_class_cd)),
				isnull(id.num_units, 1),
				convert(int, isnull(id.perimeter, 0)),
				convert(int, isnull(id.length, 0)),
				convert(int, isnull(id.width, 0)),
				isnull(id.num_stories, 0),
				isnull(id.stories_multiplier, 0),
				convert(int, isnull(id.height, 0)),
				id.actual_year_built_override,
				isnull(id.permanent_crop_acres, 0),
				isnull(id.permanent_crop_irrigation_acres, 0),
				upper(isnull(id.permanent_crop_age_group, '')),
				upper(isnull(id.permanent_crop_trellis, '')),
				upper(isnull(id.permanent_crop_irrigation_system_type, '')),
				upper(isnull(id.permanent_crop_irrigation_sub_class, '')),
				upper(isnull(id.permanent_crop_density, '')),
				isnull(id.imprv_det_cost_unit_price, 0),
				convert(smallint, id.floor_number),
				id.net_rentable_area,
				isnull(id.imprv_det_ms_val,0) as imprv_det_ms_val,
				isnull(id.imprv_det_ms_unit_price,0) as imprv_det_ms_unit_price
			from #recalc_prop_list as rpl with(nolock)
			join imprv_detail as id with(nolock) on
				rpl.prop_id = id.prop_id and
				rpl.sup_yr = id.prop_val_yr and
				rpl.sup_num = id.sup_num and
				id.sale_id = @lSaleID
			order by
				id.prop_id asc,
				id.prop_val_yr asc,
				id.sup_num asc,
				id.imprv_id asc,
				id.imprv_det_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				id.prop_id,
				convert(smallint, id.prop_val_yr),
				convert(smallint, id.sup_num),
				id.imprv_id,
				id.imprv_det_id,
				isnull(id.economic_pct, 100.00),
				isnull(id.functional_pct, 100.00),
				isnull(id.physical_pct, 100.00),
				isnull(id.percent_complete, 100.00),
				id.dep_pct,
				id.size_adj_pct,
				convert(
					bit,
					case id.economic_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.functional_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.physical_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.percent_complete_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.dep_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.size_adj_pct_override
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(id.imprv_det_class_cd)),
				upper(rtrim(id.imprv_det_meth_cd)),
				upper(rtrim(id.imprv_det_type_cd)),
				upper(rtrim(id.condition_cd)),
				convert(smallint, isnull(id.depreciation_yr, 0)),
				convert(
					bit,
					case id.depreciation_yr_override
						when 'T' then 1
						else 0
					end
				),
				case when id.imprv_det_area_type = 'C' then id.calc_area else id.sketch_area end,
				convert(
					bit,
					case id.use_up_for_pct_base
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(isnull(id.imprv_det_val_source, 'A'))),
				isnull(id.imprv_det_flat_val, 0),
				isnull(id.unit_price, 0),
				upper(rtrim(id.new_value_flag)),
				isnull(id.new_value, 0),
				convert(
					bit,
					case id.new_value_override
						when 'T' then 1
						else 0
					end
				),
				id.add_factor,
				convert(
					bit,
					case id.add_factor_override
						when 'T' then 1
						else 0
					end
				),
				convert(smallint, isnull(id.yr_built, 0)),
				upper(rtrim(id.imprv_det_sub_class_cd)),
				isnull(id.num_units, 1),
				convert(int, isnull(id.perimeter, 0)),
				convert(int, isnull(id.length, 0)),
				convert(int, isnull(id.width, 0)),
				isnull(id.num_stories, 0),
				isnull(id.stories_multiplier, 0),
				convert(int, isnull(id.height, 0)),
				id.actual_year_built_override,
				isnull(id.permanent_crop_acres, 0),
				isnull(id.permanent_crop_irrigation_acres, 0),
				upper(isnull(id.permanent_crop_age_group, '')),
				upper(isnull(id.permanent_crop_trellis, '')),
				upper(isnull(id.permanent_crop_irrigation_system_type, '')),
				upper(isnull(id.permanent_crop_irrigation_sub_class, '')),
				upper(isnull(id.permanent_crop_density, '')),
				isnull(id.imprv_det_cost_unit_price, 0),
				convert(smallint, id.floor_number),
				id.net_rentable_area,
				isnull(id.imprv_det_ms_val,0) as imprv_det_ms_val,
				isnull(id.imprv_det_ms_unit_price,0) as imprv_det_ms_unit_price
			from imprv_detail as id with(nolock)
			where
				id.prop_val_yr = @lYear and
				id.sup_num = @lSupNum and
				id.sale_id = @lSaleID
			order by
				id.prop_id asc,
				id.prop_val_yr asc,
				id.sup_num asc,
				id.imprv_id asc,
				id.imprv_det_id asc
		end
		else
		begin
			select
				id.prop_id,
				convert(smallint, id.prop_val_yr),
				convert(smallint, id.sup_num),
				id.imprv_id,
				id.imprv_det_id,
				isnull(id.economic_pct, 100.00),
				isnull(id.functional_pct, 100.00),
				isnull(id.physical_pct, 100.00),
				isnull(id.percent_complete, 100.00),
				id.dep_pct,
				id.size_adj_pct,
				convert(
					bit,
					case id.economic_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.functional_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.physical_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.percent_complete_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.dep_pct_override
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case id.size_adj_pct_override
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(id.imprv_det_class_cd)),
				upper(rtrim(id.imprv_det_meth_cd)),
				upper(rtrim(id.imprv_det_type_cd)),
				upper(rtrim(id.condition_cd)),
				convert(smallint, isnull(id.depreciation_yr, 0)),
				convert(
					bit,
					case id.depreciation_yr_override
						when 'T' then 1
						else 0
					end
				),
				case when id.imprv_det_area_type = 'C' then id.calc_area else id.sketch_area end,
				convert(
					bit,
					case id.use_up_for_pct_base
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(isnull(id.imprv_det_val_source, 'A'))),
				isnull(id.imprv_det_flat_val, 0),
				isnull(id.unit_price, 0),
				upper(rtrim(id.new_value_flag)),
				isnull(id.new_value, 0),
				convert(
					bit,
					case id.new_value_override
						when 'T' then 1
						else 0
					end
				),
				id.add_factor,
				convert(
					bit,
					case id.add_factor_override
						when 'T' then 1
						else 0
					end
				),
				convert(smallint, isnull(id.yr_built, 0)),
				upper(rtrim(id.imprv_det_sub_class_cd)),
				isnull(id.num_units, 1),
				convert(int, isnull(id.perimeter, 0)),
				convert(int, isnull(id.length, 0)),
				convert(int, isnull(id.width, 0)),
				isnull(id.num_stories, 0),
				isnull(id.stories_multiplier, 0),
				convert(int, isnull(id.height, 0)),
				id.actual_year_built_override,
				isnull(id.permanent_crop_acres, 0),
				isnull(id.permanent_crop_irrigation_acres, 0),
				upper(isnull(id.permanent_crop_age_group, '')),
				upper(isnull(id.permanent_crop_trellis, '')),
				upper(isnull(id.permanent_crop_irrigation_system_type, '')),
				upper(isnull(id.permanent_crop_irrigation_sub_class, '')),
				upper(isnull(id.permanent_crop_density, '')),
				isnull(id.imprv_det_cost_unit_price, 0),
				convert(smallint, id.floor_number),
				id.net_rentable_area,
				isnull(id.imprv_det_ms_val,0) as imprv_det_ms_val,
				isnull(id.imprv_det_ms_unit_price,0) as imprv_det_ms_unit_price
			from imprv_detail as id with(nolock)
			where
				id.prop_id = @lPropID and
				id.prop_val_yr = @lYear and
				id.sup_num = @lSupNum and
				id.sale_id = @lSaleID
			order by
				id.prop_id asc,
				id.prop_val_yr asc,
				id.sup_num asc,
				id.imprv_id asc,
				id.imprv_det_id asc
		end
	end

	return( @@rowcount )

GO

