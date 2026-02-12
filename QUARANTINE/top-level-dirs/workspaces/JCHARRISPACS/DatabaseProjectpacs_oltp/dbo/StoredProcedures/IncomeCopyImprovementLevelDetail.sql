
create procedure IncomeCopyImprovementLevelDetail

	@year numeric(4,0),
	@sup_num int,
	@income_id int,
	@imprv_id int,
	@imprv_det_id int,
	@seq_num int

as

	insert income_improvement_level_detail
	(income_id, sup_num, income_yr, prop_id, imprv_id, imprv_det_id, included, [override],
	 copied, hood_cd, imprv_det_type_cd, imprv_det_meth_cd, floor_number, floor_number_override,
	 primary_use_cd, lease_class, effective_year_built, gross_building_area, gross_building_area_override,
	 load_factor, load_factor_override, net_rentable_area, net_rentable_area_override,
	 economic_area, economic_area_override, daily_rent_rate, monthly_rent_rate, yearly_rent_rate,
	 rent_rate_override, occupancy_pct, occupancy_pct_override, collection_loss,
	 collection_loss_override, reimbursed_expenses, reimbursed_expenses_override,
	 secondary_income, secondary_income_override, gross_potential_income, effective_gross_income,
	 expense_ratio, expense_ratio_override, expense_per_sqft, expense_per_sqft_override,
	 expense_overall, expense_overall_override, cap_rate, cap_rate_override, tax_rate,
	 tax_rate_override, overall_rate, net_operating_income,
	 [value], imprv_desc)

	select income_id, sup_num, income_yr, prop_id, imprv_id, imprv_det_id, included, [override],
	 1, hood_cd, imprv_det_type_cd, imprv_det_meth_cd, floor_number, floor_number_override,
	 primary_use_cd, lease_class, effective_year_built, gross_building_area, gross_building_area_override,
	 load_factor, load_factor_override, net_rentable_area, net_rentable_area_override, 
	 economic_area, economic_area_override, daily_rent_rate, monthly_rent_rate, yearly_rent_rate,
	 rent_rate_override, occupancy_pct, occupancy_pct_override, collection_loss,
	 collection_loss_override, reimbursed_expenses, reimbursed_expenses_override,
	 secondary_income, secondary_income_override, gross_potential_income, effective_gross_income,
	 expense_ratio, expense_ratio_override, expense_per_sqft, expense_per_sqft_override,
	 expense_overall, expense_overall_override, cap_rate, cap_rate_override, tax_rate,
	 tax_rate_override, overall_rate, net_operating_income,
	 [value], imprv_desc
	from income_improvement_level_detail
	with (nolock)
	where income_yr = @year
	and sup_num = @sup_num
	and income_id = @income_id
	and imprv_id = @imprv_id
	and imprv_det_id = @imprv_det_id
	and seq_num = @seq_num
	
	update income_improvement_level_detail
	set [override] = 1
	where income_yr = @year
	and sup_num = @sup_num
	and income_id = @income_id
	and imprv_id = @imprv_id
	and imprv_det_id = @imprv_det_id
	and seq_num = @seq_num







set ansi_nulls on
set quoted_identifier on

GO

