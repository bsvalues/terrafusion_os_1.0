
create procedure ComparableGridSelectLandMiscCodes
	@lYear numeric(4,0)
as

	select
		c.lPropID,
		upper(rtrim(plmc.misc_code)),
		lmc.misc_desc
	from #comp_sales_property_pid as c with(nolock)
	join property_land_misc_code as plmc with(nolock) on
		plmc.prop_val_yr = @lYear and
		plmc.sup_num = c.lSupNum and
		plmc.sale_id = 0 and
		plmc.prop_id = c.lPropID
	join land_misc_code as lmc with(nolock) on
		lmc.misc_cd = plmc.misc_code
	order by
		c.lPropID asc,
		plmc.misc_code asc

	return ( @@rowcount )

GO

