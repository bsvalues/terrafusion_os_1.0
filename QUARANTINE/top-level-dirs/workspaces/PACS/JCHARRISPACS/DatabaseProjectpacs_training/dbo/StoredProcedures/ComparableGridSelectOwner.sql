
create procedure ComparableGridSelectOwner
	@lYear numeric(4,0)
as

	select
		c.lPropID,
		a.file_as_name
	from #comp_sales_property_pid as c with(nolock)
	join owner as o with(nolock) on
		o.owner_tax_yr = @lYear and
		o.prop_id = c.lPropID and
		o.sup_num = c.lSupNum
	join account as a with(nolock) on
		o.owner_id = a.acct_id
	order by
		c.lPropID asc

	return ( @@rowcount )

GO

