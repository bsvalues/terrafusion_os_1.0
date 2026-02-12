
create procedure RecalcSelectImprovementDetailCMSComponent
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				idcc.prop_id,
				convert(smallint, idcc.prop_val_yr),
				convert(smallint, idcc.sup_num),
				idcc.imprv_id,
				idcc.imprv_det_id,
				idcc.section_id,
				idcc.component_id,
				idcc.component_code,
				idcc.component_pct,
				convert(numeric(2,1), case when idcc.quality_rank_override = 0 then -1 else idcc.quality_rank end),
				idcc.units,
				idcc.depreciation_pct,
				idcc.depreciation_pct_override,
				idcc.num_stops,
				convert(int, idcc.climate)
			from #recalc_prop_list as rpl with(nolock)
			join imprv_detail_cms_component as idcc with(nolock) on
				rpl.prop_id = idcc.prop_id and
				rpl.sup_yr = idcc.prop_val_yr and
				rpl.sup_num = idcc.sup_num and
				idcc.sale_id = @lSaleID
			order by
				idcc.prop_id asc,
				idcc.prop_val_yr asc,
				idcc.sup_num asc,
				idcc.imprv_id asc,
				idcc.imprv_det_id asc,
				idcc.section_id asc,
				idcc.component_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				idcc.prop_id,
				convert(smallint, idcc.prop_val_yr),
				convert(smallint, idcc.sup_num),
				idcc.imprv_id,
				idcc.imprv_det_id,
				idcc.section_id,
				idcc.component_id,
				idcc.component_code,
				idcc.component_pct,
				idcc.quality_rank,
				idcc.units,
				idcc.depreciation_pct,
				idcc.depreciation_pct_override,
				idcc.num_stops,
				convert(int, idcc.climate)
			from imprv_detail_cms_component as idcc with(nolock)
			where
				idcc.prop_val_yr = @lYear and
				idcc.sup_num = @lSupNum and
				idcc.sale_id = @lSaleID
			order by
				idcc.prop_id asc,
				idcc.prop_val_yr asc,
				idcc.sup_num asc,
				idcc.imprv_id asc,
				idcc.imprv_det_id asc,
				idcc.section_id asc,
				idcc.component_id asc
		end
		else
		begin
			select
				idcc.prop_id,
				convert(smallint, idcc.prop_val_yr),
				convert(smallint, idcc.sup_num),
				idcc.imprv_id,
				idcc.imprv_det_id,
				idcc.section_id,
				idcc.component_id,
				idcc.component_code,
				idcc.component_pct,
				idcc.quality_rank,
				idcc.units,
				idcc.depreciation_pct,
				idcc.depreciation_pct_override,
				idcc.num_stops,
				convert(int, idcc.climate)
			from imprv_detail_cms_component as idcc with(nolock)
			where
				idcc.prop_id = @lPropID and
				idcc.prop_val_yr = @lYear and
				idcc.sup_num = @lSupNum and
				idcc.sale_id = @lSaleID
			order by
				idcc.prop_id asc,
				idcc.prop_val_yr asc,
				idcc.sup_num asc,
				idcc.imprv_id asc,
				idcc.imprv_det_id asc,
				idcc.section_id asc,
				idcc.component_id asc
		end
	end

	return( @@rowcount )

GO

