
create procedure RecalcUpdateLandMiscCode
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_property_land_misc_code
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
		update property_land_misc_code
		set
			property_land_misc_code.value = tlmc.value,
			property_land_misc_code.[index] = tlmc.[index],
			property_land_misc_code.indexed_value = tlmc.indexed_value,
			property_land_misc_code.sched_id = case when tlmc.sched_id = 0 then null else tlmc.sched_id end,
			property_land_misc_code.calc_value = tlmc.calc_value
		from property_land_misc_code
		join #recalc_bcp_property_land_misc_code as tlmc with(nolock) on
			property_land_misc_code.prop_val_yr = tlmc.prop_val_yr and
			property_land_misc_code.sup_num = tlmc.sup_num and
			property_land_misc_code.sale_id = tlmc.sale_id and
			property_land_misc_code.prop_id = tlmc.prop_id and
			property_land_misc_code.misc_id = tlmc.misc_id and
			tlmc.lRecalcBCPRowID >= @lMinBCPRowID and tlmc.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

