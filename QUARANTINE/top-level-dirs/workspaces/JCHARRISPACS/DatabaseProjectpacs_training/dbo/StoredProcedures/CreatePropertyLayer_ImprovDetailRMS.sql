create procedure CreatePropertyLayer_ImprovDetailRMS
	@lInputFromYear numeric(4,0),
	@lCopyToYear numeric(4,0),
	@CalledBy varchar(50) 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
declare @proc varchar(500)
set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
       + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy

exec dbo.CurrentActivityLogInsert @proc, @qry

-- set variable for final status entry
set @qry = Replace(@qry,'Start','End') 
/* End top of each procedure to capture parameters */

-- Estimates
insert imprv_detail_rms_estimate with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	ZipCode,
	ConstTypeID,
	TypeID,
	StyleIDPrimary,
	StylePctPrimary,
	StyleIDSecondary,
	TotalArea,
	Units,
	QualityID,
	ConditionID,
	DepreciationID,
	EffectiveYearBuilt,
	PhysFunPct,
	PhysFunAmt,
	PhysicalPct,
	PhysicalAmt,
	FunctionalPct,
	FunctionalAmt,
	ExternalPct,
	ExternalAmt,
	ApplyPctToRCN,
	RoundingValue,
	TypicalLife,
	LocalMultiplier,
	LocalMultiplierOverride,
	LocalMultiplierAdj,
	ArchitectFee,
	ArchitectFeeOverride,
	ReportDate,
	ReportDateOverride,
	SingleLineBackDate,
	SingleLineBackDateOverride,
	BaseDate,
	BaseDateOverride,
	EffectiveAgeAdj,
	DepreciationPctAdj,
	EnergyAdj_ZoneItemID,
	EnergyAdj_ZoneItemIDOverride,
	FoundationAdj_ZoneItemID,
	FoundationAdj_ZoneItemIDOverride,
	HillsideAdj_ZoneItemID,
	HillsideAdj_ZoneItemIDOverride,
	SeismicAdj_ZoneItemID,
	SeismicAdj_ZoneItemIDOverride,
	WindAdj_ZoneItemID,
	WindAdj_ZoneItemIDOverride,
	StoryWallHeight,
	StoryWallHeightOverride,
	RegionalMultiplier,
	CostMultiplier,
	IndexMultiplier,
	TotalMultiplier,
	ExtWallFactor,
	BaseCostUnitPrice,
	ZoneAdj_Energy,
	ZoneAdj_Foundation,
	ZoneAdj_Hillside,
	ZoneAdj_Seismic,
	ZoneAdj_Wind,
	BaseLoss,
	PhysFunLoss,
	PhysLoss,
	FunctionalLoss,
	ExternalLoss,
	EstimateValueRCN,
	EstimateValueRCNLD,
	DeprPct,
	EstimateValueNonRoundedRCNLD,
	EstimateValueSingleLineBackDateRCNLD
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
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
	rms.StoryWallHeightOverride,
	rms.RegionalMultiplier,
	rms.CostMultiplier,
	rms.IndexMultiplier,
	rms.TotalMultiplier,
	rms.ExtWallFactor,
	rms.BaseCostUnitPrice,
	rms.ZoneAdj_Energy,
	rms.ZoneAdj_Foundation,
	rms.ZoneAdj_Hillside,
	rms.ZoneAdj_Seismic,
	rms.ZoneAdj_Wind,
	rms.BaseLoss,
	rms.PhysFunLoss,
	rms.PhysLoss,
	rms.FunctionalLoss,
	rms.ExternalLoss,
	rms.EstimateValueRCN,
	rms.EstimateValueRCNLD,
	rms.DeprPct,
	rms.EstimateValueNonRoundedRCNLD,
	EstimateValueSingleLineBackDateRCNLD
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_rms_estimate as rms with(tablockx) on
	rms.prop_val_yr = cplpl.prop_val_yr and
	rms.sup_num = cplpl.sup_num and
	rms.sale_id = 0 and
	rms.prop_id = cplpl.prop_id
 
 -- Sections
insert imprv_detail_rms_section with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	section_id,
	GroupTypeID,
	SectionSize,
	QualityID,
	QualityOverride,
	DeprPct,
	DeprOverride,
	EffectiveYearBuilt,
	EffectiveYearBuiltOverride,
	TypicalLife,
	TypicalLifeOverride,
	SectionValueRCN,
	SectionValueRCNLD
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	rms.prop_id,
	rms.imprv_id,
	rms.imprv_det_id,
	rms.section_id,
	rms.GroupTypeID,
	rms.SectionSize,
	rms.QualityID,
	rms.QualityOverride,
	rms.DeprPct,
	rms.DeprOverride,
	rms.EffectiveYearBuilt,
	rms.EffectiveYearBuiltOverride,
	rms.TypicalLife,
	rms.TypicalLifeOverride,
	rms.SectionValueRCN,
	rms.SectionValueRCNLD
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_rms_section as rms with(tablockx) on
	rms.prop_val_yr = cplpl.prop_val_yr and
	rms.sup_num = cplpl.sup_num and
	rms.sale_id = 0 and
	rms.prop_id = cplpl.prop_id

-- Components
insert imprv_detail_rms_component with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	section_id,
	pacs_component_id,
	ComponentID,
	Units,
	ComponentPct,
	QualityID,
	QualityOverride,
	DeprPct,
	DeprOverride,
	EffectiveYearBuilt,
	EffectiveYearBuiltOverride,
	TypicalLife,
	TypicalLifeOverride,
	UnitPrice,
	AdjUnitPrice,
	ComponentValueRCN,
	ComponentValueRCNLD
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
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
	rms.TypicalLifeOverride,
	rms.UnitPrice,
	rms.AdjUnitPrice,
	rms.ComponentValueRCN,
	rms.ComponentValueRCNLD
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_rms_component as rms with(tablockx) on
	rms.prop_val_yr = cplpl.prop_val_yr and
	rms.sup_num = cplpl.sup_num and
	rms.sale_id = 0 and
	rms.prop_id = cplpl.prop_id

-- Additions
insert imprv_detail_rms_addition with(tablockx)
(
	prop_val_yr,
	sup_num,
	sale_id,
	prop_id,
	imprv_id,
	imprv_det_id,
	pacs_addition_id,
	AdditionTypeID,
	AdditionDesc,
	Units,
	CostValue,
	UseLocalMultiplier,
	ApplyTrend,
	DeprPct,
	DeprOverride,
	EffectiveYearBuilt,
	EffectiveYearBuiltOverride,
	TypicalLife,
	TypicalLifeOverride,
	BaseDate,
	AdditionValueRCN,
	AdditionValueRCNLD
)
select
	@lCopyToYear, --prop_val_yr
	0, --sup_num
	0, --sale_id
	rms.prop_id,
	rms.imprv_id,
	rms.imprv_det_id,
	rms.pacs_addition_id,
	rms.AdditionTypeID,
	rms.AdditionDesc,
	rms.Units,
	rms.CostValue,
	rms.UseLocalMultiplier,
	rms.ApplyTrend,
	rms.DeprPct,
	rms.DeprOverride,
	rms.EffectiveYearBuilt,
	rms.EffectiveYearBuiltOverride,
	rms.TypicalLife,
	rms.TypicalLifeOverride,
	rms.BaseDate,
	rms.AdditionValueRCN,
	rms.AdditionValueRCNLD
from create_property_layer_prop_list as cplpl with(tablockx)
join imprv_detail_rms_addition as rms with(tablockx) on
	rms.prop_val_yr = cplpl.prop_val_yr and
	rms.sup_num = cplpl.sup_num and
	rms.sale_id = 0 and
	rms.prop_id = cplpl.prop_id

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry, @@ROWCOUNT, @@ERROR

GO

