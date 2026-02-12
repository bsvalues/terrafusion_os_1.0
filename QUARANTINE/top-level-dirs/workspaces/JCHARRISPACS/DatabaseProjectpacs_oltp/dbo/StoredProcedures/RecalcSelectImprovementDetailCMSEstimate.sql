
create procedure RecalcSelectImprovementDetailCMSEstimate
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				idce.prop_id,
				convert(smallint, idce.prop_val_yr),
				convert(smallint, idce.sup_num),
				idce.imprv_id,
				idce.imprv_det_id,
				idce.zip_code,
				convert(smallint, idce.effective_year_built),
				idce.effective_age_adjustment,
				idce.base_date,
				idce.local_multiplier,
				idce.quality_rank
			from #recalc_prop_list as rpl with(nolock)
			join imprv_detail_cms_estimate as idce with(nolock) on
				rpl.prop_id = idce.prop_id and
				rpl.sup_yr = idce.prop_val_yr and
				rpl.sup_num = idce.sup_num and
				idce.sale_id = @lSaleID
			order by
				idce.prop_id asc,
				idce.prop_val_yr asc,
				idce.sup_num asc,
				idce.imprv_id asc,
				idce.imprv_det_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				idce.prop_id,
				convert(smallint, idce.prop_val_yr),
				convert(smallint, idce.sup_num),
				idce.imprv_id,
				idce.imprv_det_id,
				idce.zip_code,
				convert(smallint, idce.effective_year_built),
				idce.effective_age_adjustment,
				idce.base_date,
				idce.local_multiplier,
				idce.quality_rank
			from imprv_detail_cms_estimate as idce with(nolock)
			where
				idce.prop_val_yr = @lYear and
				idce.sup_num = @lSupNum and
				idce.sale_id = @lSaleID
			order by
				idce.prop_id asc,
				idce.prop_val_yr asc,
				idce.sup_num asc,
				idce.imprv_id asc,
				idce.imprv_det_id asc
		end
		else
		begin
			select
				idce.prop_id,
				convert(smallint, idce.prop_val_yr),
				convert(smallint, idce.sup_num),
				idce.imprv_id,
				idce.imprv_det_id,
				idce.zip_code,
				convert(smallint, idce.effective_year_built),
				idce.effective_age_adjustment,
				idce.base_date,
				idce.local_multiplier,
				idce.quality_rank
			from imprv_detail_cms_estimate as idce with(nolock)
			where
				idce.prop_id = @lPropID and
				idce.prop_val_yr = @lYear and
				idce.sup_num = @lSupNum and
				idce.sale_id = @lSaleID
			order by
				idce.prop_id asc,
				idce.prop_val_yr asc,
				idce.sup_num asc,
				idce.imprv_id asc,
				idce.imprv_det_id asc
		end
	end

	return( @@rowcount )

GO

