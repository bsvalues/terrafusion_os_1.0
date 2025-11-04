
create view VerifyMultPrimarySitus_vw
as
select 	
	situs.prop_id, 
	pv.prop_val_yr as year,
	pv.sup_num,
	0 as owner_id,
	0 as entity_id,
	0 as ic_ref_id,
	'MULT_SITUS' as check_cd,
	cnt
from situs
inner join 
(	SELECT 
	prop_id,
	0 as year,
	0 as sup_num,
	0 as owner_id,
	0 as entity_id,
	0 as ic_ref_id,
	'MULT_SITUS' as check_cd,
	count(*) as cnt
	from situs
	where primary_situs = 'Y'
	group by prop_id
) as s
on s.prop_id = situs.prop_id
inner join property_val as pv
on pv.prop_id = situs.prop_id
where cnt > 1
group by situs.prop_id, s.cnt,pv.prop_val_yr, pv.sup_num

GO

