
create procedure RecalcSelectIncomeImprovementLevelDetail
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
		select
			convert(smallint, i.income_yr),
			convert(smallint, i.sup_num),
			i.income_id,
			i.seq_num,
			i.prop_id,
			i.imprv_id,
			i.imprv_det_id,
			i.included,
			i.override,
			upper(rtrim(i.hood_cd)),
			upper(rtrim(i.economic_area)),
			upper(rtrim(i.imprv_det_type_cd)),
			upper(rtrim(i.imprv_det_meth_cd)),
			convert(smallint, i.floor_number),
			i.floor_number_override,
			upper(rtrim(i.primary_use_cd)),
			upper(rtrim(i.lease_class)),
			convert(smallint, i.effective_year_built),
			i.gross_building_area,
			i.gross_building_area_override,
			i.net_rentable_area,
			i.net_rentable_area_override,
			i.daily_rent_rate,
			i.monthly_rent_rate,
			i.yearly_rent_rate,
			i.rent_rate_override,
			i.occupancy_pct,
			i.occupancy_pct_override,
			i.collection_loss,
			i.collection_loss_override,
			i.reimbursed_expenses,
			i.reimbursed_expenses_override,
			i.secondary_income,
			i.secondary_income_override,
			i.gross_potential_income,
			i.effective_gross_income,
			i.expense_ratio,
			i.expense_ratio_override,
			i.expense_per_sqft,
			i.expense_per_sqft_override,
			i.expense_overall,
			i.expense_overall_override,
			i.cap_rate,
			i.cap_rate_override,
			i.tax_rate,
			i.tax_rate_override,
			i.overall_rate,
			i.net_operating_income,
			i.value,
			isnull(i.unit_count, 0),
			i.use_unit_count,
			i.unit_mix_code,
			i.unit_size
		from #recalc_prop_list as rpl with(nolock)
		join income_improvement_level_detail as i with(nolock) on
			rpl.prop_id = i.prop_id and
			rpl.sup_yr = i.income_yr and
			rpl.sup_num = i.sup_num
		order by 1, 2, 3, 4
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				convert(smallint, i.income_yr),
				convert(smallint, i.sup_num),
				i.income_id,
				i.seq_num,
				i.prop_id,
				i.imprv_id,
				i.imprv_det_id,
				i.included,
				i.override,
				upper(rtrim(i.hood_cd)),
				upper(rtrim(i.economic_area)),
				upper(rtrim(i.imprv_det_type_cd)),
				upper(rtrim(i.imprv_det_meth_cd)),
				convert(smallint, i.floor_number),
				i.floor_number_override,
				upper(rtrim(i.primary_use_cd)),
				upper(rtrim(i.lease_class)),
				convert(smallint, i.effective_year_built),
				i.gross_building_area,
				i.gross_building_area_override,
				i.net_rentable_area,
				i.net_rentable_area_override,
				i.daily_rent_rate,
				i.monthly_rent_rate,
				i.yearly_rent_rate,
				i.rent_rate_override,
				i.occupancy_pct,
				i.occupancy_pct_override,
				i.collection_loss,
				i.collection_loss_override,
				i.reimbursed_expenses,
				i.reimbursed_expenses_override,
				i.secondary_income,
				i.secondary_income_override,
				i.gross_potential_income,
				i.effective_gross_income,
				i.expense_ratio,
				i.expense_ratio_override,
				i.expense_per_sqft,
				i.expense_per_sqft_override,
				i.expense_overall,
				i.expense_overall_override,
				i.cap_rate,
				i.cap_rate_override,
				i.tax_rate,
				i.tax_rate_override,
				i.overall_rate,
				i.net_operating_income,
				i.value,
				isnull(i.unit_count, 0),
				i.use_unit_count,
				i.unit_mix_code,
				i.unit_size
			from income_improvement_level_detail as i with(nolock)
			where
				i.income_yr = @lYear and
				i.sup_num = @lSupNum
			order by 1, 2, 3, 4
		end
		else
		begin
			select
				convert(smallint, i.income_yr),
				convert(smallint, i.sup_num),
				i.income_id,
				i.seq_num,
				i.prop_id,
				i.imprv_id,
				i.imprv_det_id,
				i.included,
				i.override,
				upper(rtrim(i.hood_cd)),
				upper(rtrim(i.economic_area)),
				upper(rtrim(i.imprv_det_type_cd)),
				upper(rtrim(i.imprv_det_meth_cd)),
				convert(smallint, i.floor_number),
				i.floor_number_override,
				upper(rtrim(i.primary_use_cd)),
				upper(rtrim(i.lease_class)),
				convert(smallint, i.effective_year_built),
				i.gross_building_area,
				i.gross_building_area_override,
				i.net_rentable_area,
				i.net_rentable_area_override,
				i.daily_rent_rate,
				i.monthly_rent_rate,
				i.yearly_rent_rate,
				i.rent_rate_override,
				i.occupancy_pct,
				i.occupancy_pct_override,
				i.collection_loss,
				i.collection_loss_override,
				i.reimbursed_expenses,
				i.reimbursed_expenses_override,
				i.secondary_income,
				i.secondary_income_override,
				i.gross_potential_income,
				i.effective_gross_income,
				i.expense_ratio,
				i.expense_ratio_override,
				i.expense_per_sqft,
				i.expense_per_sqft_override,
				i.expense_overall,
				i.expense_overall_override,
				i.cap_rate,
				i.cap_rate_override,
				i.tax_rate,
				i.tax_rate_override,
				i.overall_rate,
				i.net_operating_income,
				i.value,
				isnull(i.unit_count, 0),
				i.use_unit_count,
				i.unit_mix_code,
				i.unit_size
			from income_improvement_level_detail as i with(nolock)
			where
				i.prop_id = @lPropID and
				i.income_yr = @lYear and
				i.sup_num = @lSupNum
			order by 1, 2, 3, 4
		end
	end

	return( @@rowcount )

GO

