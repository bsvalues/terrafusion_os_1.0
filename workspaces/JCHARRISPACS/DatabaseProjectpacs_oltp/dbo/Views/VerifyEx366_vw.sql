
create view VerifyEx366_vw
as
select 
	pv.prop_id,
	pv.prop_val_yr as year,
	pv.sup_num,
	0 as owner_id,
	0 as entity_id,
	0 as ic_ref_id,
	'EX366>500' as check_cd
from property_exemption as pe with(nolock)
inner join property_val as pv with(nolock) 
on pe.prop_id = pv.prop_id
and pe.owner_tax_yr = pv.prop_val_yr
and pe.exmpt_tax_yr = pv.prop_val_yr
and pe.sup_num = pv.sup_num
where pe.exmpt_type_cd = 'EX366' and pv.assessed_val > 500

GO

