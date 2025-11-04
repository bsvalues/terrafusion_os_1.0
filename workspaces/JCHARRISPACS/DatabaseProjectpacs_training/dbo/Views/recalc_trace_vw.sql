
create view recalc_trace_vw

as

	select
		rti.lTraceID,
		rti.prop_id,
		rti.prop_val_yr,
		rti.sup_num,
		rti.imprv_id,
		rti.imprv_det_id,
		rti.szText,
		i.imprv_type_cd,
		i.imprv_state_cd,
		i.imprv_desc,
		id.imprv_det_type_cd,
		id.imprv_det_desc,
		p.geo_id,
		pv.legal_desc,
		s.situs_display,
		a.file_as_name
	from recalc_trace_imprv as rti with(nolock)
	join imprv as i with(nolock) on
		rti.prop_id = i.prop_id and
		rti.prop_val_yr = i.prop_val_yr and
		rti.sup_num = i.sup_num and
		i.sale_id = 0 and
		rti.imprv_id = i.imprv_id
	left outer join imprv_detail as id with(nolock) on
		rti.prop_id = id.prop_id and
		rti.prop_val_yr = id.prop_val_yr and
		rti.sup_num = id.sup_num and
		id.sale_id = 0 and
		rti.imprv_id = id.imprv_id and
		rti.imprv_det_id = id.imprv_det_id
	join property as p with(nolock) on
		rti.prop_id = p.prop_id
	join property_val as pv with(nolock) on
		rti.prop_id = pv.prop_id and
		rti.prop_val_yr = pv.prop_val_yr and
		rti.sup_num = pv.sup_num
	join owner as o with(nolock) on
		rti.prop_id = o.prop_id and
		rti.prop_val_yr = o.owner_tax_yr and
		rti.sup_num = o.sup_num
	join account as a with(nolock) on
		o.owner_id = a.acct_id
	left outer join situs as s with(nolock) on
		rti.prop_id = s.prop_id and
		s.primary_situs = 'Y'

GO

