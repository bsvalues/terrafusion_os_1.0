
create procedure RecalcUpdateImprovementDetailCMSComponent
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail_cms_component
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
		update imprv_detail_cms_component
		set
			imprv_detail_cms_component.total_cost_new = tidcc.total_cost_new,
			imprv_detail_cms_component.calc_unit_cost = tidcc.calc_unit_cost,
			imprv_detail_cms_component.depreciation_amount = tidcc.depreciation_amount,
			imprv_detail_cms_component.depreciated_cost = tidcc.depreciated_cost
		from imprv_detail_cms_component
		join #recalc_bcp_imprv_detail_cms_component as tidcc with(nolock) on
			imprv_detail_cms_component.prop_id = tidcc.prop_id and
			imprv_detail_cms_component.prop_val_yr = tidcc.prop_val_yr and
			imprv_detail_cms_component.sup_num = tidcc.sup_num and
			imprv_detail_cms_component.sale_id = tidcc.sale_id and
			imprv_detail_cms_component.imprv_id = tidcc.imprv_id and
			imprv_detail_cms_component.imprv_det_id = tidcc.imprv_det_id and
			imprv_detail_cms_component.section_id = tidcc.section_id and
			imprv_detail_cms_component.component_id = tidcc.component_id and
			tidcc.lRecalcBCPRowID >= @lMinBCPRowID and tidcc.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

