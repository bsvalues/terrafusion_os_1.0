
CREATE VIEW dbo.property_group_codes_report_vw
AS

select
	o.owner_id, 
	ac.file_as_name, 
	pv.legal_desc,
	p.prop_id as owner_prop_id,
	psa.owner_tax_yr,
	p.geo_id, 
	pga.prop_group_cd,
	pgc.group_desc,
	pv.prop_inactive_dt, 
	pga.expiration_dt,
	pga.assessment_yr,
	pv.hood_cd,
	pv.cycle

from property p with(nolock)

join prop_supp_assoc psa with(nolock)
on psa.prop_id = p.prop_id

join property_val pv with(nolock)
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num

join owner o with(nolock)
on pv.prop_id = o.prop_id
and pv.prop_val_yr = o.owner_tax_yr
and pv.sup_num = o.sup_num

join account ac with(nolock)
on o.owner_id = ac.acct_id

join prop_group_assoc pga with(nolock)
on pga.prop_id = p.prop_id

join prop_group_code pgc with(nolock)
on pgc.group_cd = pga.prop_group_cd

GO

