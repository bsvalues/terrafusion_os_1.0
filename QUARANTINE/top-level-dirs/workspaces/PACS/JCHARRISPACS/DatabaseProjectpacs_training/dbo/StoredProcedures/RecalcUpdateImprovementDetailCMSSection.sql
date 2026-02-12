
create procedure RecalcUpdateImprovementDetailCMSSection
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail_cms_section
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update imprv_detail_cms_section
		set
			imprv_detail_cms_section.calculated_date = getdate(),
			imprv_detail_cms_section.dep_pct = tidcs.dep_pct,
			imprv_detail_cms_section.total_cost_new = tidcs.total_cost_new,
			imprv_detail_cms_section.depreciation_amount = tidcs.depreciation_amount,
			imprv_detail_cms_section.depreciated_cost = tidcs.depreciated_cost,
			imprv_detail_cms_section.base_cost_total_cost_new = tidcs.base_cost_total_cost_new,
			imprv_detail_cms_section.base_cost_calc_unit_cost = tidcs.base_cost_calc_unit_cost,
			imprv_detail_cms_section.base_cost_depreciation_amount = tidcs.base_cost_depreciation_amount,
			imprv_detail_cms_section.base_cost_depreciated_cost = tidcs.base_cost_depreciated_cost,
			imprv_detail_cms_section.calc_dep_physical_pct = tidcs.dep_physical,
			imprv_detail_cms_section.calc_dep_physical_amount = tidcs.dep_physical_amount,
			imprv_detail_cms_section.calc_dep_functional_pct = tidcs.dep_functional,
			imprv_detail_cms_section.calc_dep_functional_amount = tidcs.dep_functional_amount,
			imprv_detail_cms_section.calc_dep_combined_pct = tidcs.dep_physical_functional,
			imprv_detail_cms_section.calc_dep_combined_amount = tidcs.dep_physical_functional_amount,
			imprv_detail_cms_section.calc_dep_additional_functional_pct = tidcs.dep_additional_functional,
			imprv_detail_cms_section.calc_dep_additional_functional_amount = tidcs.dep_additional_functional_amount,
			imprv_detail_cms_section.calc_dep_external_pct = tidcs.dep_external,
			imprv_detail_cms_section.calc_dep_external_amount = tidcs.dep_external_amount,
			imprv_detail_cms_section.area = tidcs.area,
			imprv_detail_cms_section.basement_fireproof_total_cost_new = tidcs.basement_fireproof_total_cost_new,
			imprv_detail_cms_section.basement_fireproof_calc_unit_cost = tidcs.basement_fireproof_calc_unit_cost,
			imprv_detail_cms_section.basement_fireproof_depreciation_amount = tidcs.basement_fireproof_depreciation_amount,
			imprv_detail_cms_section.basement_fireproof_depreciated_cost = tidcs.basement_fireproof_depreciated_cost
		from imprv_detail_cms_section
		join #recalc_bcp_imprv_detail_cms_section as tidcs with(nolock) on
			imprv_detail_cms_section.prop_id = tidcs.prop_id and
			imprv_detail_cms_section.prop_val_yr = tidcs.prop_val_yr and
			imprv_detail_cms_section.sup_num = tidcs.sup_num and
			imprv_detail_cms_section.sale_id = tidcs.sale_id and
			imprv_detail_cms_section.imprv_id = tidcs.imprv_id and
			imprv_detail_cms_section.imprv_det_id = tidcs.imprv_det_id and
			imprv_detail_cms_section.section_id = tidcs.section_id and
			tidcs.lRecalcBCPRowID >= @lMinBCPRowID and tidcs.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

