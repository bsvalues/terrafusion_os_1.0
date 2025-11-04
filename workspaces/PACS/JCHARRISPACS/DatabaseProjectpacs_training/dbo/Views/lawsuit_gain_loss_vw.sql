
CREATE view lawsuit_gain_loss_vw

as

select 	lp.lawsuit_yr,
		l.cause_num,
		lp.prop_id,
		p.geo_id,
		a.file_as_name,
		pta.tax_area_id,
		ta.tax_area_number,
		ta.tax_area_description,
		lp.certified_value,
		lp.adjudged_value,
		lp.certified_value - lp.adjudged_value as gain_loss,
		case when isnull(ls.inactive_flag,0) = 1 then 'Inactive' else 'Active' end as status_type 

from lawsuit_property as lp
with (nolock)
inner join lawsuit as l
with (nolock)
on lp.lawsuit_id = l.lawsuit_id
inner join property as p
with (nolock)
on lp.prop_id = p.prop_id
inner join prop_supp_assoc as psa
with (nolock)
on lp.prop_id = psa.prop_id
and lp.lawsuit_yr = psa.owner_tax_yr
inner join property_val as pv
with (nolock)
on psa.prop_id = pv.prop_id
and psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num
inner join owner as o
with (nolock)
on lp.prop_id = o.prop_id
and lp.lawsuit_yr = o.owner_tax_yr
and psa.sup_num = o.sup_num
inner join account as a
with (nolock)
on o.owner_id = a.acct_id
inner join property_tax_area as pta
with (nolock)
on lp.prop_id = pta.prop_id
and lp.lawsuit_yr = pta.year
and psa.sup_num = pta.sup_num
inner join tax_area as ta
with (nolock)
on pta.tax_area_id = ta.tax_area_id
left outer join lawsuit_status as ls
with (nolock)
on l.status = ls.status_cd
where (pv.prop_inactive_dt IS NULL) and (isnull(pv.prop_state,'') <> 'P')

GO

