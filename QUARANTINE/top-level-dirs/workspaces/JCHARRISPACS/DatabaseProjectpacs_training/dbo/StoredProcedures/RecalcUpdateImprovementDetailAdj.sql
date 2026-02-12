
create procedure RecalcUpdateImprovementDetailAdj
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_det_adj
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
		update imprv_det_adj
		set
			imprv_det_adj.imprv_det_adj_amt = tida.imprv_det_adj_amt
		from imprv_det_adj
		join #recalc_bcp_imprv_det_adj as tida with(nolock) on
			imprv_det_adj.prop_id = tida.prop_id and
			imprv_det_adj.prop_val_yr = tida.prop_val_yr and
			imprv_det_adj.sup_num = tida.sup_num and
			imprv_det_adj.sale_id = tida.sale_id and
			imprv_det_adj.imprv_id = tida.imprv_id and
			imprv_det_adj.imprv_det_id = tida.imprv_det_id and
			imprv_det_adj.imprv_det_adj_seq = tida.imprv_det_adj_seq and
			tida.lRecalcBCPRowID >= @lMinBCPRowID and tida.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

