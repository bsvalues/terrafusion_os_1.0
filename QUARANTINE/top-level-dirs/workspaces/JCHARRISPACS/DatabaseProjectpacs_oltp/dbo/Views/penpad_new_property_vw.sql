
create view dbo.penpad_new_property_vw

as

	select
		p.penpad_run_id,
		p.prop_id,
		p.prop_type_cd,
		pv.legal_desc,
		pv.penpad_comments,
		a.file_as_name,
		dbo.fn_GetPropertyParentLinks(p.prop_id, pv.prop_val_yr, pv.sup_num) as parent_links
	from property as p
	join pacs_system as ps on
		0 = 0 /* Always join */
	join property_val as pv on
		p.prop_id = pv.prop_id and
		ps.appr_yr = pv.prop_val_yr and
		pv.sup_num = 0
	join owner as o on
		pv.prop_id = o.prop_id and
		pv.prop_val_yr = o.owner_tax_yr and
		pv.sup_num = o.sup_num
	join account as a on
		o.owner_id = a.acct_id
	where
		p.penpad_run_id > 0

GO

