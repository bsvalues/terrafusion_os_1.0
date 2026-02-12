
create procedure IncomeImprovementLevelDetail

	@year numeric(4,0),
	@sup_num int,
	@income_id int

as

	set nocount on

	-- delete the ones that are no longer included from the Improvement Designations grid
	delete
	from income_improvement_level_detail
	where income_yr = @year
	and sup_num = @sup_num
	and income_id = @income_id
	and imprv_id in 
		(select imprv_id
			from income_imprv_assoc as iia
			with (nolock)
			where income_yr = @year
			and sup_num = @sup_num
			and income_id = @income_id
			and included = 0)
	
	-- update the ones that are already there

	update income_improvement_level_detail
	set hood_cd = pv.hood_cd,
			imprv_det_type_cd = id.imprv_det_type_cd,
			imprv_det_meth_cd = id.imprv_det_meth_cd,
			floor_number = case when iild.floor_number_override = 1 then iild.floor_number else id.floor_number end,
			primary_use_cd = i.primary_use_cd,
			lease_class = id.lease_class,
			effective_year_built = isnull(id.depreciation_yr, isnull(i.effective_yr_blt, isnull(id.yr_built, 0))),
			gross_building_area = case when iild.gross_building_area_override = 1 then iild.gross_building_area else id.imprv_det_area end,
			load_factor = case when iild.load_factor_override = 1 then iild.load_factor else id.load_factor end,
			net_rentable_area = case 
				when iild.net_rentable_area_override = 1 then iild.net_rentable_area 
				when iild.use_unit_count = 1 then null
				else id.net_rentable_area end,
			economic_area = case when iild.economic_area_override = 1 then iild.economic_area else inc.econ_area end,
			imprv_desc = case when iild.copied = 1 then iild.imprv_desc else i.imprv_desc end

		from income_improvement_level_detail as iild

		join property_val as pv with(nolock)
		on iild.income_yr = pv.prop_val_yr
		and iild.sup_num = pv.sup_num
		and iild.prop_id = pv.prop_id

		join imprv_detail as id with(nolock)
		on iild.income_yr = id.prop_val_yr
		and iild.sup_num = id.sup_num
		and id.sale_id = 0
		and iild.prop_id = id.prop_id
		and iild.imprv_id = id.imprv_id
		and iild.imprv_det_id = id.imprv_det_id

		join imprv as i with(nolock)
		on id.prop_val_yr = i.prop_val_yr
		and id.sup_num = i.sup_num
		and id.sale_id = i.sale_id
		and id.prop_id = i.prop_id
		and id.imprv_id = i.imprv_id

		join income as inc with(nolock)
		on inc.income_id = iild.income_id
		and inc.sup_num = iild.sup_num
		and inc.income_yr = iild.income_yr

		where iild.income_yr = @year
		and iild.sup_num = @sup_num
		and iild.income_id = @income_id
			

	-- insert any new ones that should be there that don't exist.

	insert income_improvement_level_detail
	(income_id, sup_num, income_yr, prop_id, imprv_id, imprv_det_id,
	 included, override, copied, hood_cd, economic_area, imprv_det_type_cd, imprv_det_meth_cd,
	 floor_number, primary_use_cd, lease_class, 
	 effective_year_built, gross_building_area,
	 load_factor, net_rentable_area, occupancy_pct, collection_loss,
	 reimbursed_expenses, secondary_income, gross_potential_income, effective_gross_income,
	 net_operating_income, [value], imprv_desc, unit_count, unit_mix_code, unit_size,
	 daily_rent_rate, monthly_rent_rate, yearly_rent_rate)

	select iia.income_id, iia.sup_num, iia.income_yr, iia.prop_id, iia.imprv_id, id.imprv_det_id,
		1, 0, 0, pv.hood_cd, inc.econ_area, id.imprv_det_type_cd, id.imprv_det_meth_cd,
		id.floor_number, i.primary_use_cd, id.lease_class,
		isnull(id.depreciation_yr, isnull(i.effective_yr_blt, isnull(id.yr_built, 0))), id.imprv_det_area, 
		id.load_factor, id.net_rentable_area, 0, 0,
		0, 0, 0, 0,
		0, 0, i.imprv_desc, null, null, null,
		0, 0, 0
		
	from income_imprv_assoc as iia with(nolock)

	join income as inc with(nolock)
	on inc.income_id = iia.income_id
	and inc.sup_num = iia.sup_num
	and inc.income_yr = iia.income_yr

	join property_val as pv with(nolock)
	on iia.income_yr = pv.prop_val_yr
	and iia.sup_num = pv.sup_num
	and iia.prop_id = pv.prop_id

	join imprv_detail as id with(nolock)
	on iia.income_yr = id.prop_val_yr
	and iia.sup_num = id.sup_num
	and id.sale_id = 0
	and iia.prop_id = id.prop_id
	and iia.imprv_id = id.imprv_id

	join imprv as i with(nolock)
	on id.prop_val_yr = i.prop_val_yr
	and id.sup_num = i.sup_num
	and id.sale_id = i.sale_id
	and id.prop_id = i.prop_id
	and id.imprv_id = i.imprv_id

	left outer join income_improvement_level_detail as iild with(nolock)
	on iia.income_yr = iild.income_yr
	and iia.sup_num = iild.sup_num
	and iia.income_id = iild.income_id
	and iia.imprv_id = iild.imprv_id

	where iia.income_yr = @year
	and iia.sup_num = @sup_num
	and iia.income_id = @income_id
	and iild.imprv_id is null
	and iia.included = 1

	set nocount off












set ansi_nulls on
set quoted_identifier on

GO

