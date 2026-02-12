
create procedure RecalcSelectRMSComponent
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int
as

	if ( @lPacsUserID != 0 )
	begin
		select
			convert(smallint, rms.prop_val_yr),
			convert(smallint, rms.sup_num),
			rms.prop_id,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.section_id,
			rms.pacs_component_id,
			rms.ComponentID,
			rms.Units,
			rms.ComponentPct,
			rms.QualityID,
			rms.QualityOverride,
			rms.DeprPct,
			rms.DeprOverride,
			rms.EffectiveYearBuilt,
			rms.EffectiveYearBuiltOverride,
			rms.TypicalLife,
			rms.TypicalLifeOverride
		from #recalc_prop_list as rpl with(nolock)		
		join imprv_detail_rms_component as rms with(nolock) on
			rpl.prop_id = rms.prop_id and
			rpl.sup_yr = rms.prop_val_yr and
			rpl.sup_num = rms.sup_num and
			rms.sale_id = @lSaleID
		order by
			rms.prop_id,
			rms.prop_val_yr,
			rms.sup_num,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.section_id,
			rms.pacs_component_id
	end
	else if ( @lPropID = 0 )
	begin
		select
			convert(smallint, rms.prop_val_yr),
			convert(smallint, rms.sup_num),
			rms.prop_id,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.section_id,
			rms.pacs_component_id,
			rms.ComponentID,
			rms.Units,
			rms.ComponentPct,
			rms.QualityID,
			rms.QualityOverride,
			rms.DeprPct,
			rms.DeprOverride,
			rms.EffectiveYearBuilt,
			rms.EffectiveYearBuiltOverride,
			rms.TypicalLife,
			rms.TypicalLifeOverride
		from imprv_detail_rms_component as rms with(nolock)
		where
			rms.prop_val_yr = @lYear and
			rms.sup_num = @lSupNum and
			rms.sale_id = @lSaleID
		order by
			rms.prop_id,
			rms.prop_val_yr,
			rms.sup_num,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.section_id,
			rms.pacs_component_id
	end
	else
	begin
		select
			convert(smallint, rms.prop_val_yr),
			convert(smallint, rms.sup_num),
			rms.prop_id,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.section_id,
			rms.pacs_component_id,
			rms.ComponentID,
			rms.Units,
			rms.ComponentPct,
			rms.QualityID,
			rms.QualityOverride,
			rms.DeprPct,
			rms.DeprOverride,
			rms.EffectiveYearBuilt,
			rms.EffectiveYearBuiltOverride,
			rms.TypicalLife,
			rms.TypicalLifeOverride
		from imprv_detail_rms_component as rms with(nolock)
		where
			rms.prop_val_yr = @lYear and
			rms.sup_num = @lSupNum and
			rms.sale_id = @lSaleID and
			rms.prop_id = @lPropID
		order by
			rms.prop_id,
			rms.prop_val_yr,
			rms.sup_num,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.section_id,
			rms.pacs_component_id
	end

	return( @@rowcount )

GO

