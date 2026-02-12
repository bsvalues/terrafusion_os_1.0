
create view mineral_import_typickett_utility_entity_vw
as

select 	
	uO1.run_id,
	1 as pct,
	'S' + uN.sch as entity_code,
	uN.geo_id,
	1 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as un with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.sch, ''))) > 0 
 		     
union

select 	
	uO1.run_id,
	1 as pct,
	'W' + uN.wtr as entity_code,
	uN.geo_id,
	2 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.wtr, ''))) > 0			     

union

select 	
	uO1.run_id,
	1 as pct,
	'C' + uN.cty as entity_code,
	uN.geo_id,
	3 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.cty, ''))) > 0			     

union

select 	
	uO1.run_id,
	1 as pct,
	uN.cnty as entity_code,
	uN.geo_id,
	4 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.cnty, ''))) > 0			     

union

select 	
	uO1.run_id,
	1 as pct,
	'm1' + ltrim(rtrim(uN.m1)) as entity_code,
	uN.geo_id,
	5 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.m1, ''))) > 0		     

union
select 	
	uO1.run_id,
	1 as pct,
	'm2' + ltrim(rtrim(uN.m2)) as entity_code,
	uN.geo_id,
	6 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.m2, ''))) > 0	     

union

select 	
	uO1.run_id,
	1 as pct,
	'm3' + ltrim(rtrim(uN.m3)) as entity_code,
	uN.geo_id,
	7 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.m3, ''))) > 0			     

union

select 	
	uO1.run_id,
	1 as pct,
	'm4' + ltrim(rtrim(uN.m4)) as entity_code,
	uN.geo_id,
	8 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.m4, ''))) > 0			     

union

select 	
	uO1.run_id,
	1 as pct,
	'm5' + ltrim(rtrim(uN.m5)) as entity_code,
	uN.geo_id,
	9 as ret_from
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr
and	uN.run_id = uO1.run_id
where
	len(rtrim(isnull(uN.m5, ''))) > 0

GO

