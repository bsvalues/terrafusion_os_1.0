
create procedure RecalcUpdatePersonalPropertySegmentScheduleAssoc
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_pp_seg_sched_assoc
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
		update pp_seg_sched_assoc
		set
			pp_seg_sched_assoc.unit_price = tppssa.unit_price
		from pp_seg_sched_assoc
		join #recalc_bcp_pp_seg_sched_assoc as tppssa with(nolock) on
			pp_seg_sched_assoc.prop_id = tppssa.prop_id and
			pp_seg_sched_assoc.prop_val_yr = tppssa.prop_val_yr and
			pp_seg_sched_assoc.sup_num = tppssa.sup_num and
			pp_seg_sched_assoc.pp_seg_id = tppssa.pp_seg_id and
			pp_seg_sched_assoc.pp_sched_id = tppssa.pp_sched_id and
			tppssa.lRecalcBCPRowID >= @lMinBCPRowID and tppssa.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

