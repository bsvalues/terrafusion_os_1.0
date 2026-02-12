
create procedure RecalcUpdateImprovementDetailCMSAddition
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail_cms_addition
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
		update imprv_detail_cms_addition
		set
			imprv_detail_cms_addition.total_cost_new = tidca.total_cost_new,
			imprv_detail_cms_addition.calc_unit_cost = tidca.calc_unit_cost,
			imprv_detail_cms_addition.depreciation_amount = tidca.depreciation_amount,
			imprv_detail_cms_addition.depreciated_cost = tidca.depreciated_cost,
			imprv_detail_cms_addition.base_date = tidca.base_date
		from imprv_detail_cms_addition
		join #recalc_bcp_imprv_detail_cms_addition as tidca with(nolock) on
			imprv_detail_cms_addition.prop_id = tidca.prop_id and
			imprv_detail_cms_addition.prop_val_yr = tidca.prop_val_yr and
			imprv_detail_cms_addition.sup_num = tidca.sup_num and
			imprv_detail_cms_addition.sale_id = tidca.sale_id and
			imprv_detail_cms_addition.imprv_id = tidca.imprv_id and
			imprv_detail_cms_addition.imprv_det_id = tidca.imprv_det_id and
			imprv_detail_cms_addition.section_id = tidca.section_id and
			imprv_detail_cms_addition.addition_id = tidca.addition_id and
			tidca.lRecalcBCPRowID >= @lMinBCPRowID and tidca.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

