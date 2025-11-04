
create view VerifyPropertiesHaveEntities_vw
as
-- Query to detect no entity properties
select 
	pv.prop_val_yr as year, 
	pv.prop_id,
	pv.sup_num,
	pv.prop_inactive_dt,
	pv.udi_parent,
	0 as owner_id,
	0 as entity_id,
	'HAS_ENTITY' as check_cd,
	0 as ic_ref_id
from property_val as pv with(nolock)
left outer join entity_prop_assoc as epa with(nolock) on
pv.prop_val_yr=epa.tax_yr and
pv.prop_id=epa.prop_id and
pv.sup_num=epa.sup_num

-- Get the maximum suplement number for the year
--inner join (
--	select prop_val_yr,prop_id,max(sup_num) as max_sup_num
--	from property_val as pv with(nolock) 
--	group by prop_val_yr,prop_id
--	) as pvi on 

--pv.prop_val_yr = pvi.prop_val_yr and
--pv.prop_id = pvi.prop_id and
--pv.sup_num = pvi.max_sup_num

inner join property as p with(nolock) on
pv.prop_id=p.prop_id

where 
isnull(reference_flag,'F') = 'F' 
and 
isnull(pv.udi_parent,'F')='F' 
and epa.prop_id is null
and prop_inactive_dt is null

GO

