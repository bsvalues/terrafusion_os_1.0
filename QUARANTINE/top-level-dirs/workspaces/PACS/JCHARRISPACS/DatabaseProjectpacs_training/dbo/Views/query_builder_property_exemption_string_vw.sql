
create view query_builder_property_exemption_string_vw
as

	select distinct
		pe.exmpt_tax_yr, pe.owner_tax_yr, pe.sup_num, pe.prop_id, pe.owner_id,
		exemptionCodeList = dbo.fn_GetExemptions(pe.prop_id, pe.exmpt_tax_yr, pe.sup_num)
	from property_exemption as pe with(nolock)

GO

