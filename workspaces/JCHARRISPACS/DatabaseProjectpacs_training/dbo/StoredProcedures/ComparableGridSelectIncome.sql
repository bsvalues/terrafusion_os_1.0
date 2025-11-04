
create procedure ComparableGridSelectIncome
	@lYear numeric(4,0)
as

	select
		c.lPropID,

		i.nra,
		i.income_id,
		isnull(i.value_method, ''),
		isnull(i.income_value, 0),
		isnull(i.lu_cost, 0),
		isnull(i.land, 0),
		isnull(i.pers, 0),
		isnull(i.noirsf, 0),
		isnull(i.capr, 0),
		isnull(i.num_units, 0),

		iv.property_count,
		iv.land_sqft,
		iv.land_acres,
		iv.living_area,
		iv.land_hstd_val,
		iv.land_non_hstd_val,
		iv.ag_market,
		iv.timber_market,
		iv.imprv_hstd_val,
		iv.imprv_non_hstd_val,
		iv.ag_hs_mkt_val,
		iv.timber_hs_mkt_val

	from #comp_sales_property_pid as c with(nolock)
	join income_prop_vw as i with(nolock) on
		i.prop_val_yr = @lYear and
		i.sup_num = c.lSupNum and
		i.prop_id = c.lPropID and
		i.active_valuation = 'T'
	left outer join income_values_vw as iv with(nolock) on
		iv.prop_val_yr = i.prop_val_yr and
		iv.sup_num = i.sup_num and
		iv.income_id = i.income_id
	order by
		c.lPropID asc

	return( @@rowcount )

GO

