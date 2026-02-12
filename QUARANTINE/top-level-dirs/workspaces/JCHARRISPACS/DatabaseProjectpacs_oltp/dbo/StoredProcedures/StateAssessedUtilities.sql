

CREATE PROCEDURE [dbo].[StateAssessedUtilities]

@appr  int

as

Select distinct
pv.prop_id,
p.geo_id,
pv.dor_value as 'Utility Value',
(wpov.taxable_classified + wpov.taxable_non_classified) as 'Taxable Value',
a.file_as_name,
pv.property_use_cd,
pst.property_sub_desc as 'Utility Type',
dbo.fn_GetPrimaryOwnerAddress(o.owner_id,o.owner_tax_yr,o.sup_num) as 'Address',
tca.tax_area_number,
pv.legal_desc,
pv.prop_inactive_dt,
isnull(pe.exmpt_type_cd,'') as 'Exemption Type',
pv.prop_val_yr,
pv.sup_num

from property_val as pv

inner join prop_supp_assoc as psa with (nolock)
	on pv.prop_id = psa.prop_id
	and pv.sup_num = psa.sup_num
	and pv.prop_val_yr = psa.owner_tax_yr

inner join property as p with (nolock)
	on pv.prop_id = p.prop_id

inner join owner as o with (nolock)
	on pv.prop_id = o.prop_id
	and pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num

inner join account as a with (nolock)
	on o.owner_id = a.acct_id

inner join wash_prop_owner_tax_area_assoc as taa with (nolock)
	on pv.prop_id = taa.prop_id
	and pv.prop_val_yr = taa.[year]
	and pv.sup_num = taa.sup_num

inner join wash_prop_owner_val as wpov with (nolock)
	on pv.prop_id = wpov.prop_id
	and pv.sup_num = wpov.sup_num
	and pv.prop_val_yr = wpov.[year]

left outer join property_exemption as pe with (nolock)
	on pv.prop_id = pe.prop_id
	and pv.prop_val_yr = pe.owner_tax_yr
	and pv.sup_num = pe.sup_num

left outer join tax_area as tca with (nolock)
	on taa.tax_area_id = tca.tax_area_id

left outer join [address] as ad with (nolock)
	on a.acct_id = ad.acct_id

left outer join property_sub_type as pst with (nolock)
	on pv.sub_type = pst.property_sub_cd

where pv.prop_val_yr = @appr
and isnull(pst.state_assessed_utility, 0) = 1
order by 2

GO

