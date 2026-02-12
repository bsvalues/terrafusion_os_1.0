
create procedure RecalcUpdateImprovementFeature
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_attr
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
		update imprv_attr
		set
			imprv_attr.imprv_attr_val = tia.imprv_attr_val
		from imprv_attr
		join #recalc_bcp_imprv_attr as tia with(nolock) on
			imprv_attr.prop_id = tia.prop_id and
			imprv_attr.prop_val_yr = tia.prop_val_yr and
			imprv_attr.sup_num = tia.sup_num and
			imprv_attr.sale_id = tia.sale_id and
			imprv_attr.imprv_id = tia.imprv_id and
			imprv_attr.imprv_det_id = tia.imprv_det_id and
			imprv_attr.imprv_attr_id = tia.imprv_attr_id and
			imprv_attr.i_attr_val_id = tia.i_attr_val_id and
			tia.lRecalcBCPRowID >= @lMinBCPRowID and tia.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

