
create procedure RecalcUpdateSharedProperty
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_shared_prop
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
		update shared_prop
		set
			shared_prop.imprv_hs_val = tsp.imprv_hs_val,
			shared_prop.imprv_non_hs_val = tsp.imprv_non_hs_val,
			shared_prop.land_hs = tsp.land_hs,
			shared_prop.land_non_hs = tsp.land_non_hs,
			shared_prop.ag_use_val = tsp.ag_use_val,
			shared_prop.ag_market = tsp.ag_market,
			shared_prop.timber_use = tsp.timber_use,
			shared_prop.timber_market = tsp.timber_market,
			shared_prop.market = tsp.market,
			shared_prop.productivity_loss = tsp.productivity_loss,
			shared_prop.appraised_val = tsp.appraised_val,
			shared_prop.cad_assessed_val = tsp.cad_assessed_val
		from shared_prop
		join #recalc_bcp_shared_prop as tsp with(nolock) on
			shared_prop.pacs_prop_id = tsp.pacs_prop_id and
			shared_prop.shared_year = tsp.shared_year and
			shared_prop.sup_num = tsp.sup_num and
			shared_prop.shared_cad_code = tsp.shared_cad_code and
			tsp.lRecalcBCPRowID >= @lMinBCPRowID and tsp.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

