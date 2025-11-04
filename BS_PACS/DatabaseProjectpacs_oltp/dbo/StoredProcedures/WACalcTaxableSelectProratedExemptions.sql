
create procedure WACalcTaxableSelectProratedExemptions
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as


if ( @lPacsUserID <> 0)
begin
	-- select records for properties in the temporary table
	select year, sup_num, prop_id, past_sup_num, is_exemption, begin_date, end_date
	from
	(
		-- exemptions
		select
			convert(smallint, ppe.year) as year,
			convert(smallint, ppe.sup_num) as sup_num,
			ppe.prop_id,
			convert(smallint, pe.sup_num) as past_sup_num,
			convert(bit, 1) as is_exemption,
			pe.effective_dt as begin_date,
			pe.termination_dt as end_date
			
		from #taxable_property_list tpl with(nolock)

		join property_prorated_exemptions ppe with(nolock)
		on tpl.year = ppe.year
		and tpl.sup_num = ppe.sup_num
		and tpl.prop_id = ppe.prop_id

		join property_exemption pe with(nolock)
		on ppe.ex_tax_year = pe.exmpt_tax_yr
		and ppe.ex_owner_year = pe.owner_tax_yr
		and ppe.ex_sup_num = pe.sup_num
		and ppe.ex_prop_id = pe.prop_id
		and ppe.ex_owner_id = pe.owner_id
		and ppe.ex_type_cd = pe.exmpt_type_cd
		
		UNION
		
		-- supplements without exemptions
		select 
			convert(smallint, pps.year) as year,
			convert(smallint, pps.sup_num) as sup_num,
			pps.prop_id,
			convert(smallint, pps.past_sup_num) as past_sup_num,
			convert(bit, 0) as is_exemption,
			pps.begin_date,
			pps.end_date

		from #taxable_property_list tpl with(nolock)

		join property_prorated_supplements pps with(nolock)
		on tpl.year = pps.year
		and tpl.sup_num = pps.sup_num
		and tpl.prop_id = pps.prop_id
	) q
	order by 1,2,3,4
end

else if ( @lPropID <> 0 )
begin
	-- one specific property
	select year, sup_num, prop_id, past_sup_num, is_exemption, begin_date, end_date
	from
	(
		-- exemptions
		select
			convert(smallint, ppe.year) as year,
			convert(smallint, ppe.sup_num) as sup_num,
			ppe.prop_id,
			convert(smallint, pe.sup_num) as past_sup_num,
			CONVERT(bit, 1) as is_exemption,
			pe.effective_dt as begin_date,
			pe.termination_dt as end_date
			
		from property_prorated_exemptions ppe with(nolock)

		join property_exemption pe with(nolock)
		on ppe.ex_tax_year = pe.exmpt_tax_yr
		and ppe.ex_owner_year = pe.owner_tax_yr
		and ppe.ex_sup_num = pe.sup_num
		and ppe.ex_prop_id = pe.prop_id
		and ppe.ex_owner_id = pe.owner_id
		and ppe.ex_type_cd = pe.exmpt_type_cd

		where ppe.year = @lYear
		and ppe.sup_num = @lSupNum
		and ppe.prop_id = @lPropID
			
		UNION

		-- supplements without exemptions	
		select 
			convert(smallint, pps.year) as year,
			convert(smallint, pps.sup_num) as sup_num,
			pps.prop_id,
			convert(smallint, pps.past_sup_num) as past_sup_num,
			convert(bit, 0) as is_exemption,
			pps.begin_date,
			pps.end_date

		from property_prorated_supplements pps with(nolock)

		where pps.year = @lYear
		and pps.sup_num = @lSupNum
		and pps.prop_id = @lPropID
	)q
	order by 1,2,3,4
end

else begin
	-- one specific property	
	select year, sup_num, prop_id, past_sup_num, is_exemption, begin_date, end_date
	from
	(
		-- exemptions
		select
			convert(smallint, ppe.year) as year,
			convert(smallint, ppe.sup_num) as sup_num,
			ppe.prop_id,
			convert(smallint, pe.sup_num) as past_sup_num,
			convert(bit, 1) as is_exemption,
			pe.effective_dt as begin_date,
			pe.termination_dt as end_date
			
		from property_prorated_exemptions ppe with(nolock)

		join property_exemption pe with(nolock)
		on ppe.ex_tax_year = pe.exmpt_tax_yr
		and ppe.ex_owner_year = pe.owner_tax_yr
		and ppe.ex_sup_num = pe.sup_num
		and ppe.ex_prop_id = pe.prop_id
		and ppe.ex_owner_id = pe.owner_id
		and ppe.ex_type_cd = pe.exmpt_type_cd

		where ppe.year = @lYear
		and ppe.sup_num = @lSupNum
		
		UNION
		
		-- supplements without exemptions
		select 
			convert(smallint, pps.year) as year,
			convert(smallint, pps.sup_num) as sup_num,
			pps.prop_id,
			convert(smallint, pps.past_sup_num) as past_sup_num,
			convert(bit, 0) as is_exemption,
			pps.begin_date,
			pps.end_date

		from property_prorated_supplements pps with(nolock)

		where pps.year = @lYear
		and pps.sup_num = @lSupNum
	)q
	order by 1,2,3,4
end

GO

