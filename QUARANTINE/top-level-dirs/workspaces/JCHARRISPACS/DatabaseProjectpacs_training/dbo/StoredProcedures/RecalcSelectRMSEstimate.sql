
create procedure RecalcSelectRMSEstimate
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
			rms.ZipCode,
			rms.ConstTypeID,
			rms.TypeID,
			rms.StyleIDPrimary,
			rms.StylePctPrimary,
			rms.StyleIDSecondary,
			rms.TotalArea,
			rms.Units,
			rms.QualityID,
			rms.ConditionID,
			rms.DepreciationID,
			rms.EffectiveYearBuilt,
			rms.PhysFunPct,
			rms.PhysFunAmt,
			rms.PhysicalPct,
			rms.PhysicalAmt,
			rms.FunctionalPct,
			rms.FunctionalAmt,
			rms.ExternalPct,
			rms.ExternalAmt,
			rms.ApplyPctToRCN,
			rms.RoundingValue,
			rms.TypicalLife,
			rms.LocalMultiplier,
			rms.LocalMultiplierOverride,
			rms.LocalMultiplierAdj,
			rms.ArchitectFee,
			rms.ArchitectFeeOverride,
			rms.ReportDate,
			rms.ReportDateOverride,
			rms.SingleLineBackDate,
			rms.SingleLineBackDateOverride,
			rms.BaseDate,
			rms.BaseDateOverride,
			rms.EffectiveAgeAdj,
			rms.DepreciationPctAdj,
			rms.EnergyAdj_ZoneItemID,
			rms.EnergyAdj_ZoneItemIDOverride,
			rms.FoundationAdj_ZoneItemID,
			rms.FoundationAdj_ZoneItemIDOverride,
			rms.HillsideAdj_ZoneItemID,
			rms.HillsideAdj_ZoneItemIDOverride,
			rms.SeismicAdj_ZoneItemID,
			rms.SeismicAdj_ZoneItemIDOverride,
			rms.WindAdj_ZoneItemID,
			rms.WindAdj_ZoneItemIDOverride,
			rms.StoryWallHeight,
			rms.StoryWallHeightOverride
		from #recalc_prop_list as rpl with(nolock)		
		join imprv_detail_rms_estimate as rms with(nolock) on
			rpl.prop_id = rms.prop_id and
			rpl.sup_yr = rms.prop_val_yr and
			rpl.sup_num = rms.sup_num and
			rms.sale_id = @lSaleID
		order by
			rms.prop_id,
			rms.prop_val_yr,
			rms.sup_num,
			rms.imprv_id,
			rms.imprv_det_id
	end
	else if ( @lPropID = 0 )
	begin
		select
			convert(smallint, rms.prop_val_yr),
			convert(smallint, rms.sup_num),
			rms.prop_id,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.ZipCode,
			rms.ConstTypeID,
			rms.TypeID,
			rms.StyleIDPrimary,
			rms.StylePctPrimary,
			rms.StyleIDSecondary,
			rms.TotalArea,
			rms.Units,
			rms.QualityID,
			rms.ConditionID,
			rms.DepreciationID,
			rms.EffectiveYearBuilt,
			rms.PhysFunPct,
			rms.PhysFunAmt,
			rms.PhysicalPct,
			rms.PhysicalAmt,
			rms.FunctionalPct,
			rms.FunctionalAmt,
			rms.ExternalPct,
			rms.ExternalAmt,
			rms.ApplyPctToRCN,
			rms.RoundingValue,
			rms.TypicalLife,
			rms.LocalMultiplier,
			rms.LocalMultiplierOverride,
			rms.LocalMultiplierAdj,
			rms.ArchitectFee,
			rms.ArchitectFeeOverride,
			rms.ReportDate,
			rms.ReportDateOverride,
			rms.SingleLineBackDate,
			rms.SingleLineBackDateOverride,
			rms.BaseDate,
			rms.BaseDateOverride,
			rms.EffectiveAgeAdj,
			rms.DepreciationPctAdj,
			rms.EnergyAdj_ZoneItemID,
			rms.EnergyAdj_ZoneItemIDOverride,
			rms.FoundationAdj_ZoneItemID,
			rms.FoundationAdj_ZoneItemIDOverride,
			rms.HillsideAdj_ZoneItemID,
			rms.HillsideAdj_ZoneItemIDOverride,
			rms.SeismicAdj_ZoneItemID,
			rms.SeismicAdj_ZoneItemIDOverride,
			rms.WindAdj_ZoneItemID,
			rms.WindAdj_ZoneItemIDOverride,
			rms.StoryWallHeight,
			rms.StoryWallHeightOverride
		from imprv_detail_rms_estimate as rms with(nolock)
		where
			rms.prop_val_yr = @lYear and
			rms.sup_num = @lSupNum and
			rms.sale_id = @lSaleID
		order by
			rms.prop_id,
			rms.prop_val_yr,
			rms.sup_num,
			rms.imprv_id,
			rms.imprv_det_id
	end
	else
	begin
		select
			convert(smallint, rms.prop_val_yr),
			convert(smallint, rms.sup_num),
			rms.prop_id,
			rms.imprv_id,
			rms.imprv_det_id,
			rms.ZipCode,
			rms.ConstTypeID,
			rms.TypeID,
			rms.StyleIDPrimary,
			rms.StylePctPrimary,
			rms.StyleIDSecondary,
			rms.TotalArea,
			rms.Units,
			rms.QualityID,
			rms.ConditionID,
			rms.DepreciationID,
			rms.EffectiveYearBuilt,
			rms.PhysFunPct,
			rms.PhysFunAmt,
			rms.PhysicalPct,
			rms.PhysicalAmt,
			rms.FunctionalPct,
			rms.FunctionalAmt,
			rms.ExternalPct,
			rms.ExternalAmt,
			rms.ApplyPctToRCN,
			rms.RoundingValue,
			rms.TypicalLife,
			rms.LocalMultiplier,
			rms.LocalMultiplierOverride,
			rms.LocalMultiplierAdj,
			rms.ArchitectFee,
			rms.ArchitectFeeOverride,
			rms.ReportDate,
			rms.ReportDateOverride,
			rms.SingleLineBackDate,
			rms.SingleLineBackDateOverride,
			rms.BaseDate,
			rms.BaseDateOverride,
			rms.EffectiveAgeAdj,
			rms.DepreciationPctAdj,
			rms.EnergyAdj_ZoneItemID,
			rms.EnergyAdj_ZoneItemIDOverride,
			rms.FoundationAdj_ZoneItemID,
			rms.FoundationAdj_ZoneItemIDOverride,
			rms.HillsideAdj_ZoneItemID,
			rms.HillsideAdj_ZoneItemIDOverride,
			rms.SeismicAdj_ZoneItemID,
			rms.SeismicAdj_ZoneItemIDOverride,
			rms.WindAdj_ZoneItemID,
			rms.WindAdj_ZoneItemIDOverride,
			rms.StoryWallHeight,
			rms.StoryWallHeightOverride
		from imprv_detail_rms_estimate as rms with(nolock)
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
			rms.imprv_det_id
	end

	return( @@rowcount )

GO

