
create procedure RecalcUpdateOwner
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_owner
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
		update owner
		set
			owner.pct_imprv_hs = towner.pct_imprv_hs,
			owner.pct_imprv_nhs = towner.pct_imprv_nhs,
			owner.pct_land_hs = towner.pct_land_hs,
			owner.pct_land_nhs = towner.pct_land_nhs,
			owner.pct_ag_use = towner.pct_ag_use,
			owner.pct_ag_mkt = towner.pct_ag_mkt,
			owner.pct_tim_use = towner.pct_tim_use,
			owner.pct_tim_mkt = towner.pct_tim_mkt,
			owner.pct_ag_use_hs = towner.pct_ag_use_hs,
			owner.pct_ag_mkt_hs = towner.pct_ag_mkt_hs,
			owner.pct_tim_use_hs = towner.pct_tim_use_hs,
			owner.pct_tim_mkt_hs = towner.pct_tim_mkt_hs,
			owner.pct_pers_prop = towner.pct_pers_prop
		from owner
		join #recalc_bcp_owner as towner with(nolock) on
			owner.prop_id = towner.prop_id and
			owner.owner_tax_yr = towner.owner_tax_yr and
			owner.sup_num = towner.sup_num and
			owner.owner_id = towner.owner_id and
			towner.lRecalcBCPRowID >= @lMinBCPRowID and towner.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

