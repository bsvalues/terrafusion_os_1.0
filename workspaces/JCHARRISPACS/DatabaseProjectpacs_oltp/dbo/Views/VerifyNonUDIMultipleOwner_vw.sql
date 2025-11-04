


create view VerifyNonUDIMultipleOwner_vw
as
select 	pv.prop_id  ,
	pv.prop_val_yr as year,
	pv.sup_num ,
	0 as owner_id,
	0 as entity_id,
	'NUDI_MLTOW' as check_cd,
	0 as ic_ref_id
from property_val as pv with(nolock)
where 
isnull(udi_parent,'') = '' 
and prop_inactive_dt is null
and exists (
	select ow1.prop_id, ow1.owner_tax_yr, ow1.sup_num from owner as ow1
	inner join owner as ow2
	on ow1.prop_id = ow2.prop_id
	and ow1.owner_tax_yr = ow2.owner_tax_yr
	and ow1.sup_num = ow2.sup_num
	and ow1.owner_id <> ow2.owner_id
	where ow1.prop_id = pv.prop_id
	and ow1.owner_tax_yr = pv.prop_val_yr
	and ow1.sup_num = pv.sup_num
)

GO

