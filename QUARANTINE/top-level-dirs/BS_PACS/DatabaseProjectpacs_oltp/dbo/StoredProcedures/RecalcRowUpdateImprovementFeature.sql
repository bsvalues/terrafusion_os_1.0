
create procedure RecalcRowUpdateImprovementFeature
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,
	@lImprovAttrID int,
	@lImprovAttrValID int,

	@imprv_attr_val numeric(14,0)
as

set nocount on

	update imprv_attr
	set
		imprv_attr_val = @imprv_attr_val
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID and
		imprv_attr_id = @lImprovAttrID and
		i_attr_val_id = @lImprovAttrValID

GO

