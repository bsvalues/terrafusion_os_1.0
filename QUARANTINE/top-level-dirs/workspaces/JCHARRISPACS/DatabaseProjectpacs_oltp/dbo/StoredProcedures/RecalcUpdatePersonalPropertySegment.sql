
create procedure RecalcUpdatePersonalPropertySegment
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_pers_prop_seg
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
		update pers_prop_seg
		set
			pers_prop_seg.pp_deprec_type_cd = tpps.pp_deprec_type_cd,
			pers_prop_seg.pp_deprec_deprec_cd = tpps.pp_deprec_deprec_cd,
			pers_prop_seg.pp_deprec_override = tpps.pp_deprec_override,
			pers_prop_seg.pp_deprec_pct = tpps.pp_deprec_pct,
			pers_prop_seg.pp_unit_price = tpps.pp_unit_price,
			pers_prop_seg.pp_appraised_val = tpps.pp_appraised_val,
			pers_prop_seg.pp_mkt_val = tpps.pp_mkt_val,

			pers_prop_seg.pp_special_val = tpps.pp_special_val,
			pers_prop_seg.pp_subseg_val = tpps.pp_subseg_val,
			pers_prop_seg.pp_orig_cost = tpps.pp_orig_cost,
			pers_prop_seg.pp_new_val = tpps.pp_new_val
		from pers_prop_seg
		join #recalc_bcp_pers_prop_seg as tpps with(nolock) on
			pers_prop_seg.prop_id = tpps.prop_id and
			pers_prop_seg.prop_val_yr = tpps.prop_val_yr and
			pers_prop_seg.sup_num = tpps.sup_num and
			pers_prop_seg.pp_seg_id = tpps.pp_seg_id and
			tpps.lRecalcBCPRowID >= @lMinBCPRowID and tpps.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

