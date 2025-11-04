
create procedure RecalcRowUpdateImprovementDetailCMSAddition
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,
	@lSectionID int,
	@lAdditionID int,

	@total_cost_new numeric(14,0),
	@calc_unit_cost numeric(14,2),
	@depreciation_amount numeric(14,0),
	@depreciated_cost numeric(14,0),
	@base_date datetime

as

set nocount on

	update imprv_detail_cms_addition
	set
		total_cost_new = @total_cost_new,
		calc_unit_cost = @calc_unit_cost,
		depreciation_amount = @depreciation_amount,
		depreciated_cost = @depreciated_cost,
		base_date = @base_date

	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID and
		section_id = @lSectionID and
		addition_id = @lAdditionID

GO

