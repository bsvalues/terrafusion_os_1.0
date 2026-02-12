
create procedure RecalcRowUpdateImprovementDetailCMSEstimate
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,

	@report_date datetime,
	@total_cost_new numeric(14,0),
	@total_cost_unit_price numeric(14,2),
	@total_depreciation_amount numeric(14,0),
	@total_depreciated_cost numeric(14,0),
	@total_depreciation_pct numeric(5,2),
	@total_area numeric(14,1)

as

set nocount on

	update imprv_detail_cms_estimate
	set
		report_date = @report_date,
		calculated_date = getdate(),
		total_cost_new = @total_cost_new,
		total_cost_unit_price = @total_cost_unit_price,
		total_depreciation_amount = @total_depreciation_amount,
		total_depreciated_cost = @total_depreciated_cost,
		dep_pct = @total_depreciation_pct,
		total_area = @total_area

	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID

GO

