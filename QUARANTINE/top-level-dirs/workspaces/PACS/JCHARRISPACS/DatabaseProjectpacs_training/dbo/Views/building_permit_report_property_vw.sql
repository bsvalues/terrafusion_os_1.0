
create view building_permit_report_property_vw
as

select
pbpa.bldg_permit_id as permit_id,
p.prop_id,
psa.owner_tax_yr,
p.prop_type_cd,
a.file_as_name as owner_name,
pv.legal_desc,
pv.map_id,
pv.abs_subdv_cd,
p.other,
pv.appraised_val

from prop_building_permit_assoc pbpa

inner join property p
on pbpa.prop_id = p.prop_id

inner join prop_supp_assoc psa
on p.prop_id = psa.prop_id

inner join property_val pv
on psa.prop_id = pv.prop_id
and psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num

left outer join owner
on psa.prop_id = owner.prop_id
and psa.owner_tax_yr = owner.owner_tax_yr
and psa.sup_num = owner.sup_num

left outer join account a
on owner.owner_id = a.acct_id

GO

