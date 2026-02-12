
create procedure sp_FixPrevSupNumPerSupGroup
	@sup_group_id as int
as

-- This will fix bad prev_sup_num
update property_val
set prev_sup_num = isnull(dpv.prev_sup_num, 0)

from property_val pv with(nolock)

join supplement s with(nolock)
on pv.sup_num = s.sup_num
and pv.prop_val_yr = s.sup_tax_yr 

left join 
(
	select pvi.prop_id, pvi.prop_val_yr, max(ppvi.sup_num) as prev_sup_num
	from property_val pvi with(nolock)

	join supplement s with(nolock) 
	on pvi.sup_num = s.sup_num 
	and pvi.prop_val_yr = s.sup_tax_yr

	join property_val ppvi with(nolock)
	on pvi.prop_id = ppvi.prop_id
	and pvi.prop_val_yr = ppvi.prop_val_yr 

	where ppvi.sup_num < pvi.sup_num
	and ppvi.sup_num between 0 and 32767
	and s.sup_group_id = @sup_group_id
	
	group by pvi.prop_id, pvi.prop_val_yr

) as dpv 
on pv.prop_id = dpv.prop_id
and pv.prop_val_yr = dpv.prop_val_yr 

where s.sup_group_id = @sup_group_id
and dpv.prev_sup_num <> pv.prev_sup_num

GO

