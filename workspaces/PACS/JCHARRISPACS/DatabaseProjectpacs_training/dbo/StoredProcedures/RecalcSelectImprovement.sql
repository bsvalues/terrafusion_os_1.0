
CREATE procedure RecalcSelectImprovement
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
		select
			i.prop_id,
			convert(smallint, i.prop_val_yr),
			convert(smallint, i.sup_num),
			i.imprv_id,
			isnull(i.economic_pct, 100.00),
			isnull(i.functional_pct, 100.00),
			isnull(i.physical_pct, 100.00),
			isnull(i.percent_complete, 100.00),
			convert(smallint, isnull(i.effective_yr_blt, 0)),
			convert(
				bit,
				case i.imprv_homesite
					when 'Y' then 1
					when 'T' then 1
					else 0
				end
			),
			isnull(i.flat_val, 0),
			upper(rtrim(isnull(i.imprv_val_source, 'A'))),
			isnull(i.imp_new_val, 0),
			upper(rtrim(i.imp_new_val_override)),
			upper(rtrim(i.stories)),
			upper(rtrim(i.imprv_state_cd)),
			isnull(i.arb_val, 0),
			upper(rtrim(i.imprv_type_cd)),
			isnull(i.num_imprv, 0),
			isnull(i.dep_pct, 100.00),
			isnull(i.dist_val, 0),
			isnull(i.hs_pct_override,0),
			convert	(
						numeric(13,10),
						case i.hs_pct_override
							when 1	then isnull(i.hs_pct, 100.00)
							when 0	then 100.00
							else 100.00
						end
					),
			upper(rtrim(i.primary_use_cd)),
			i.primary_use_override,
			upper(rtrim(i.secondary_use_cd)),
			i.secondary_use_override,
			convert(smallint, isnull(i.actual_year_built, 0)),
			i.permanent_crop_land_acres_override,
			isnull(i.permanent_crop_land_acres, 0),
			i.locked_val
		from #recalc_prop_list as rpl with(nolock)
		join imprv as i with(nolock) on
			rpl.prop_id = i.prop_id and
			rpl.sup_yr = i.prop_val_yr and
			rpl.sup_num = i.sup_num and
			i.sale_id = @lSaleID
		order by
			i.prop_id asc,
			i.prop_val_yr asc,
			i.sup_num asc,
			i.imprv_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				i.prop_id,
				convert(smallint, i.prop_val_yr),
				convert(smallint, i.sup_num),
				i.imprv_id,
				isnull(i.economic_pct, 100.00),
				isnull(i.functional_pct, 100.00),
				isnull(i.physical_pct, 100.00),
				isnull(i.percent_complete, 100.00),
				convert(smallint, isnull(i.effective_yr_blt, 0)),
				convert(
					bit,
					case i.imprv_homesite
						when 'Y' then 1
						when 'T' then 1
						else 0
					end
				),
				isnull(i.flat_val, 0),
				upper(rtrim(isnull(i.imprv_val_source, 'A'))),
				isnull(i.imp_new_val, 0),
				upper(rtrim(i.imp_new_val_override)),
				upper(rtrim(i.stories)),
				upper(rtrim(i.imprv_state_cd)),
				isnull(i.arb_val, 0),
				upper(rtrim(i.imprv_type_cd)),
				isnull(i.num_imprv, 0),
				isnull(i.dep_pct, 100.00),
				isnull(i.dist_val, 0),
				isnull(i.hs_pct_override,0),
				convert	(
							numeric(13,10),
							case i.hs_pct_override
								when 1	then isnull(i.hs_pct, 100.00)
								when 0	then 100.00
								else 100.00
							end
						),
				upper(rtrim(i.primary_use_cd)),
				i.primary_use_override,
				upper(rtrim(i.secondary_use_cd)),
				i.secondary_use_override,
				convert(smallint, isnull(i.actual_year_built, 0)),
				i.permanent_crop_land_acres_override,
				isnull(i.permanent_crop_land_acres, 0),
				i.locked_val
			from imprv as i with(nolock)
			where
				i.prop_val_yr = @lYear and
				i.sup_num = @lSupNum and
				i.sale_id = @lSaleID
			order by
				i.prop_id asc,
				i.prop_val_yr asc,
				i.sup_num asc,
				i.imprv_id asc
		end
		else
		begin
			select
				i.prop_id,
				convert(smallint, i.prop_val_yr),
				convert(smallint, i.sup_num),
				i.imprv_id,
				isnull(i.economic_pct, 100.00),
				isnull(i.functional_pct, 100.00),
				isnull(i.physical_pct, 100.00),
				isnull(i.percent_complete, 100.00),
				convert(smallint, isnull(i.effective_yr_blt, 0)),
				convert(
					bit,
					case i.imprv_homesite
						when 'Y' then 1
						when 'T' then 1
						else 0
					end
				),
				isnull(i.flat_val, 0),
				upper(rtrim(isnull(i.imprv_val_source, 'A'))),
				isnull(i.imp_new_val, 0),
				upper(rtrim(i.imp_new_val_override)),
				upper(rtrim(i.stories)),
				upper(rtrim(i.imprv_state_cd)),
				isnull(i.arb_val, 0),
				upper(rtrim(i.imprv_type_cd)),
				isnull(i.num_imprv, 0),
				isnull(i.dep_pct, 100.00),
				isnull(i.dist_val, 0),
				isnull(i.hs_pct_override,0),
				convert	(
							numeric(13,10),
							case i.hs_pct_override
								when 1	then isnull(i.hs_pct, 100.00)
								when 0	then 100.00
								else 100.00
							end
						),
				upper(rtrim(i.primary_use_cd)),
				i.primary_use_override,
				upper(rtrim(i.secondary_use_cd)),
				i.secondary_use_override,
				convert(smallint, isnull(i.actual_year_built, 0)),
				i.permanent_crop_land_acres_override,
				isnull(i.permanent_crop_land_acres, 0),
				i.locked_val
			from imprv as i with(nolock)
			where
				i.prop_id = @lPropID and
				i.prop_val_yr = @lYear and
				i.sup_num = @lSupNum and
				i.sale_id = @lSaleID
			order by
				i.prop_id asc,
				i.prop_val_yr asc,
				i.sup_num asc,
				i.imprv_id asc
		end
	end

	return( @@rowcount )

GO

