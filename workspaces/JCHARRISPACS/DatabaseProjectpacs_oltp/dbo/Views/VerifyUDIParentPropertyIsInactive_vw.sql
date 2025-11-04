


create view VerifyUDIParentPropertyIsInactive_vw
as
select 	pv.prop_id  ,
	pv.prop_val_yr as year,
	pv.sup_num  ,
	0 as owner_id,
	0 as entity_id,
	'UDI_PINACT' as check_cd,
	0 as ic_ref_id
from property_val as pv with(nolock)
where isnull(udi_parent,'') <> '' and prop_inactive_dt is null

GO

