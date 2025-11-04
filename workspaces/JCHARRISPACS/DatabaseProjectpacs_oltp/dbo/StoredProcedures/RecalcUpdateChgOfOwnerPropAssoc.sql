
create procedure RecalcUpdateChgOfOwnerPropAssoc
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_chg_of_owner_prop_assoc
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
		update chg_of_owner_prop_assoc
		set
			chg_of_owner_prop_assoc.imprv_hstd_val = tco.imprv_hstd_val,
			chg_of_owner_prop_assoc.imprv_non_hstd_val = tco.imprv_non_hstd_val,
			chg_of_owner_prop_assoc.land_hstd_val = tco.land_hstd_val,
			chg_of_owner_prop_assoc.land_non_hstd_val = tco.land_non_hstd_val,
			chg_of_owner_prop_assoc.ag_use_val = tco.ag_use_val,
			chg_of_owner_prop_assoc.ag_market = tco.ag_market,
			chg_of_owner_prop_assoc.ag_loss = tco.ag_loss,
			chg_of_owner_prop_assoc.timber_use = tco.timber_use,
			chg_of_owner_prop_assoc.timber_market = tco.timber_market,
			chg_of_owner_prop_assoc.timber_loss = tco.timber_loss,
			chg_of_owner_prop_assoc.appraised_val = tco.appraised_val,
			chg_of_owner_prop_assoc.assessed_val = tco.assessed_val,
			chg_of_owner_prop_assoc.market = tco.market
		from chg_of_owner_prop_assoc
		join #recalc_bcp_chg_of_owner_prop_assoc as tco with(nolock) on
			chg_of_owner_prop_assoc.chg_of_owner_id = tco.chg_of_owner_id and
			chg_of_owner_prop_assoc.prop_id = tco.prop_id and
			tco.lRecalcBCPRowID >= @lMinBCPRowID and tco.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

