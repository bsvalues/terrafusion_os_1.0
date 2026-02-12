
create view mineral_import_typickett_entity_vw
as 
 

select	
	mO1.run_id,
	case when isnull(S1.prcnt1,0) > 0 then S1.prcnt1 else 1 end as pct,
	'S' + S1.code1 as entity_code,
	mO1.geo_id,
	1 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id  
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0
and	L1.sch = '*'
and	len(rtrim(isnull(S1.code1,''))) > 0 	     

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt2,0) > 0 then S1.prcnt2 else 1 end as pct,
	'S' + S1.code2 as entity_code,
	mO1.geo_id,
	2 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0
and	L1.sch = '*'
and	len(rtrim(isnull(S1.code2,''))) > 0 	

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt3,0) > 0 then S1.prcnt3 else 1 end as pct,
	'S' + S1.code3 as entity_code,
	mO1.geo_id,
	3 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0
and	L1.sch = '*'
and	len(rtrim(isnull(S1.code3,''))) > 0 	

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt4,0) > 0 then S1.prcnt4 else 1 end as pct,
	'S' + S1.code4 as entity_code,
	mO1.geo_id,
	4 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0 
and	L1.sch = '*'
and	len(rtrim(isnull(S1.code4,''))) > 0

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt5,0) > 0 then S1.prcnt5 else 1 end as pct,
	'S' + S1.code5 as entity_code,
	mO1.geo_id,
	5 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0
and	L1.sch = '*'
and	len(rtrim(isnull(S1.code5,''))) > 0 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt6,0) > 0 then S1.prcnt6 else 1 end as pct,
	 'S' + S1.code6 as entity_code,
	mO1.geo_id,
	6 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0
and	L1.sch = '*'
and	len(rtrim(isnull(S1.code6,''))) > 0 

union

select	
	mO1.run_id,
	1 as pct,
	'S' + L1.sch as entity_code,
	mO1.geo_id,
	7 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.sch, ''))) > 0
and	L1.sch <> '*' 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt1,0) > 0 then S1.prcnt1 else 1 end as pct,
	'W' + S1.code1 as entity_code,
	mO1.geo_id,
	8 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease and mO1.run_id = L1.run_id
inner join mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr = '*'
and	len(rtrim(isnull(S1.code1,''))) > 0 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt2,0) > 0 then S1.prcnt2 else 1 end as pct,
	'W' + S1.code2 as entity_code,
	mO1.geo_id,
	9 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr = '*'
and	len(rtrim(isnull(S1.code2,''))) > 0 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt3,0) > 0 then S1.prcnt3 else 1 end as pct,
	'W' + S1.code3 as entity_code,
	mO1.geo_id,
	10 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
	and mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr = '*'
and	len(rtrim(isnull(S1.code3,''))) > 0 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt4,0) > 0 then S1.prcnt4 else 1 end as pct,
	'W' + S1.code4 as entity_code,
	mO1.geo_id,
	11 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr = '*'
and	len(rtrim(isnull(S1.code4,''))) > 0 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt5,0) > 0 then S1.prcnt5 else 1 end as pct,
	'W' + S1.code5 as entity_code,
	mO1.geo_id,
	12 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr = '*'
and	len(rtrim(isnull(S1.code5,''))) > 0 

union

select	
	mO1.run_id,
	case when isnull(S1.prcnt6,0) > 0 then S1.prcnt6 else 1 end as pct,
	'W' + S1.code6 as entity_code,
	mO1.geo_id,
	13 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_S1 as S1 with (nolock)
on
	mO1.lease_nbr = S1.lease
and	mO1.run_id = S1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr = '*'
and	len(rtrim(isnull(S1.code6,''))) > 0 

union

select	
	mO1.run_id,
	1  as pct,
	'W' + L1.wtr,
	mO1.geo_id,
	14 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.wtr, ''))) > 0
and	L1.wtr <> '*' 

union

select	
	mO1.run_id,
	1 as  pct,
	L1.rod as entity_code,
	mO1.geo_id,
	15 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.rod, ''))) > 0

union

select	
	mO1.run_id,
	1  as pct,
	'M1' + rtrim(ltrim(L1.m1)) as entity_code,
	mO1.geo_id,
	16 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.m1, ''))) > 0

union

select	
	mO1.run_id,
	1  as pct,
	'M2' + rtrim(ltrim(L1.m2)) as entity_code,
	mO1.geo_id,
	17 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.m2, ''))) > 0

union

select	
	mO1.run_id,
	1  as pct,
	'M3' + rtrim(ltrim(L1.m3)) as entity_code,
	mO1.geo_id,
	18 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.m3, ''))) > 0

union

select	
	mO1.run_id,
	1  as pct,
	'M4' + rtrim(ltrim(L1.m4)) as entity_code,
	mO1.geo_id,
	19 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.m4, ''))) > 0 

union

select	
	mO1.run_id,
	1 as pct,
	'C' + L1.cty as entity_code,
	mO1.geo_id,
	20 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L1.cty, ''))) > 0

union

select	
	mO1.run_id,
	case when isnull(L2.prcnt1, 0) > 0 then (L2.prcnt1) else 1 end as pct,
	L2.cnty1 as entity_code,
	mO1.geo_id,
	21 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_L2 L2
on
	mO1.lease_nbr = L2.nbr
and	mO1.run_id = L2.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L2.cnty1, ''))) > 0

union

select	
	mO1.run_id,
	case when isnull(L2.prcnt2, 0) > 0 then (L2.prcnt2) else 1 end as pct,
	L2.cnty2 as entity_code,
	mO1.geo_id,
	22 as ret_from
from
	mineral_import_typickett_O1 as mO1 with (nolock)
inner join
	mineral_import_typickett_L1 as L1 with (nolock)
on
	mO1.lease_nbr = L1.lease
and	mO1.run_id = L1.run_id
inner join
	mineral_import_typickett_L2 L2
on
	mO1.lease_nbr = L2.nbr
and	mO1.run_id = L2.run_id
where
	L1.rec_id = 'L1'
and	len(rtrim(isnull(L2.cnty2, ''))) > 0

GO

