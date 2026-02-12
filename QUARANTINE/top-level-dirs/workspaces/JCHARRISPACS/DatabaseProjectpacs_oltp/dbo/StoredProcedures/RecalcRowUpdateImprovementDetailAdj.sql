
create procedure RecalcRowUpdateImprovementDetailAdj
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,
	@lImprovDetailAdjSeq int,

	@imprv_det_adj_amt numeric(14,0)
as

set nocount on

	update imprv_det_adj with(rowlock)
	set
		imprv_det_adj_amt = @imprv_det_adj_amt
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID and
		imprv_det_adj_seq = @lImprovDetailAdjSeq

GO

