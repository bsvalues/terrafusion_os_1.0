
create procedure RecalcRowUpdateImprovementDetailCMSComponent
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,
	@lSectionID int,
	@lComponentID int,

	@total_cost_new numeric(14,0),
	@calc_unit_cost numeric(14,2),
	@depreciation_amount numeric(14,0),
	@depreciated_cost numeric(14,0)

as

set nocount on

	update imprv_detail_cms_component
	set
		total_cost_new = @total_cost_new,
		calc_unit_cost = @calc_unit_cost,
		depreciation_amount = @depreciation_amount,
		depreciated_cost = @depreciated_cost

	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID and
		section_id = @lSectionID and
		component_id = @lComponentID

GO

