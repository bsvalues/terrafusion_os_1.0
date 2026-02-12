
create procedure RecalcRowUpdateRMSEstimate
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lPropID int,
	@lImprovID int,
	@lImprovDetID int,
	
	@TypicalLife int,
	@LocalMultiplier numeric(3,2),
	@ArchitectFee numeric(5,2),
	@ReportDate datetime,
	@SingleLineBackDate datetime,
	@BaseDate datetime,
	@EnergyAdj_ZoneItemID int,
	@FoundationAdj_ZoneItemID int,
	@HillsideAdj_ZoneItemID int,
	@SeismicAdj_ZoneItemID int,
	@WindAdj_ZoneItemID int,
	@StoryWallHeight smallint,
	@RegionalMultiplier numeric(3,2),
	@CostMultiplier numeric(3,2),
	@IndexMultiplier numeric(3,2),
	@TotalMultiplier numeric(3,2),
	@ExtWallFactor numeric(5,4),
	@BaseCostUnitPrice numeric(14,2),
	@ZoneAdj_Energy numeric(5,2),
	@ZoneAdj_Foundation numeric(5,2),
	@ZoneAdj_Hillside numeric(5,2),
	@ZoneAdj_Seismic numeric(5,2),
	@ZoneAdj_Wind numeric(5,2),
	@BaseLoss int,
	@PhysFunLoss int,
	@PhysLoss int,
	@FunctionalLoss int,
	@ExternalLoss int,
	@EstimateValueRCN int,
	@EstimateValueRCNLD int,
	@DeprPct numeric(5,2),
	@EstimateValueNonRoundedRCNLD int,
	@EstimateValueSingleLineBackDateRCNLD int
	
as

set nocount on

	update imprv_detail_rms_estimate with(rowlock)
	set
		TypicalLife = @TypicalLife,
		LocalMultiplier = @LocalMultiplier,
		ArchitectFee = @ArchitectFee,
		ReportDate = @ReportDate,
		SingleLineBackDate = @SingleLineBackDate,
		BaseDate = @BaseDate,
		EnergyAdj_ZoneItemID = @EnergyAdj_ZoneItemID,
		FoundationAdj_ZoneItemID = @FoundationAdj_ZoneItemID,
		HillsideAdj_ZoneItemID = @HillsideAdj_ZoneItemID,
		SeismicAdj_ZoneItemID = @SeismicAdj_ZoneItemID,
		WindAdj_ZoneItemID = @WindAdj_ZoneItemID,
		StoryWallHeight = @StoryWallHeight,
		RegionalMultiplier = @RegionalMultiplier,
		CostMultiplier = @CostMultiplier,
		IndexMultiplier = @IndexMultiplier,
		TotalMultiplier = @TotalMultiplier,
		ExtWallFactor = @ExtWallFactor,
		BaseCostUnitPrice = @BaseCostUnitPrice,
		ZoneAdj_Energy = @ZoneAdj_Energy,
		ZoneAdj_Foundation = @ZoneAdj_Foundation,
		ZoneAdj_Hillside = @ZoneAdj_Hillside,
		ZoneAdj_Seismic = @ZoneAdj_Seismic,
		ZoneAdj_Wind = @ZoneAdj_Wind,
		BaseLoss = @BaseLoss,
		PhysFunLoss = @PhysFunLoss,
		PhysLoss = @PhysLoss,
		FunctionalLoss = @FunctionalLoss,
		ExternalLoss = @ExternalLoss,
		EstimateValueRCN = @EstimateValueRCN,
		EstimateValueRCNLD = @EstimateValueRCNLD,
		DeprPct = @DeprPct,
		EstimateValueNonRoundedRCNLD = @EstimateValueNonRoundedRCNLD,
		EstimateValueSingleLineBackDateRCNLD = @EstimateValueSingleLineBackDateRCNLD
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		prop_id = @lPropID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetID

GO

