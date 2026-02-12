
create procedure WACalcTaxableSelectExemption
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

	if ( @lPacsUserID <> 0 )
	begin
		select
			convert(smallint, pe.exmpt_tax_yr),
			convert(smallint, pe.sup_num),
			pe.prop_id,
			pe.owner_id,
			upper(rtrim(pe.exmpt_type_cd)),
			convert(smallint, pe.qualify_yr),
			pe.effective_dt,
			pe.termination_dt,
			upper(rtrim(pe.exmpt_subtype_cd)),
			pe.combined_disp_income,
			pe.dor_value_type,
			pe.dor_exmpt_amount,
			pe.dor_exmpt_percent
		from #taxable_property_list as tpl with(nolock)
		join property_exemption as pe with(nolock) on
			tpl.year = pe.exmpt_tax_yr and
			tpl.year = pe.owner_tax_yr and
			tpl.sup_num = pe.sup_num and
			tpl.prop_id = pe.prop_id
		order by 1, 2, 3, 4
	end
	else if ( @lPropID <> 0 )
	begin
		select
			convert(smallint, pe.exmpt_tax_yr),
			convert(smallint, pe.sup_num),
			pe.prop_id,
			pe.owner_id,
			upper(rtrim(pe.exmpt_type_cd)),
			convert(smallint, pe.qualify_yr),
			pe.effective_dt,
			pe.termination_dt,
			upper(rtrim(pe.exmpt_subtype_cd)),
			pe.combined_disp_income,
			pe.dor_value_type,
			pe.dor_exmpt_amount,
			pe.dor_exmpt_percent
		from property_exemption as pe with(nolock)
		where
			pe.exmpt_tax_yr = @lYear and
			pe.owner_tax_yr = @lYear and
			pe.sup_num = @lSupNum and
			pe.prop_id = @lPropID
		order by 1, 2, 3, 4
	end
	else -- Select all
	begin
		select
			convert(smallint, pe.exmpt_tax_yr),
			convert(smallint, pe.sup_num),
			pe.prop_id,
			pe.owner_id,
			upper(rtrim(pe.exmpt_type_cd)),
			convert(smallint, pe.qualify_yr),
			pe.effective_dt,
			pe.termination_dt,
			upper(rtrim(pe.exmpt_subtype_cd)),
			pe.combined_disp_income,
			pe.dor_value_type,
			pe.dor_exmpt_amount,
			pe.dor_exmpt_percent
		from property_exemption as pe with(nolock)
		where
			pe.exmpt_tax_yr = @lYear and
			pe.owner_tax_yr = @lYear and
			pe.sup_num = @lSupNum
		order by 1, 2, 3, 4
	end

GO

