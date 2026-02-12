
create procedure RecalcRowUpdateIncomeImprovementLevelDetail
	@income_yr numeric(4,0),
	@sup_num int,
	@income_id int,
	@seq_num int,

	@floor_number numeric(4,0),
	@gross_building_area numeric(18,1),
	@net_rentable_area numeric(18,1),
	@daily_rent_rate numeric(14,2),
	@monthly_rent_rate numeric(14,2),
	@yearly_rent_rate numeric(14,2),
	@occupancy_pct numeric(3,0),
	@collection_loss numeric(5,2),
	@reimbursed_expenses numeric(14,0),
	@secondary_income numeric(14,0),
	@gross_potential_income numeric(14,0),
	@effective_gross_income numeric(14,0),
	@expense_ratio numeric(5,2),
	@expense_per_sqft numeric(14,2),
	@expense_overall numeric(14,0),
	@cap_rate numeric(7,4),
	@tax_rate numeric(7,4),
	@overall_rate numeric(7,4),
	@net_operating_income numeric(14,0),
	@value numeric(14,0)
	
as

set nocount on

	update income_improvement_level_detail with(rowlock)
	set
		floor_number = @floor_number,
		gross_building_area = @gross_building_area,
		net_rentable_area = @net_rentable_area,
		daily_rent_rate = @daily_rent_rate,
		monthly_rent_rate = @monthly_rent_rate,
		yearly_rent_rate = @yearly_rent_rate,
		occupancy_pct = @occupancy_pct,
		collection_loss = @collection_loss,
		reimbursed_expenses = @reimbursed_expenses,
		secondary_income = @secondary_income,
		gross_potential_income = @gross_potential_income,
		effective_gross_income = @effective_gross_income,
		expense_ratio = @expense_ratio,
		expense_per_sqft = @expense_per_sqft,
		expense_overall = @expense_overall,
		cap_rate = @cap_rate,
		tax_rate = @tax_rate,
		overall_rate = @overall_rate,
		net_operating_income = @net_operating_income,
		value = @value
	where
		income_yr = @income_yr and
		sup_num = @sup_num and
		income_id = @income_id and
		seq_num = @seq_num

GO

