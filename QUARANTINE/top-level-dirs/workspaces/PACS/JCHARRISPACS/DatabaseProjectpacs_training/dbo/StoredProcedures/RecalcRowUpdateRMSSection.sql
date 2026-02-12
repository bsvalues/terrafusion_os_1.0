
create procedure RecalcRowUpdateRMSSection
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lPropID int,
	@lImprovID int,
	@lImprovDetID int,
	@section_id int,
	
	@QualityID numeric(3,2),
	@DeprPct numeric(5,2),
	@EffectiveYearBuilt int,
	@TypicalLife int,
	@SectionValueRCN int,
	@SectionValueRCNLD int
as

set nocount on

	update imprv_detail_rms_section with(rowlock)
	set
		QualityID = @QualityID,
		DeprPct = @DeprPct,
		EffectiveYearBuilt = @EffectiveYearBuilt,
		TypicalLife = @TypicalLife,
		SectionValueRCN = @SectionValueRCN,
		SectionValueRCNLD = @SectionValueRCNLD
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		prop_id = @lPropID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetID and
		section_id = @section_id

GO

