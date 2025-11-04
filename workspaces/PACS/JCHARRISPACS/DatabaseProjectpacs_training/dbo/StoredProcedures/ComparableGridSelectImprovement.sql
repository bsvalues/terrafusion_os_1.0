
create procedure ComparableGridSelectImprovement
	@lYear numeric(4,0)
as

	select
		c.lPropID,

		i.imprv_id,
		i.num_imprv,
		i.imprv_adj_factor,
		i.imprv_mass_adj_factor,
		upper(rtrim(i.imprv_type_cd)),
		i.percent_complete,
		isnull(i.imprv_val, 0)

	from #comp_sales_property_pid as c with(nolock)
	join imprv as i with(nolock) on
		i.prop_val_yr = @lYear and
		i.sup_num = c.lSupNum and
		i.sale_id = 0 and
		i.prop_id = c.lPropID
	order by
		c.lPropID asc, i.imprv_id asc

	return( @@rowcount )

GO

