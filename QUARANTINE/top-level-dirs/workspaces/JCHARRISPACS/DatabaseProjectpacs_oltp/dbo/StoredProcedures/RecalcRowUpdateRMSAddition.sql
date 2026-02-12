
create procedure RecalcRowUpdateRMSAddition
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lPropID int,
	@lImprovID int,
	@lImprovDetID int,
	@pacs_addition_id int,
	
	@DeprPct numeric(5,2),
	@EffectiveYearBuilt int,
	@TypicalLife int,
	@BaseDate datetime,
	@AdditionValueRCN int,
	@AdditionValueRCNLD int
as

set nocount on

	update imprv_detail_rms_addition with(rowlock)
	set
		DeprPct = @DeprPct,
		EffectiveYearBuilt = @EffectiveYearBuilt,
		TypicalLife = @TypicalLife,
		BaseDate = @BaseDate,
		AdditionValueRCN = @AdditionValueRCN,
		AdditionValueRCNLD = @AdditionValueRCNLD
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		prop_id = @lPropID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetID and
		pacs_addition_id = @pacs_addition_id

GO

