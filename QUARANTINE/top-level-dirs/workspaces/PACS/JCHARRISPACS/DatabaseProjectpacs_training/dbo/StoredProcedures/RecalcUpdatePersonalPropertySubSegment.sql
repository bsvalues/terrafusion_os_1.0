
create procedure RecalcUpdatePersonalPropertySubSegment
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_pers_prop_sub_seg
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
		update pers_prop_sub_seg
		set
			pers_prop_sub_seg.pp_mkt_val = tppss.pp_mkt_val,
			pers_prop_sub_seg.pp_rendered_val = tppss.pp_rendered_val,
			pers_prop_sub_seg.pp_dep_pct = tppss.pp_dep_pct
		from pers_prop_sub_seg
		join #recalc_bcp_pers_prop_sub_seg as tppss with(nolock) on
			pers_prop_sub_seg.prop_id = tppss.prop_id and
			pers_prop_sub_seg.prop_val_yr = tppss.prop_val_yr and
			pers_prop_sub_seg.sup_num = tppss.sup_num and
			pers_prop_sub_seg.pp_seg_id = tppss.pp_seg_id and
			pers_prop_sub_seg.pp_sub_seg_id = tppss.pp_sub_seg_id and
			tppss.lRecalcBCPRowID >= @lMinBCPRowID and tppss.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

