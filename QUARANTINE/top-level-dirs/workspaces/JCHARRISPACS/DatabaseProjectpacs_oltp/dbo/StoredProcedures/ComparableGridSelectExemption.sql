
create procedure ComparableGridSelectExemption
	@lYear numeric(4,0)
as

	select
		c.lPropID,
		upper(rtrim(pe.exmpt_type_cd))
	from #comp_sales_property_pid as c with(nolock)
	join property_exemption as pe with(nolock) on
		pe.exmpt_tax_yr = @lYear and
		pe.owner_tax_yr = @lYear and
		pe.sup_num = c.lSupNum and
		pe.prop_id = c.lPropID
	order by
		c.lPropID asc,
		pe.exmpt_type_cd asc

	return ( @@rowcount )

GO

