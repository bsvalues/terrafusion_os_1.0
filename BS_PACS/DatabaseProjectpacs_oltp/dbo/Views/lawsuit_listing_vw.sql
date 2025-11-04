




CREATE view lawsuit_listing_vw

as

select distinct a.file_as_name, lp.prop_id, p.geo_id,
			(select count(prop_id)
			 from lawsuit_property
			 with (nolock)
			 inner join lawsuit
			 with (nolock)
			 on lawsuit_property.lawsuit_id = lawsuit.lawsuit_id
			 where lawsuit_property.prop_id = lp.prop_id
			 and lawsuit_property.lawsuit_yr = lp.lawsuit_yr) as prop_count,
				lp.lawsuit_yr, l.status, lp.certified_value, l.cause_num,
				lp.adjudged_value, lp.certified_value - lp.adjudged_value as gain_loss,
				case when isnull(ls.inactive_flag,0) = 1 then 'Inactive' else 'Active' end as status_type,
				pp.state_cd, ap.appraiser_nm, isnull(ls.inactive_flag,0) as inactive_flag
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

inner join property_profile as pp
with (nolock)
on lp.prop_id = pp.prop_id
and lp.lawsuit_yr = pp.prop_val_yr

inner join property_val as pv
with (nolock)
on lp.prop_id = pv.prop_id
and lp.lawsuit_yr = pv.prop_val_yr

inner join owner as o
with (nolock)
on lp.prop_id = o.prop_id
and lp.lawsuit_yr = o.owner_tax_yr

inner join account as a
with (nolock)
on o.owner_id = a.acct_id

left outer join lawsuit_status as ls
with (nolock)
on l.status = ls.status_cd

left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id

GO

