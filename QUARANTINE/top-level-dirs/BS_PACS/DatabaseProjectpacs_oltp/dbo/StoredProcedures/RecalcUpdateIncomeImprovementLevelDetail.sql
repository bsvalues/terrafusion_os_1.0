
create procedure RecalcUpdateIncomeImprovementLevelDetail
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_income_improvement_level_detail
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
		update income_improvement_level_detail
		set
			income_improvement_level_detail.floor_number = t.floor_number,
			income_improvement_level_detail.gross_building_area = t.gross_building_area,
			income_improvement_level_detail.net_rentable_area = t.net_rentable_area,
			income_improvement_level_detail.daily_rent_rate = t.daily_rent_rate,
			income_improvement_level_detail.monthly_rent_rate = t.monthly_rent_rate,
			income_improvement_level_detail.yearly_rent_rate = t.yearly_rent_rate,
			income_improvement_level_detail.occupancy_pct = t.occupancy_pct,
			income_improvement_level_detail.collection_loss = t.collection_loss,
			income_improvement_level_detail.reimbursed_expenses = t.reimbursed_expenses,
			income_improvement_level_detail.secondary_income = t.secondary_income,
			income_improvement_level_detail.gross_potential_income = t.gross_potential_income,
			income_improvement_level_detail.effective_gross_income = t.effective_gross_income,
			income_improvement_level_detail.expense_ratio = t.expense_ratio,
			income_improvement_level_detail.expense_per_sqft = t.expense_per_sqft,
			income_improvement_level_detail.expense_overall = t.expense_overall,
			income_improvement_level_detail.cap_rate = t.cap_rate,
			income_improvement_level_detail.tax_rate = t.tax_rate,
			income_improvement_level_detail.overall_rate = t.overall_rate,
			income_improvement_level_detail.net_operating_income = t.net_operating_income,
			income_improvement_level_detail.value = t.value
		from income_improvement_level_detail
		join #recalc_bcp_income_improvement_level_detail as t with(nolock) on
			income_improvement_level_detail.income_yr = t.income_yr and
			income_improvement_level_detail.sup_num = t.sup_num and
			income_improvement_level_detail.income_id = t.income_id and
			income_improvement_level_detail.seq_num = t.seq_num and
			t.lRecalcBCPRowID >= @lMinBCPRowID and t.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

