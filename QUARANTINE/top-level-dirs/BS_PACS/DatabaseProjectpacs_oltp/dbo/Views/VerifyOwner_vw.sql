
create view VerifyOwner_vw
as
select pv.prop_id,pv.prop_val_yr as year, pv.sup_num,p.ref_id2,legal_desc,
0 as owner_id, 0 as entity_id, 'MIS_OWN' as check_cd, 0 as ic_ref_id
from property_val as pv with(nolock)
left outer join owner as o with(nolock) on
pv.prop_val_yr=o.owner_tax_yr and 
pv.prop_id=o.prop_id and
pv.sup_num=o.sup_num
inner join property as p with(nolock) on
pv.prop_id = p.prop_id
where o.owner_id is null

GO

