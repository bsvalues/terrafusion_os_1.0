

create view penpad_property_header_vw
as
select
	pv.prop_id, pv.prop_val_yr, pv.sup_num,
	p.geo_id, p.prop_type_cd, a.file_as_name,
	exemptions = dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num),
	entities = dbo.fn_GetEntities(pv.prop_id, pv.prop_val_yr, pv.sup_num),
	situs_address = situs.situs_display,
	pv.market,
	
	mailing_address =
		isnull(address.addr_line1, '') + ' ' +
		isnull(address.addr_line2, '') + ' ' +
		isnull(address.addr_line3, '') + ' ' +
		isnull(address.addr_city, '') + ' ' +
		isnull(address.addr_state, '') + ' ' +
		isnull(address.addr_zip, '')

from property_val as pv with(nolock)
join property as p  with(nolock) on
	pv.prop_id = p.prop_id
join owner as o  with(nolock) on
	pv.prop_val_yr = o.owner_tax_yr and
	pv.prop_id = o.prop_id and
	pv.sup_num = o.sup_num
join account as a  with(nolock) on
	o.owner_id = a.acct_id
left outer join situs with(nolock) on
	pv.prop_id = situs.prop_id and
	situs.primary_situs = 'Y'
left outer join address with(nolock) on
	a.acct_id = address.acct_id and
	address.addr_type_cd = 'M'

GO

