
create procedure RecalcRowUpdateImprovementDetailCMSSection
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,
	@lSectionID int,

	@dep_pct numeric(5,2),
	@total_cost_new numeric(14,0),
	@depreciation_amount numeric(14,0),
	@depreciated_cost numeric(14,0),
	@base_cost_total_cost_new numeric(14,0),
	@base_cost_calc_unit_cost numeric(14,2),
	@base_cost_depreciation_amount numeric(14,0),
	@base_cost_depreciated_cost numeric(14,0),
	@physical_depreciation_pct numeric(5,2),
	@physical_depreciation_amount numeric(14,0),
	@functional_depreciation_pct numeric(5,2),
	@functional_depreciation_amount numeric(14,0),
	@combined_depreciation_pct numeric(5,2),
	@combined_depreciation_amount numeric(14,0),
	@additional_functional_pct numeric(5,2),
	@additional_functional_amount numeric(14,0),
	@external_depreciation_pct numeric(5,2),
	@external_depreciation_amount numeric(14,0),
	@area numeric(14,1),
	@basement_fireproof_total_cost_new numeric(14,0),
	@basement_fireproof_calc_unit_cost numeric(14,2),
	@basement_fireproof_depreciation_amount numeric(14,0),
	@basement_fireproof_depreciated_cost numeric(14,0)

as

set nocount on

	update imprv_detail_cms_section
	set
		dep_pct = @dep_pct,
		total_cost_new = @total_cost_new,
		depreciation_amount = @depreciation_amount,
		depreciated_cost = @depreciated_cost,
		calculated_date = getdate(),
		base_cost_total_cost_new = @base_cost_total_cost_new,
		base_cost_calc_unit_cost = @base_cost_calc_unit_cost,
		base_cost_depreciation_amount = @base_cost_depreciation_amount,
		base_cost_depreciated_cost = @base_cost_depreciated_cost,
		calc_dep_physical_pct = @physical_depreciation_pct,
		calc_dep_physical_amount = @physical_depreciation_amount,
		calc_dep_functional_pct = @functional_depreciation_pct,
		calc_dep_functional_amount = @functional_depreciation_amount,
		calc_dep_combined_pct = @combined_depreciation_pct,
		calc_dep_combined_amount = @combined_depreciation_amount,
		calc_dep_additional_functional_pct = @additional_functional_pct,
		calc_dep_additional_functional_amount = @additional_functional_amount,
		calc_dep_external_pct = @external_depreciation_pct,
		calc_dep_external_amount = @external_depreciation_amount,
		area = @area,
		basement_fireproof_total_cost_new = @basement_fireproof_total_cost_new,
		basement_fireproof_calc_unit_cost = @basement_fireproof_calc_unit_cost,
		basement_fireproof_depreciation_amount = @basement_fireproof_depreciation_amount,
		basement_fireproof_depreciated_cost = @basement_fireproof_depreciated_cost

	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID and
		section_id = @lSectionID

GO

