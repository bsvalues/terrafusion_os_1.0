
create procedure RecalcSelectImprovementDetailCMSOccupancy
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				idco.prop_id,
				convert(smallint, idco.prop_val_yr),
				convert(smallint, idco.sup_num),
				idco.imprv_id,
				idco.imprv_det_id,
				idco.section_id,
				idco.occupancy_id,
				idco.occupancy_code,
				idco.occupancy_pct,
				idco.basement_type,
				idco.class,
				idco.height,
				convert(numeric(4,2), idco.quality_rank),
				isnull(idco.basement_area,0),
				isnull(idco.basement_depreciation_pct,0),
				convert(smallint, isnull(idco.basement_effective_year_built,0)),
				isnull(idco.basement_typical_life,0)
			from #recalc_prop_list as rpl with(nolock)
			join imprv_detail_cms_occupancy as idco with(nolock) on
				rpl.prop_id = idco.prop_id and
				rpl.sup_yr = idco.prop_val_yr and
				rpl.sup_num = idco.sup_num and
				idco.sale_id = @lSaleID
			order by
				idco.prop_id asc,
				idco.prop_val_yr asc,
				idco.sup_num asc,
				idco.imprv_id asc,
				idco.imprv_det_id asc,
				idco.occupancy_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				idco.prop_id,
				convert(smallint, idco.prop_val_yr),
				convert(smallint, idco.sup_num),
				idco.imprv_id,
				idco.imprv_det_id,
				idco.section_id,
				idco.occupancy_id,
				idco.occupancy_code,
				idco.occupancy_pct,
				idco.basement_type,
				idco.class,
				idco.height,
				convert(numeric(4,2), idco.quality_rank),
				isnull(idco.basement_area,0),
				isnull(idco.basement_depreciation_pct,0),
				convert(smallint, isnull(idco.basement_effective_year_built,0)),
				isnull(idco.basement_typical_life,0)
			from imprv_detail_cms_occupancy as idco with(nolock)
			where
				idco.prop_val_yr = @lYear and
				idco.sup_num = @lSupNum and
				idco.sale_id = @lSaleID
			order by
				idco.prop_id asc,
				idco.prop_val_yr asc,
				idco.sup_num asc,
				idco.imprv_id asc,
				idco.imprv_det_id asc,
				idco.section_id asc,
				idco.occupancy_id asc
		end
		else
		begin
			select
				idco.prop_id,
				convert(smallint, idco.prop_val_yr),
				convert(smallint, idco.sup_num),
				idco.imprv_id,
				idco.imprv_det_id,
				idco.section_id,
				idco.occupancy_id,
				idco.occupancy_code,
				idco.occupancy_pct,
				idco.basement_type,
				idco.class,
				idco.height,
				convert(numeric(4,2), idco.quality_rank),
				isnull(idco.basement_area,0),
				isnull(idco.basement_depreciation_pct,0),
				convert(smallint, isnull(idco.basement_effective_year_built,0)),
				isnull(idco.basement_typical_life,0)
			from imprv_detail_cms_occupancy as idco with(nolock)
			where
				idco.prop_id = @lPropID and
				idco.prop_val_yr = @lYear and
				idco.sup_num = @lSupNum and
				idco.sale_id = @lSaleID
			order by
				idco.prop_id asc,
				idco.prop_val_yr asc,
				idco.sup_num asc,
				idco.imprv_id asc,
				idco.imprv_det_id asc,
				idco.section_id asc,
				idco.occupancy_id asc
		end
	end

	return( @@rowcount )

GO

