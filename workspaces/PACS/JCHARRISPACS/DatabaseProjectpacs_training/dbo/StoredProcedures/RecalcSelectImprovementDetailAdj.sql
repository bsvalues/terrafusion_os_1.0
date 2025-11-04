
create procedure RecalcSelectImprovementDetailAdj
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				ida.prop_id,
				convert(smallint, ida.prop_val_yr),
				convert(smallint, ida.sup_num),
				ida.imprv_id,
				ida.imprv_det_id,
				ida.imprv_det_adj_seq,
				ida.imprv_det_adj_amt,
				ida.imprv_det_adj_pc,
				convert(smallint, isnull(ida.imprv_det_adj_lid_year_added, 0)),
				isnull(ida.imprv_det_adj_lid_orig_value, 0),
				convert(smallint, isnull(ida.imprv_det_adj_lid_econ_life, 0)),
				isnull(ida.imprv_det_adj_lid_residual_pct, 0),
				upper(rtrim(ida.imprv_adj_type_cd)),
				ida.imprv_det_adj_method
			from #recalc_prop_list as rpl with(nolock)
			join imprv_det_adj as ida with(nolock) on
				rpl.prop_id = ida.prop_id and
				rpl.sup_yr = ida.prop_val_yr and
				rpl.sup_num = ida.sup_num and
				ida.sale_id = @lSaleID
			order by
				ida.prop_id asc,
				ida.prop_val_yr asc,
				ida.sup_num asc,
				ida.imprv_id asc,
				ida.imprv_det_id asc,
				ida.imprv_det_adj_seq asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ida.prop_id,
				convert(smallint, ida.prop_val_yr),
				convert(smallint, ida.sup_num),
				ida.imprv_id,
				ida.imprv_det_id,
				ida.imprv_det_adj_seq,
				ida.imprv_det_adj_amt,
				ida.imprv_det_adj_pc,
				convert(smallint, isnull(ida.imprv_det_adj_lid_year_added, 0)),
				isnull(ida.imprv_det_adj_lid_orig_value, 0),
				convert(smallint, isnull(ida.imprv_det_adj_lid_econ_life, 0)),
				isnull(ida.imprv_det_adj_lid_residual_pct, 0),
				upper(rtrim(ida.imprv_adj_type_cd)),
				ida.imprv_det_adj_method
			from imprv_det_adj as ida with(nolock)
			where
				ida.prop_val_yr = @lYear and
				ida.sup_num = @lSupNum and
				ida.sale_id = @lSaleID
			order by
				ida.prop_id asc,
				ida.prop_val_yr asc,
				ida.sup_num asc,
				ida.imprv_id asc,
				ida.imprv_det_id asc,
				ida.imprv_det_adj_seq asc
		end
		else
		begin
			select
				ida.prop_id,
				convert(smallint, ida.prop_val_yr),
				convert(smallint, ida.sup_num),
				ida.imprv_id,
				ida.imprv_det_id,
				ida.imprv_det_adj_seq,
				ida.imprv_det_adj_amt,
				ida.imprv_det_adj_pc,
				convert(smallint, isnull(ida.imprv_det_adj_lid_year_added, 0)),
				isnull(ida.imprv_det_adj_lid_orig_value, 0),
				convert(smallint, isnull(ida.imprv_det_adj_lid_econ_life, 0)),
				isnull(ida.imprv_det_adj_lid_residual_pct, 0),
				upper(rtrim(ida.imprv_adj_type_cd)),
				ida.imprv_det_adj_method
			from imprv_det_adj as ida with(nolock)
			where
				ida.prop_id = @lPropID and
				ida.prop_val_yr = @lYear and
				ida.sup_num = @lSupNum and
				ida.sale_id = @lSaleID
			order by
				ida.prop_id asc,
				ida.prop_val_yr asc,
				ida.sup_num asc,
				ida.imprv_id asc,
				ida.imprv_det_id asc,
				ida.imprv_det_adj_seq asc
		end
	end

	return( @@rowcount )

GO

