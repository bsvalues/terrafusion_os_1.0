

create view pp_rendition_prop_penalty_changes_vw as

-- This view gathers all the pp_rendition_prop_penalty records that meet either of the 2 following conditions:
-- 1. 	late_rendition_penalty_flag = 1
-- 2. 	late_rendition_penalty_flag = 0 for the current supplemnt, but late_rendition_penalty_flag = 1 
--		for the previous supplement

select 
	curr_penalty_data.* 
from 
	pp_rendition_prop_penalty as curr_penalty_data with (nolock)
where 
	curr_penalty_data.late_rendition_penalty_flag = 1

union

select 
	curr_penalty_data.* 

from
	(
		select 
			prev_sup_data.prop_id,
			prev_sup_data.owner_id,
			prev_sup_data.rendition_year,
			max(prev_sup_data.sup_num) as sup_num
		from
			(
				select 
					prop_id,
					owner_id,
					rendition_year,
					max(sup_num) as sup_num
				from 
					pp_rendition_prop_penalty with (nolock)
				group by 
					prop_id, 
					owner_id, 
					rendition_year
			) as curr_sup

		inner join 
			pp_rendition_prop_penalty as prev_sup_data with (nolock)
		on 
				prev_sup_data.prop_id = curr_sup.prop_id 
			and prev_sup_data.owner_id = curr_sup.owner_id
			and prev_sup_data.rendition_year = curr_sup.rendition_year
			and prev_sup_data.sup_num <> curr_sup.sup_num

		group by 
			prev_sup_data.prop_id, 
			prev_sup_data.owner_id, 
			prev_sup_data.rendition_year
	) as prev_penalty

inner join 
	pp_rendition_prop_penalty as prev_penalty_data with (nolock)
on 
		prev_penalty_data.prop_id = prev_penalty.prop_id 
	and prev_penalty_data.owner_id = prev_penalty.owner_id
	and prev_penalty_data.rendition_year = prev_penalty.rendition_year
	and prev_penalty_data.sup_num = prev_penalty.sup_num

inner join
	(
		select 
			prop_id,
			owner_id,
			rendition_year,
			max(sup_num) as sup_num
		from 
			pp_rendition_prop_penalty with (nolock)
		group by 	
			prop_id,
			owner_id,
			rendition_year
	) as curr_penalty
on 
		prev_penalty.prop_id = curr_penalty.prop_id
	and prev_penalty.owner_id = curr_penalty.owner_id
	and prev_penalty.rendition_year = curr_penalty.rendition_year

inner join 
	pp_rendition_prop_penalty as curr_penalty_data with (nolock)
on 
		curr_penalty_data.prop_id = curr_penalty.prop_id 
	and curr_penalty_data.owner_id = curr_penalty.owner_id
	and curr_penalty_data.rendition_year = curr_penalty.rendition_year
	and curr_penalty_data.sup_num = curr_penalty.sup_num

where 
		prev_penalty_data.late_rendition_penalty_flag = 1
	and curr_penalty_data.late_rendition_penalty_flag = 0

GO

