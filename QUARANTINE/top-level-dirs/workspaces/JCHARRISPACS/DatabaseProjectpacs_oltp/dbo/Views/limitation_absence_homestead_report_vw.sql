
CREATE VIEW limitation_absence_homestead_report_vw

as

select pe.prop_id, p.geo_id, a.file_as_name, pv.legal_desc,
		LTRIM(REPLACE(isnull(s.situs_display, ''), CHAR(13) + CHAR(10), ' ')) as situs,
		pe.absent_expiration_date, pe.absent_comment
from property_exemption as pe
with (nolock)
join property as p
with (nolock)
on pe.prop_id = p.prop_id
join property_val as pv
with (nolock)
on pe.prop_id = pv.prop_id
and pe.exmpt_tax_yr = pv.prop_val_yr
and pe.sup_num = pv.sup_num
and pv.prop_inactive_dt is null
join prop_supp_assoc as psa
with (nolock)
on pe.prop_id = psa.prop_id
and pe.exmpt_tax_yr = psa.owner_tax_yr
and pe.sup_num = psa.sup_num
join account as a
with (nolock)
on pe.owner_id = a.acct_id
join pacs_system as ps
with (nolock)
on pe.exmpt_tax_yr = ps.appr_yr
join situs as s
on pe.prop_id = s.prop_id
and s.primary_situs = 'Y'
where pe.exmpt_type_cd = 'HS'
and pe.absent_flag = 1

GO

