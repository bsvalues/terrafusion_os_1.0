
create procedure RecalcSelectIncomeGRMGIM
as

	select
		i.income_id,
		convert(smallint, i.income_yr),
		convert(smallint, i.sup_num),
		
		i.sch_personal_property_value,
		i.sch_other_value,
		
		i.pf_pgi_annual,
		i.pf_pgi_monthly,
		i.pf_gim,
		i.pf_grm,
		i.pf_personal_property_value,
		i.pf_other_value,

		i.dc_pgi_annual,
		i.dc_pgi_monthly,
		i.dc_gim,
		i.dc_grm,
		i.dc_personal_property_value,
		i.dc_other_value

	from #recalc_worktable_income_id_assoc as t with(nolock)
	join income_grm_gim as i with(nolock) on
		t.income_yr = i.income_yr and
		t.sup_num = i.sup_num and
		t.income_id = i.income_id
	order by
		1 asc, 2 asc, 3 asc

	return( @@rowcount )

GO

