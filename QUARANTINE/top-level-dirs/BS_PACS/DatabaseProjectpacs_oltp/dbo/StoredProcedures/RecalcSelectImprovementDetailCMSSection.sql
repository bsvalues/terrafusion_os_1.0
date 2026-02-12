
create procedure RecalcSelectImprovementDetailCMSSection
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				idcs.prop_id,
				convert(smallint, idcs.prop_val_yr),
				convert(smallint, idcs.sup_num),
				idcs.imprv_id,
				idcs.imprv_det_id,
				idcs.section_id,
				idcs.section_type,
				idcs.section_description,
				idcs.stories,
				idcs.perimeter_shape_flag,
				idcs.perimeter,
				idcs.shape,
				idcs.area,
				convert(smallint, idcs.effective_year_built),
				convert(int, idcs.dep_type),
				idcs.dep_pct,
				idcs.dep_typical_life,
				idcs.dep_physical,
				idcs.dep_functional,
				idcs.dep_physical_functional,
				idcs.dep_external,
				idcs.dep_additional_functional,
				idcs.basement_building_section_id,
				idcs.basement_fireproof_flag,
				idcs.dep_override
			from #recalc_prop_list as rpl with(nolock)
			join imprv_detail_cms_section as idcs with(nolock) on
				rpl.prop_id = idcs.prop_id and
				rpl.sup_yr = idcs.prop_val_yr and
				rpl.sup_num = idcs.sup_num and
				idcs.sale_id = @lSaleID
			order by
				idcs.prop_id asc,
				idcs.prop_val_yr asc,
				idcs.sup_num asc,
				idcs.imprv_id asc,
				idcs.imprv_det_id asc,
				idcs.section_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				idcs.prop_id,
				convert(smallint, idcs.prop_val_yr),
				convert(smallint, idcs.sup_num),
				idcs.imprv_id,
				idcs.imprv_det_id,
				idcs.section_id,
				idcs.section_type,
				idcs.section_description,
				idcs.stories,
				idcs.perimeter_shape_flag,
				idcs.perimeter,
				idcs.shape,
				idcs.area,
				convert(smallint, idcs.effective_year_built),
				convert(int, idcs.dep_type),
				idcs.dep_pct,
				idcs.dep_typical_life,
				idcs.dep_physical,
				idcs.dep_functional,
				idcs.dep_physical_functional,
				idcs.dep_external,
				idcs.dep_additional_functional,
				idcs.basement_building_section_id,
				idcs.basement_fireproof_flag,
				idcs.dep_override
			from imprv_detail_cms_section as idcs with(nolock)
			where
				idcs.prop_val_yr = @lYear and
				idcs.sup_num = @lSupNum and
				idcs.sale_id = @lSaleID
			order by
				idcs.prop_id asc,
				idcs.prop_val_yr asc,
				idcs.sup_num asc,
				idcs.imprv_id asc,
				idcs.imprv_det_id asc,
				idcs.section_id asc
		end
		else
		begin
			select
				idcs.prop_id,
				convert(smallint, idcs.prop_val_yr),
				convert(smallint, idcs.sup_num),
				idcs.imprv_id,
				idcs.imprv_det_id,
				idcs.section_id,
				idcs.section_type,
				idcs.section_description,
				idcs.stories,
				idcs.perimeter_shape_flag,
				idcs.perimeter,
				idcs.shape,
				idcs.area,
				convert(smallint, idcs.effective_year_built),
				convert(int, idcs.dep_type),
				idcs.dep_pct,
				idcs.dep_typical_life,
				idcs.dep_physical,
				idcs.dep_functional,
				idcs.dep_physical_functional,
				idcs.dep_external,
				idcs.dep_additional_functional,
				idcs.basement_building_section_id,
				idcs.basement_fireproof_flag,
				idcs.dep_override
			from imprv_detail_cms_section as idcs with(nolock)
			where
				idcs.prop_id = @lPropID and
				idcs.prop_val_yr = @lYear and
				idcs.sup_num = @lSupNum and
				idcs.sale_id = @lSaleID
			order by
				idcs.prop_id asc,
				idcs.prop_val_yr asc,
				idcs.sup_num asc,
				idcs.imprv_id asc,
				idcs.imprv_det_id asc,
				idcs.section_id asc
		end
	end

	return( @@rowcount )

GO

