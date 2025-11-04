
create view chg_of_owner_prop_vw
as
select
	coopa.chg_of_owner_id, 
	coopa.prop_id,     
	psa.sup_num,     
	coopa.sup_tax_yr,
	pt.prop_type_desc,
	pv.legal_desc,
	bPrimary = isnull(coopa.bPrimary, 0)
from chg_of_owner_prop_assoc as coopa
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on coopa.sup_tax_yr = psa.owner_tax_yr
and coopa.prop_id = psa.prop_id
join property_val as pv
with (nolock)
on psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num
and psa.prop_id = pv.prop_id
join property as p
with (nolock)
on pv.prop_id = p.prop_id
join property_type as pt
with (nolock)
on p.prop_type_cd = pt.prop_type_cd

GO

