
create procedure RecalcUpdateIncomeGRMGIM
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_income_grm_gim
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
		update income_grm_gim
		set
			income_grm_gim.sch_pgi_annual = t.sch_pgi_annual,
			income_grm_gim.sch_pgi_monthly = t.sch_pgi_monthly,
			income_grm_gim.sch_gim = t.sch_gim,
			income_grm_gim.sch_grm = t.sch_grm,

			income_grm_gim.pf_pgi_annual = t.pf_pgi_annual,
			income_grm_gim.pf_pgi_monthly = t.pf_pgi_monthly,
			income_grm_gim.pf_gim = t.pf_gim,
			income_grm_gim.pf_grm = t.pf_grm,

			income_grm_gim.dc_pgi_annual = t.dc_pgi_annual,
			income_grm_gim.dc_pgi_monthly = t.dc_pgi_monthly,
			income_grm_gim.dc_gim = t.dc_gim,
			income_grm_gim.dc_grm = t.dc_grm,

			income_grm_gim.sch_indicated_value_gim = t.sch_indicated_value_gim,
			income_grm_gim.sch_indicated_value_grm = t.sch_indicated_value_grm,
			income_grm_gim.sch_base_indicated_value = t.sch_base_indicated_value,
			income_grm_gim.sch_indicated_value = t.sch_indicated_value,

			income_grm_gim.pf_indicated_value_gim = t.pf_indicated_value_gim,
			income_grm_gim.pf_indicated_value_grm = t.pf_indicated_value_grm,
			income_grm_gim.pf_base_indicated_value = t.pf_base_indicated_value,
			income_grm_gim.pf_indicated_value = t.pf_indicated_value,

			income_grm_gim.dc_indicated_value_gim = t.dc_indicated_value_gim,
			income_grm_gim.dc_indicated_value_grm = t.dc_indicated_value_grm,
			income_grm_gim.dc_base_indicated_value = t.dc_base_indicated_value,
			income_grm_gim.dc_indicated_value = t.dc_indicated_value
		from income_grm_gim
		join #recalc_bcp_income_grm_gim as t with(nolock) on
			income_grm_gim.income_yr = t.income_yr and
			income_grm_gim.sup_num = t.sup_num and
			income_grm_gim.income_id = t.income_id and
			t.lRecalcBCPRowID >= @lMinBCPRowID and t.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

