
create procedure ComparableGridSelectImprovementDetail
	@lYear numeric(4,0)
as

	select
		c.lPropID,

		id.imprv_id,
		id.imprv_det_id,

		id.imprv_det_calc_val,
		id.imprv_det_val,
		id.imprv_det_flat_val,
		id.imprv_det_area,
		
		upper(rtrim(id.imprv_det_type_cd)),
		upper(rtrim(id.imprv_det_class_cd)),
		upper(rtrim(id.imprv_det_sub_class_cd)),

		id.unit_price,

		convert(bit, case when id.use_up_for_pct_base = 'T' then 1 else 0 end),
		id.imprv_det_adj_factor,
		id.percent_complete,
		convert(bit, case when id.percent_complete_override = 'T' then 1 else 0 end),

		convert(bit, case when id.imprv_det_val_source = 'F' then 1 else 0 end),

		isnull(id.num_units, 1),
		isnull(id.num_stories, 0),
		isnull(id.stories_multiplier, 0),
		id.imprv_det_adj_val

	from #comp_sales_property_pid as c with(nolock)
	join imprv_detail as id with(nolock) on
		id.prop_val_yr = @lYear and
		id.sup_num = c.lSupNum and
		id.sale_id = 0 and
		id.prop_id = c.lPropID
	order by
		c.lPropID asc, id.imprv_id asc, id.imprv_det_id asc

	return( @@rowcount )

GO

