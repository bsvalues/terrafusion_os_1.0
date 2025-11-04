
create procedure ComparableGridSelectEntity
	@lYear numeric(4,0)
as

	select
		c.lPropID,
		epa.entity_id
	from #comp_sales_property_pid as c with(nolock)
	join entity_prop_assoc as epa with(nolock) on
		epa.tax_yr = @lYear and
		epa.sup_num = c.lSupNum and
		epa.prop_id = c.lPropID
	order by
		c.lPropID asc, epa.entity_id asc

GO

