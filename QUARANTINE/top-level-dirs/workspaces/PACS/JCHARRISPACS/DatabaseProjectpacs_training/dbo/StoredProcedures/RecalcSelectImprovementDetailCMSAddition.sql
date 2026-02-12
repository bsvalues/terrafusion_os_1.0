
create procedure RecalcSelectImprovementDetailCMSAddition
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				idca.prop_id,
				convert(smallint, idca.prop_val_yr),
				convert(smallint, idca.sup_num),
				idca.imprv_id,
				idca.imprv_det_id,
				idca.section_id,
				idca.addition_id,
				idca.addition_system_code,
				idca.units,
				idca.unit_cost,
				idca.depreciation_pct,
				idca.depreciation_pct_override,
				convert(smallint, idca.effective_year_built),
				idca.typical_life,
				idca.use_local_multiplier,
				idca.apply_trend,
				base_date = case
					when idca.base_date > msc.commercial_report_date
					then msc.commercial_report_date
					else idca.base_date
				end
			from #recalc_prop_list as rpl with(nolock)
			join imprv_detail_cms_addition as idca with(nolock) on
				rpl.prop_id = idca.prop_id and
				rpl.sup_yr = idca.prop_val_yr and
				rpl.sup_num = idca.sup_num and
				idca.sale_id = @lSaleID
			join ms_config as msc with(nolock) on
				msc.year = idca.prop_val_yr
			order by
				idca.prop_id asc,
				idca.prop_val_yr asc,
				idca.sup_num asc,
				idca.imprv_id asc,
				idca.imprv_det_id asc,
				idca.section_id asc,
				idca.addition_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				idca.prop_id,
				convert(smallint, idca.prop_val_yr),
				convert(smallint, idca.sup_num),
				idca.imprv_id,
				idca.imprv_det_id,
				idca.section_id,
				idca.addition_id,
				idca.addition_system_code,
				idca.units,
				idca.unit_cost,
				idca.depreciation_pct,
				idca.depreciation_pct_override,
				convert(smallint, idca.effective_year_built),
				idca.typical_life,
				idca.use_local_multiplier,
				idca.apply_trend,
				base_date = case
					when idca.base_date > msc.commercial_report_date
					then msc.commercial_report_date
					else idca.base_date
				end
			from imprv_detail_cms_addition as idca with(nolock)
			join ms_config as msc with(nolock) on
				msc.year = idca.prop_val_yr
			where
				idca.prop_val_yr = @lYear and
				idca.sup_num = @lSupNum and
				idca.sale_id = @lSaleID
			order by
				idca.prop_id asc,
				idca.prop_val_yr asc,
				idca.sup_num asc,
				idca.imprv_id asc,
				idca.imprv_det_id asc,
				idca.section_id asc,
				idca.addition_id asc
		end
		else
		begin
			select
				idca.prop_id,
				convert(smallint, idca.prop_val_yr),
				convert(smallint, idca.sup_num),
				idca.imprv_id,
				idca.imprv_det_id,
				idca.section_id,
				idca.addition_id,
				idca.addition_system_code,
				idca.units,
				idca.unit_cost,
				idca.depreciation_pct,
				idca.depreciation_pct_override,
				convert(smallint, idca.effective_year_built),
				idca.typical_life,
				idca.use_local_multiplier,
				idca.apply_trend,
				base_date = case
					when idca.base_date > msc.commercial_report_date
					then msc.commercial_report_date
					else idca.base_date
				end
			from imprv_detail_cms_addition as idca with(nolock)
			join ms_config as msc with(nolock) on
				msc.year = idca.prop_val_yr
			where
				idca.prop_id = @lPropID and
				idca.prop_val_yr = @lYear and
				idca.sup_num = @lSupNum and
				idca.sale_id = @lSaleID
			order by
				idca.prop_id asc,
				idca.prop_val_yr asc,
				idca.sup_num asc,
				idca.imprv_id asc,
				idca.imprv_det_id asc,
				idca.section_id asc,
				idca.addition_id asc
		end
	end

	return( @@rowcount )

GO

