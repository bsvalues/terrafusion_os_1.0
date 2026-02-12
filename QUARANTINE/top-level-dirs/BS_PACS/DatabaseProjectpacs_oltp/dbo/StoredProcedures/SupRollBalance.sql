

CREATE PROCEDURE SupRollBalance
	@sup_group_id int = NULL,
	@input_entity_ids varchar(2000)= NULL
as

-- Data integrity checks
--
-- 1) Check that the prev_sup_num is correct
-- 2) Check that their is only one primary address record
-- 3) Check that their is only one primary situs address record
-- 4) Check for missing or invalid sup action
-- 5) Check for multiple agent_assoc records with ca_mailings = 'T'
-- 6) Check for properties accepted with recalc_status <> 'C'
-- 7) Check that property_val records exist for all relevant prop_owner_entity_val records
-- 8) Simulate value calculation from sup roll and compare with ones generated
--10) Check that prop_owner_entity_val records exist for all properties in the supplemets
--
-- n) Build a table from property_owner_entity_val with the values that will be produced from totals
-- n) Build a table of values that will be produced by the sup group roll report
SET NOCOUNT ON

-- Drop the local temporary table this procedure uses 
If object_id('tempdb..#tmp')  IS NOT NULL
Begin
	drop table #tmp
End 


-- Delete any records associated with our session id
delete from ##supp_role_balance_assoc where spid = @@SPID
delete from ##supp_role_balance_poev_to_pv where spid = @@SPID
delete from ##supp_role_balance_totals where spid = @@SPID
delete from ##supp_role_balance_pv_to_poev where spid = @@SPID
delete from ##supp_role_balance_entities where spid = @@SPID

-- If both input parameters are null then exit the routine now
IF @sup_group_id IS NULL	AND @input_entity_ids IS NULL 
Begin
	Return(0)
End

-- Put the entity IDs in a table
If @input_entity_ids is not null 
Begin
	declare @sqlEntity varchar(4000)
	set @sqlEntity = 'insert into ##supp_role_balance_entities select entity_id,@@SPID from entity where entity.entity_id in (' + @input_entity_ids + ')'
	execute(@sqlEntity)
End
Else
Begin
	insert into ##supp_role_balance_entities 
	select entity_id,@@SPID from entity
End

-- Step 1) Build a list of properties for the sup group
insert into ##supp_role_balance_assoc
select distinct 
pv.prop_val_yr as year, 
pv.sup_num,
pv.prop_id,
pv.prev_sup_num,
cast (-1 as int) as prev_sup_num_check,
epa.entity_id,
pv.prop_inactive_dt,
sup_action,
case when IsNull(sup_action,'') in ('A','M','D') then 'T' else 'F' end as sup_action_ok,
cast('U' as char(1)) as prev_sup_num_ok,
0,
0,
0,
pv.recalc_flag,
0.0,
0.0,
0.0,
0.0,
0.0,
0.0,
0, -- Simulated values
0,
0,
0,
'F',
'F',
'F',
'',
'F',
@@SPID
from property_val as pv with (NOLOCK) 
inner JOIN supplement as s WITH (NOLOCK) 
on pv.sup_num = s.sup_num AND pv.prop_val_yr = s.sup_tax_yr 
inner join entity_prop_assoc as epa WITH (NOLOCK) 
on pv.prop_id = epa.prop_id AND pv.prop_val_yr = epa.tax_yr 
and (pv.sup_num = epa.sup_num OR pv.prev_sup_num = epa.sup_num) 
inner join ##supp_role_balance_entities as el on
el.entity_id = epa.entity_id
where s.sup_group_id = @sup_group_id and el.spid = @@SPID

-- Update the table with calculated previous sup numbers
update ##supp_role_balance_assoc
set prev_sup_num_check=dv.prev_sup_num_check,
prev_sup_num_ok=case when prev_sup_num is not null and 
dv.prev_sup_num_check=prev_sup_num then 'T' else 'F' end
from ##supp_role_balance_assoc as ps 
inner join 
(
	select
	pga.prop_id,pga.year,max(pv.sup_num) as prev_sup_num_check
	from  ##supp_role_balance_assoc as pga
	inner join property_val as pv on
	pv.prop_id = pga.prop_id
	and pv.prop_val_yr=pga.year
	and pv.sup_num < pga.sup_num
	where pga.spid = @@SPID
	group by pga.prop_id,pga.year

) as dv on ps.prop_id = dv.prop_id and ps.year = dv.year 
where ps.spid = @@SPID


-- Because a previous supplement may not exist in the year layer all  prev_sup_num_check
-- that were not updated will now be set to zero.
update ##supp_role_balance_assoc
set prev_sup_num_check=0
where prev_sup_num_check = -1
and spid = @@SPID

-- Update our prop supp table with the correct previous sup's
-- and set a flag to indicate whether the two prev_sup_num's match
update ##supp_role_balance_assoc
set prev_sup_num_ok=case when prev_sup_num_check is not null and 
prev_sup_num_check=prev_sup_num then 'T' else 'F' end
where spid = @@SPID

-- Update our prop supp table with a count of primary situs records
update ##supp_role_balance_assoc
set primary_situs_cnt = test.cnt
from ##supp_role_balance_assoc ps 
inner join 
(
	select distinct pga.year,pga.prop_id,pga.sup_num,count(*) as cnt
	from ##supp_role_balance_assoc as pga
	inner join situs as s on pga.prop_id = s.prop_id
	where primary_situs='Y' and pga.spid = @@SPID
	group by entity_id,pga.year,pga.prop_id,pga.sup_num
	having count(*) > 1 
) as test on
ps.prop_id = test.prop_id and ps.sup_num=test.sup_num and ps.year = test.year
where ps.spid = @@SPID

-- Update our prop supp table with a count of agent assoc with ca_mailngs='T'
update ##supp_role_balance_assoc
set agent_assoc_with_ca_mailing = test.cnt
from ##supp_role_balance_assoc ps 
inner join 
(
	select distinct pga.year,pga.prop_id,pga.sup_num,o.owner_id,count(*) as cnt
	from ##supp_role_balance_assoc as pga
	inner join owner as o
	on pga.year = o.owner_tax_yr and 
	pga.prop_id = o.prop_id and 
	pga.sup_num = o.sup_num
	inner join agent_assoc as a on o.owner_id = a.owner_id and
	o.prop_id = a.prop_id and
	o.owner_tax_yr = a.owner_tax_yr
	where ca_mailings='T' AND a.exp_dt > GetDate() and spid = @@SPID
	group by entity_id,pga.year,pga.prop_id,o.owner_id,pga.sup_num
	having count(*) > 1 
) as test on
ps.prop_id = test.prop_id and ps.sup_num=test.sup_num and ps.year = test.year
where ps.spid = @@SPID

-- Update our prop supp table with a count of primary address records
update ##supp_role_balance_assoc
set primary_address_cnt = test.cnt
from ##supp_role_balance_assoc ps 
inner join 
(
	select distinct pga.year,pga.prop_id,pga.sup_num,count(*) as cnt
	from ##supp_role_balance_assoc as pga
	inner join owner as o
	on pga.year = o.owner_tax_yr and 
	pga.prop_id = o.prop_id and 
	pga.sup_num = o.sup_num
	inner join address as a on o.owner_id = a.acct_id
	where primary_addr='Y' and pga.spid = @@SPID
	group by entity_id,pga.year,pga.prop_id,pga.sup_num
	having count(*) > 1 
) as test on
ps.prop_id = test.prop_id and ps.sup_num=test.sup_num and ps.year = test.year
where ps.spid = @@SPID


-- Step 3) Query values from prop_owner_entity_val
update ##supp_role_balance_assoc
set curr_taxable_val=case when prop_inactive_dt is null then poev.taxable_val else 0 end,
prev_taxable_val = ppoev.taxable_val,
curr_assessed_val = case when prop_inactive_dt is null then poev.assessed_val else 0 end,
prev_assessed_val = ppoev.assessed_val,
curr_exempt_val = case when prop_inactive_dt is null then poev.exempt_val else 0 end,
prev_exempt_val = ppoev.exempt_val

from ##supp_role_balance_assoc as pga
left outer join prop_owner_entity_val as poev
on poev.prop_id = pga.prop_id and
poev.entity_id = pga.entity_id and
poev.sup_yr = pga.year and 
(poev.sup_num = pga.sup_num or (prop_inactive_dt is not null and 
poev.sup_num=pga.prev_sup_num))


left outer join prop_owner_entity_val as ppoev
on ppoev.sup_yr = pga.year and 
ppoev.sup_num = pga.prev_sup_num  and 
ppoev.prop_id = pga.prop_id and
ppoev.entity_id = pga.entity_id

where pga.spid = @@SPID





-- The table produced from this query is meant to mimic what is produced in the sup roll
-- The values should be compared to those produced above
select
poev.owner_id,
pga.entity_id,
pga.sup_num, 
pga.year, 
pga.prop_id, 
pga.sup_action,
Sum(case when pga.prop_inactive_dt is null then IsNull(poev.taxable_val,0) else 0 end) as curr_taxable_val,
Sum(IsNull(ppoev.taxable_val,0)) as prev_taxable_val,
Sum(case when pga.prop_inactive_dt is null then IsNull(poev.assessed_val,0) else 0 end) as curr_assessed_val,
Sum(IsNull(ppoev.assessed_val,0)) as prev_assessed_val,
Sum(case when pga.prop_inactive_dt is null then IsNull(poev.exempt_val,0) else 0 end) as curr_exempt_val,
Sum(IsNull(ppoev.exempt_val,0)) as prev_exempt_val
into #tmp
from ##supp_role_balance_assoc as pga with(nolock)

left outer join prop_owner_entity_val as poev with(nolock)
on poev.prop_id = pga.prop_id and
poev.entity_id = pga.entity_id and
poev.sup_yr = pga.year and 
(poev.sup_num = pga.sup_num) --or (prop_inactive_dt is not null and 
--poev.sup_num=pga.prev_sup_num))

left outer join prop_owner_entity_val as ppoev with(nolock)
on 
ppoev.sup_yr = pga.year and 
ppoev.sup_num = pga.prev_sup_num  and 
ppoev.prop_id = pga.prop_id and
ppoev.entity_id = pga.entity_id

LEFT OUTER JOIN property_val as pv with(nolock)
ON poev.prop_id = pv.prop_id
AND poev.sup_yr = pv.prop_val_yr
AND poev.sup_num = pv.sup_num

LEFT OUTER JOIN account with(nolock)
ON account.acct_id = poev.owner_id 

--INNER JOIN entity_prop_assoc as epa with(nolock)
--ON poev.prop_id = epa.prop_id
--AND poev.sup_yr = epa.tax_yr
--AND (pga.sup_num = epa.sup_num or pga.prev_sup_num = epa.sup_num)
--AND pga.entity_id = epa.entity_id

--INNER JOIN entity with(nolock)
--ON epa.entity_id = entity.entity_id


--LEFT OUTER JOIN tax_rate with(nolock)
--ON  epa.entity_id = tax_rate.entity_id
--AND epa.tax_yr = tax_rate.tax_rate_yr


--LEFT OUTER JOIN account as entity_account with(nolock)
--ON entity.entity_id = entity_account.acct_id


LEFT OUTER JOIN agent_assoc with(nolock)
ON poev.prop_id = agent_assoc.prop_id
AND poev.owner_id = agent_assoc.owner_id
AND poev.sup_yr = agent_assoc.owner_tax_yr
AND agent_assoc.ca_mailings = 'T'
AND agent_assoc.exp_dt > GetDate() 

LEFT OUTER JOIN account as agent_account with(nolock)
ON agent_assoc.agent_id = agent_account.acct_id

LEFT OUTER JOIN address with(nolock)
ON poev.owner_id = address.acct_id
AND address.primary_addr = 'Y'

where pga.spid = @@SPID and pga.prop_inactive_dt is null --and pga.prop_id=2148402 and pga.year = 2001 and pga.sup_num =13 and pga.entity_id = 519050 
group by pga.entity_id,pga.sup_num, pga.year, pga.prop_id,poev.owner_id,pga.sup_action


insert into #tmp
select
poev.owner_id,
pga.entity_id,
pga.sup_num, 
pga.year, 
pga.prop_id, 
pga.sup_action,
Sum(case when pga.prop_inactive_dt is null then IsNull(poev.taxable_val,0) else 0 end) as curr_taxable_val,
Sum(IsNull(ppoev.taxable_val,0)) as prev_taxable_val,
Sum(case when pga.prop_inactive_dt is null then IsNull(poev.assessed_val,0) else 0 end) as curr_assessed_val,
Sum(IsNull(ppoev.assessed_val,0)) as prev_assessed_val,
Sum(case when pga.prop_inactive_dt is null then IsNull(poev.exempt_val,0) else 0 end) as curr_exempt_val,
Sum(IsNull(ppoev.exempt_val,0)) as prev_exempt_val

from ##supp_role_balance_assoc as pga with(nolock)

left outer join prop_owner_entity_val as poev with(nolock)
on poev.prop_id = pga.prop_id and
poev.entity_id = pga.entity_id and
poev.sup_yr = pga.year and 
poev.sup_num = pga.sup_num 

left outer join prop_owner_entity_val as ppoev with(nolock)
on 
ppoev.sup_yr = pga.year and 
ppoev.sup_num = pga.prev_sup_num  and 
ppoev.prop_id = pga.prop_id and
ppoev.entity_id = pga.entity_id

LEFT OUTER JOIN property_val as pv with(nolock)
ON poev.prop_id = pv.prop_id
AND poev.sup_yr = pv.prop_val_yr
AND poev.sup_num = pv.sup_num

LEFT OUTER JOIN account with(nolock)
ON account.acct_id = poev.owner_id 

--INNER JOIN entity_prop_assoc as epa with(nolock)
--ON ppoev.prop_id = epa.prop_id
--AND ppoev.sup_num = epa.sup_num
--AND ppoev.sup_yr = epa.tax_yr
--AND ppoev.entity_id = epa.entity_id

--INNER JOIN entity with(nolock)
--ON epa.entity_id = entity.entity_id


--LEFT OUTER JOIN tax_rate with(nolock)
--ON  epa.entity_id = tax_rate.entity_id
--AND epa.tax_yr = tax_rate.tax_rate_yr


--LEFT OUTER JOIN account as entity_account with(nolock)
--ON entity.entity_id = entity_account.acct_id


LEFT OUTER JOIN agent_assoc with(nolock)
ON ppoev.prop_id = agent_assoc.prop_id
AND ppoev.owner_id = agent_assoc.owner_id
AND ppoev.sup_yr = agent_assoc.owner_tax_yr
AND agent_assoc.ca_mailings = 'T'
AND agent_assoc.exp_dt > GetDate() 

LEFT OUTER JOIN account as agent_account with(nolock)
ON agent_assoc.agent_id = agent_account.acct_id

LEFT OUTER JOIN address with(nolock)
ON ppoev.owner_id = address.acct_id
AND address.primary_addr = 'Y'

where pga.spid = @@SPID and pga.prop_inactive_dt is not null -- and pga.prop_id=942948 and pga.year = 2002 and pga.sup_num =2 and pga.entity_id = 519006 and pga.sup_action = 'D'
group by pga.entity_id,pga.sup_num, pga.year, pga.prop_id,poev.owner_id,pga.sup_action

-- update with the simulated values
update ##supp_role_balance_assoc
set sim_curr_taxable_val = #tmp.curr_taxable_val,
sim_curr_assessed_val = #tmp.curr_assessed_val,
sim_prev_taxable_val = #tmp.prev_taxable_val,
sim_prev_assessed_val = #tmp.prev_assessed_val
from #tmp
where ##supp_role_balance_assoc.prop_id = #tmp.prop_id
and ##supp_role_balance_assoc.entity_id = #tmp.entity_id
and ##supp_role_balance_assoc.sup_num = #tmp.sup_num
and ##supp_role_balance_assoc.year = #tmp.year
and ##supp_role_balance_assoc.sup_action = #tmp.sup_action


drop table #tmp

-- This table will detect poev records associated with the sup group
-- that have no corresponding pv record
insert into ##supp_role_balance_poev_to_pv
select poev.prop_id,
poev.sup_num,
poev.sup_yr, 
poev.entity_id,
pv.prop_id as pv_prop_id,
case when pv.prop_id is null then 'F' else 'T' end as valid_pv_record,
@@SPID as spid
from prop_owner_entity_val as poev with (NOLOCK) 
inner JOIN supplement as s WITH (NOLOCK) 
on poev.sup_num = s.sup_num AND poev.sup_yr = s.sup_tax_yr 
inner join entity_prop_assoc as epa WITH (NOLOCK) 
on poev.prop_id = epa.prop_id AND 
poev.sup_yr = epa.tax_yr and 
poev.sup_num = epa.sup_num and 
poev.entity_id = epa.entity_id
inner join ##supp_role_balance_entities as el on
el.entity_id = epa.entity_id
left outer join property_val as pv  WITH (NOLOCK) on
poev.prop_id = pv.prop_id and
poev.sup_yr = pv.prop_val_yr and
(poev.sup_num = pv.sup_num or poev.sup_num = pv.prev_sup_num)
where s.sup_group_id = @sup_group_id AND el.spid = @@SPID

delete from ##supp_role_balance_poev_to_pv where pv_prop_id is not null and spid = @@SPID

-- Insert new records for properies where there are no pv records
insert into ##supp_role_balance_assoc
select  
pv.sup_yr, 
pv.sup_num,
pv.prop_id,
0,
0,
pv.entity_id,
NULL,
'M',
'T',
'T',

0,
0,
0,
'C',
0.0,
0.0,
0.0,
0.0,
0.0,
0.0,

0, -- Simulated values
0,
0,
0,
'T', -- No PV Record
'F',
'F',
'',
'F',
@@SPID
from ##supp_role_balance_poev_to_pv as pv
where pv.spid=@@SPID

-- This table will detect pv records associated with the sup group
-- that have no corresponding poev record
insert into ##supp_role_balance_pv_to_poev
select pga.prop_id,
pga.sup_num,
pga.year,
poev.prop_id as poev_prop_id,
case when poev.prop_id is null then 'F' else 'T' end as valid_poev_record,
@@SPID as spid
from ##supp_role_balance_assoc as pga with(nolock)
left outer join prop_owner_entity_val as poev with(nolock) on
poev.prop_id=pga.prop_id and
poev.sup_num=pga.sup_num and
poev.sup_yr=pga.year
where spid = @@SPID


delete from ##supp_role_balance_pv_to_poev where poev_prop_id is not null and spid = @@SPID

-- Set a flag for missing poev records
update ##supp_role_balance_assoc
set no_poev_record='T'
from ##supp_role_balance_pv_to_poev
where ##supp_role_balance_assoc.year = ##supp_role_balance_pv_to_poev.sup_yr and
##supp_role_balance_assoc.sup_num = ##supp_role_balance_pv_to_poev.sup_num and
##supp_role_balance_assoc.prop_id = ##supp_role_balance_pv_to_poev.prop_id and
##supp_role_balance_assoc.spid = ##supp_role_balance_pv_to_poev.spid and
##supp_role_balance_assoc.sup_action <> 'D' and
##supp_role_balance_assoc.spid = @@SPID

-- Step 5) Build a summary table of assessed,taxable, and exemption amounts 
-- from prop_owner_entity_val
insert into ##supp_role_balance_totals
select 
sup_num,
year,
sup_action,
entity_id,
count(*) as cnt,
sum(case when prop_inactive_dt is  null then isnull(curr_assessed_val,0) else 0 end) as curr_assessed_val,
sum(case when prop_inactive_dt is  null then isnull(curr_taxable_val,0) else 0 end) as curr_taxable_val,
sum(case when prop_inactive_dt is  null then isnull(curr_assessed_val,0)-isnull(curr_taxable_val,0) else 0 end) as curr_exempt_val,
sum(isnull(prev_assessed_val,0)) as prev_assessed_val,
sum(isnull(prev_taxable_val,0)) as prev_taxable_val,
sum(isnull(prev_assessed_val,0))-sum(isnull(prev_taxable_val,0)) as prev_exempt_val,
-- Calculate the deltas
sum(case when prop_inactive_dt is  null then isnull(curr_assessed_val,0) else 0 end) -
sum(isnull(prev_assessed_val,0)) as delta_assessed_val,
sum(case when prop_inactive_dt is  null then isnull(curr_taxable_val,0) else 0 end) -
sum(isnull(prev_taxable_val,0)) as delta_taxable_val,
sum(case when prop_inactive_dt is  null then isnull(curr_assessed_val,0)-isnull(curr_taxable_val,0) else 0 end) -
(sum(isnull(prev_assessed_val,0))-sum(isnull(prev_taxable_val,0))) as delta_exempt_val,
@@SPID as spid
from ##supp_role_balance_assoc
where ##supp_role_balance_assoc.spid = @@SPID
group by entity_id,sup_num,year,sup_action
order by entity_id,sup_num,year,sup_action

-- Set the suspect property flag for all tests
update ##supp_role_balance_assoc
set suspect_property = 'T'
where sup_action_ok <> 'T' or 
prev_sup_num_ok <> 'T' or 
primary_situs_cnt > 1 or
primary_address_cnt > 1 or
agent_assoc_with_ca_mailing > 1 or
recalc_flag <> 'C' or
IsNull(curr_taxable_val,0) <> IsNull(sim_curr_taxable_val,0) or
IsNull(curr_assessed_val,0) <> IsNull(sim_curr_assessed_val,0) or
IsNull(prev_taxable_val,0) <> IsNull(sim_prev_taxable_val,0) or
IsNull(prev_assessed_val,0) <> IsNull(sim_prev_assessed_val,0) or
no_poev_record='T' or
no_pv_record = 'T'

update ##supp_role_balance_assoc
set remarks = remarks + 'Recalc flag='+recalc_flag
where recalc_flag <> 'C'

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ',Suspect values' else remarks + 'Suspect values' end
where IsNull(curr_taxable_val,0) <> IsNull(sim_curr_taxable_val,0) or
IsNull(curr_assessed_val,0) <> IsNull(sim_curr_assessed_val,0) or
IsNull(prev_taxable_val,0) <> IsNull(sim_prev_taxable_val,0) or
IsNull(prev_assessed_val,0) <> IsNull(sim_prev_assessed_val,0)

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ',Bad sup action' else remarks + 'Bad sup action' end
where sup_action_ok = 'F' and spid=@@SPID

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ',Bad prev sup num' else remarks + 'Bad prev sup num' end
where prev_sup_num_ok = 'F' and spid=@@SPID

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ',' + convert(varchar(5), primary_situs_cnt) + ' primary situs' else remarks + convert(varchar(5), primary_situs_cnt) + ' primary situs' end
where primary_situs_cnt > 1 and spid=@@SPID

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ',' + convert(varchar(5), agent_assoc_with_ca_mailing) + ' agent assoc with ca_mailings=T' else remarks + convert(varchar(5), agent_assoc_with_ca_mailing) + ' agent assoc with ca_mailings=T' end
where agent_assoc_with_ca_mailing > 1 and spid=@@SPID

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ',' + convert(varchar(5), primary_address_cnt) + ' primary address records' else remarks + convert(varchar(5), agent_assoc_with_ca_mailing) + ' primary address records' end
where primary_address_cnt > 1 and spid=@@SPID

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ', Missing prop_owner_entity_val' else remarks + 'Missing prop_owner_entity_val' end
where no_poev_record = 'T' and spid=@@SPID

update ##supp_role_balance_assoc
set remarks = case when Len(remarks) > 0 then remarks + ', Missing property_val' else remarks + 'Missing property_val' end
where no_pv_record = 'T' and spid=@@SPID

update ##supp_role_balance_assoc
set distinct_flag='F'
where spid = @@SPID

-- Set a distinct flag
update ##supp_role_balance_assoc
set distinct_flag='T'
from ##supp_role_balance_assoc as pga
inner join
(
	select prop_id,sup_num,year,max(entity_id) as entity_id 
	from ##supp_role_balance_assoc 
	where spid = @@SPID
	group by prop_id,sup_num,year
) as pga2 on
pga.prop_id = pga2.prop_id and
pga.sup_num = pga2.sup_num and
pga.year = pga2.year and
pga.entity_id = pga2.entity_id
where spid = @@SPID

GO

