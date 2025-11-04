
create procedure RecalcUpdateImprovementDetailCMSEstimate
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail_cms_estimate
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
		update imprv_detail_cms_estimate
		set
			imprv_detail_cms_estimate.report_date = tidce.report_date,
			imprv_detail_cms_estimate.calculated_date = getdate(),
			imprv_detail_cms_estimate.total_cost_new = tidce.total_cost_new,
			imprv_detail_cms_estimate.total_cost_unit_price = tidce.total_cost_unit_price,
			imprv_detail_cms_estimate.total_depreciation_amount = tidce.total_depreciation_amount,
			imprv_detail_cms_estimate.total_depreciated_cost = tidce.total_depreciated_cost,
			imprv_detail_cms_estimate.dep_pct = tidce.dep_pct,
			imprv_detail_cms_estimate.total_area = tidce.total_area
		from imprv_detail_cms_estimate
		join #recalc_bcp_imprv_detail_cms_estimate as tidce with(nolock) on
			imprv_detail_cms_estimate.prop_id = tidce.prop_id and
			imprv_detail_cms_estimate.prop_val_yr = tidce.prop_val_yr and
			imprv_detail_cms_estimate.sup_num = tidce.sup_num and
			imprv_detail_cms_estimate.sale_id = tidce.sale_id and
			imprv_detail_cms_estimate.imprv_id = tidce.imprv_id and
			imprv_detail_cms_estimate.imprv_det_id = tidce.imprv_det_id and
			tidce.lRecalcBCPRowID >= @lMinBCPRowID and tidce.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

