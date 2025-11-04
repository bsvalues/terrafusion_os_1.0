
create procedure RecalcUpdateExemptionAssocLand
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_land_exemption_assoc
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
		update land_exemption_assoc
		set
			land_exemption_assoc.calc_amount = tea.calc_amount
		from land_exemption_assoc
		join #recalc_bcp_land_exemption_assoc as tea with(nolock) on
			land_exemption_assoc.prop_id = tea.prop_id and
			land_exemption_assoc.prop_val_yr = tea.prop_val_yr and
			land_exemption_assoc.sup_num = tea.sup_num and
			land_exemption_assoc.sale_id = tea.sale_id and
			land_exemption_assoc.land_seg_id = tea.land_seg_id and
			land_exemption_assoc.owner_id = tea.owner_id and
			land_exemption_assoc.entity_id = tea.entity_id and
			land_exemption_assoc.exmpt_type_cd = tea.exmpt_type_cd and
			tea.lRecalcBCPRowID >= @lMinBCPRowID and tea.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

