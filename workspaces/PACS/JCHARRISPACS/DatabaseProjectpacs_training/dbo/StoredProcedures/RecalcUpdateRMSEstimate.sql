
create procedure RecalcUpdateRMSEstimate
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail_rms_estimate
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update rms
		set
			rms.TypicalLife = trms.TypicalLife,
			rms.LocalMultiplier = trms.LocalMultiplier,
			rms.ArchitectFee = trms.ArchitectFee,
			rms.ReportDate = trms.ReportDate,
			rms.SingleLineBackDate = trms.SingleLineBackDate,
			rms.BaseDate = trms.BaseDate,
			rms.EnergyAdj_ZoneItemID = trms.EnergyAdj_ZoneItemID,
			rms.FoundationAdj_ZoneItemID = trms.FoundationAdj_ZoneItemID,
			rms.HillsideAdj_ZoneItemID = trms.HillsideAdj_ZoneItemID,
			rms.SeismicAdj_ZoneItemID = trms.SeismicAdj_ZoneItemID,
			rms.WindAdj_ZoneItemID = trms.WindAdj_ZoneItemID,
			rms.StoryWallHeight = trms.StoryWallHeight,
			rms.RegionalMultiplier = trms.RegionalMultiplier,
			rms.CostMultiplier = trms.CostMultiplier,
			rms.IndexMultiplier = trms.IndexMultiplier,
			rms.TotalMultiplier = trms.TotalMultiplier,
			rms.ExtWallFactor = trms.ExtWallFactor,
			rms.BaseCostUnitPrice = trms.BaseCostUnitPrice,
			rms.ZoneAdj_Energy = trms.ZoneAdj_Energy,
			rms.ZoneAdj_Foundation = trms.ZoneAdj_Foundation,
			rms.ZoneAdj_Hillside = trms.ZoneAdj_Hillside,
			rms.ZoneAdj_Seismic = trms.ZoneAdj_Seismic,
			rms.ZoneAdj_Wind = trms.ZoneAdj_Wind,
			rms.BaseLoss = trms.BaseLoss,
			rms.PhysFunLoss = trms.PhysFunLoss,
			rms.PhysLoss = trms.PhysLoss,
			rms.FunctionalLoss = trms.FunctionalLoss,
			rms.ExternalLoss = trms.ExternalLoss,
			rms.EstimateValueRCN = trms.EstimateValueRCN,
			rms.EstimateValueRCNLD = trms.EstimateValueRCNLD,
			rms.DeprPct = trms.DeprPct,
			rms.EstimateValueNonRoundedRCNLD = trms.EstimateValueNonRoundedRCNLD,
			rms.EstimateValueSingleLineBackDateRCNLD = trms.EstimateValueSingleLineBackDateRCNLD
		from imprv_detail_rms_estimate as rms
		join #recalc_bcp_imprv_detail_rms_estimate as trms with(nolock) on
			rms.prop_val_yr = trms.prop_val_yr and
			rms.sup_num = trms.sup_num and
			rms.sale_id = trms.sale_id and
			rms.prop_id = trms.prop_id and
			rms.imprv_id = trms.imprv_id and
			rms.imprv_det_id = trms.imprv_det_id and
			trms.lRecalcBCPRowID >= @lMinBCPRowID and trms.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

