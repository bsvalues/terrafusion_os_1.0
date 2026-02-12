
create procedure RecalcUpdateIncomePropAssoc
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_income_prop_assoc
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
		update income_prop_assoc
		set
			income_prop_assoc.income_value = tipa.income_value
		from income_prop_assoc
		join #recalc_bcp_income_prop_assoc as tipa with(nolock) on
			income_prop_assoc.prop_id = tipa.prop_id and
			income_prop_assoc.prop_val_yr = tipa.prop_val_yr and
			income_prop_assoc.sup_num = tipa.sup_num and
			income_prop_assoc.income_id = tipa.income_id and
			tipa.lRecalcBCPRowID >= @lMinBCPRowID and tipa.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

