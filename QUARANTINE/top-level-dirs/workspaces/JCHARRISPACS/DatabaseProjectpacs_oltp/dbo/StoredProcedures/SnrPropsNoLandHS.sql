


--{call SnrPropsNoLandHS}

CREATE PROCEDURE [dbo].[SnrPropsNoLandHS]

as

select pv.prop_id, p.geo_id, pv.prop_val_yr, ac.file_as_name, pe.exmpt_subtype_cd,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
pv.legal_desc
from property_val pv with (nolock)
inner join prop_supp_assoc psa with (nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
inner join property p with (nolock)
	on p.prop_id = pv.prop_id
	and p.prop_type_cd = 'R'
inner join owner o with (nolock) on
	pv.prop_id = o.prop_id
	and pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num
inner join account ac with (nolock) on
	o.owner_id = ac.acct_id
inner join property_exemption pe with (nolock)
	on pe.prop_id = pv.prop_id
	and pe.owner_tax_yr = pv.prop_val_yr
	and pe.sup_num = pv.sup_num
	and o.owner_id = pe.owner_id
	and exmpt_type_cd like 'SNR%'
INNER JOIN pacs_system ps WITH (nolock) ON
	pv.prop_val_yr = ps.appr_yr
WHERE pv.prop_val_yr = ps.appr_yr
AND pv.prop_inactive_dt is null 
AND not exists (select * from land_detail ld with (nolock)
					   where ld.prop_id = pv.prop_id
					   and ld.prop_val_yr = pv.prop_val_yr
					   and ld.sup_num = pv.sup_num
					   and ld.sale_id = 0
					   and isnull(ld.land_seg_homesite, 'F') = 'T')
--and pv.legal_desc not like '%condo%'
order by p.geo_id

GO

