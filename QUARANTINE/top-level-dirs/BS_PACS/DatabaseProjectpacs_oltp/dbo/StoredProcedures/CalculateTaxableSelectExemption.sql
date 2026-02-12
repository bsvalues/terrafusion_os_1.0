
create procedure CalculateTaxableSelectExemption
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			pe.prop_id,
			pe.owner_id,
			upper(rtrim(pe.exmpt_type_cd)),
			convert(varchar(10), pe.effective_dt, 101),
			convert(varchar(10), pe.termination_dt, 101),
			upper(rtrim(eo.exmpt_type_desc)),
			upper(rtrim(eo.entity_type)),
			isnull(et.federal_amt, 0.0),
			isnull(et.plus_oa65_amt, 0.0),
			convert(bit, case when pe.apply_local_option_pct_only = 'T' then 1 else 0 end),
			isnull(pe.apply_no_exemption_amount, 0)
		from property_exemption as pe with(nolock)
		join exmpt_order as eo with(nolock) on
			pe.exmpt_type_cd = eo.exmpt_type_cd
		join exmpt_type as et with(nolock) on
			pe.exmpt_type_cd = et.exmpt_type_cd
		where
			pe.prop_id in (
				select prop_id from #totals_prop_list
			) and
			pe.exmpt_tax_yr = @lYear and
			pe.owner_tax_yr = @lYear and
			pe.sup_num = @lSupNum
		order by pe.prop_id asc, pe.owner_id asc, eo.exmpt_order asc
	end
	else
	begin
		select
			pe.prop_id,
			pe.owner_id,
			upper(rtrim(pe.exmpt_type_cd)),
			convert(varchar(10), pe.effective_dt, 101),
			convert(varchar(10), pe.termination_dt, 101),
			upper(rtrim(eo.exmpt_type_desc)),
			upper(rtrim(eo.entity_type)),
			isnull(et.federal_amt, 0.0),
			isnull(et.plus_oa65_amt, 0.0),
			convert(bit, case when pe.apply_local_option_pct_only = 'T' then 1 else 0 end),
			isnull(pe.apply_no_exemption_amount, 0)
		from property_exemption as pe with(nolock)
		join exmpt_order as eo with(nolock) on
			pe.exmpt_type_cd = eo.exmpt_type_cd
		join exmpt_type as et with(nolock) on
			pe.exmpt_type_cd = et.exmpt_type_cd
		where
			pe.exmpt_tax_yr = @lYear and
			pe.owner_tax_yr = @lYear and
			pe.sup_num = @lSupNum
		order by pe.prop_id asc, pe.owner_id asc, eo.exmpt_order asc
	end

	return(@@rowcount)

GO

