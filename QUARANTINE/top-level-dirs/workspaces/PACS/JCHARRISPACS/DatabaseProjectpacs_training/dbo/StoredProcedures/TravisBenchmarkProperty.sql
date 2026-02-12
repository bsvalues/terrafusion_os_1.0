
CREATE procedure TravisBenchmarkProperty

@prop_id	int,
@sup_num	int,
@prop_val_yr	numeric(4)

as

-- emulate the property lookup
SELECT TOP  100
pv.prop_val_yr as year, pv.prop_id as id, 
CASE WHEN ISNULL(pv.prop_inactive_dt, '') = '' THEN '' ELSE 'D' END as d, 
pt.prop_type_desc as type, 

CASE WHEN ISNULL(o.hs_prop, 'F') = 'F' THEN 'No' ELSE 'Yes' END as hs, 
REPLACE(isnull(s.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs_address, 
ISNULL(pv.legal_desc, '') as legal_desc, 
ISNULL(p.geo_id, '') as geo_id, 
ISNULL(pv.legal_acreage, 0) as legal_acreage, 
ISNULL(pv.eff_size_acres, 0) as effective_size, 
ISNULL(pv.appraised_val, 0) as appraised_val, 
a.acct_id, 
ISNULL(s.situs_num, 0) as situs_num, 
ISNULL(s.situs_street, '') as situs_street, 
ISNULL(p.dba_name, '') as dba_name, 
pv.sup_num 

FROM property_val as pv 
WITH (NOLOCK) 
INNER JOIN prop_supp_assoc as psa 
WITH (NOLOCK) 
ON pv.prop_id = psa.prop_id 
AND pv.prop_val_yr = psa.owner_tax_yr 
AND pv.sup_num = psa.sup_num 

INNER JOIN property as p 
WITH (NOLOCK) 
ON pv.prop_id = p.prop_id 

INNER JOIN property_type as pt 
WITH (NOLOCK) 
ON p.prop_type_cd = pt.prop_type_cd 

LEFT OUTER JOIN situs as s 
WITH (NOLOCK) 
ON pv.prop_id = s.prop_id 
AND s.primary_situs = 'Y' 

INNER JOIN owner as o 
WITH (NOLOCK) 
ON pv.prop_id = o.prop_id 
AND pv.prop_val_yr = o.owner_tax_yr 
AND pv.sup_num = o.sup_num 

INNER JOIN account as a 
WITH (NOLOCK) 
ON o.owner_id = a.acct_id 

WHERE pv.prop_val_yr = @prop_val_yr
and   pv.prop_id     = @prop_id
and   pv.sup_num     = @sup_num




-- property retrieve
select * from property where prop_id = @prop_id
select * from prop_supp_assoc where prop_id = @prop_id and owner_tax_yr = @prop_val_yr
select * from property_val where prop_id = @prop_id and prop_val_yr = @prop_val_yr and sup_num = @sup_num


-- retrieve owner information
declare @owner_id	int
declare owner_cursor scroll cursor 
for select owner_id
from owner 
where prop_id = @prop_id 
and owner_tax_yr = @prop_val_yr 
and sup_num = @sup_num

open owner_cursor
fetch next from owner_cursor into @owner_id

while (@@FETCH_STATUS = 0)
begin
	select * from account where acct_id = @owner_id
	select * from address where acct_id = @owner_id
	select * from phone   where acct_id = @owner_id
	
	select * from property_exemption 
	where prop_id = @prop_id 
	and   owner_id = @owner_id
	and   owner_tax_yr = @prop_val_yr
	and   sup_num = @sup_num

	fetch next from owner_cursor into @owner_id
end

close owner_cursor
deallocate owner_cursor


-- retrieve agent information
declare @agent_id	int
declare agent_cursor scroll cursor 
for select agent_id
from agent_assoc 
where prop_id = @prop_id 
and owner_tax_yr = @prop_val_yr 

open agent_cursor
fetch next from agent_cursor into @agent_id

while (@@FETCH_STATUS = 0)
begin
	select * from account where acct_id = @agent_id
	select * from address where acct_id = @agent_id
	select * from phone   where acct_id = @agent_id
	
	fetch next from agent_cursor into @agent_id
end

close agent_cursor
deallocate agent_cursor


-- retrieve entity information
declare @entity_id 	int
declare entity_cursor scroll cursor 
for select entity_id
from entity_prop_assoc 
where prop_id = @prop_id 
and tax_yr = @prop_val_yr 

open entity_cursor
fetch next from entity_cursor into @entity_id

while (@@FETCH_STATUS = 0)
begin
	select * from entity where entity_id = @entity_id
	select * from account where acct_id = @entity_id
	select * from address where acct_id = @entity_id
	select * from phone   where acct_id = @entity_id
	
	fetch next from entity_cursor into @entity_id
end

close entity_cursor
deallocate entity_cursor

-- retrieve mortgage information
declare @mortgage_id	int
declare mortgage_cursor scroll cursor 
for select mortgage_co_id
from mortgage_assoc 
where prop_id = @prop_id 

open mortgage_cursor
fetch next from mortgage_cursor into @mortgage_id

while (@@FETCH_STATUS = 0)
begin
	select * from account where acct_id = @mortgage_id
	select * from address where acct_id = @mortgage_id
	select * from phone   where acct_id = @mortgage_id
	
	fetch next from mortgage_cursor into @mortgage_id
end

close mortgage_cursor
deallocate mortgage_cursor

-- retrieve situs information
select * from situs where prop_id = @prop_id





-- issue standard update commands

update property set prop_cmnt = 'test @ dell labs'
where prop_id = @prop_id

update property_val set legal_desc = 'test @ dell labs'
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr = @prop_val_yr


update imprv set imprv_desc = 'test @ dell labs'
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr = @prop_val_yr


update land_detail set  land_seg_desc = 'test @ dell labs'
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr = @prop_val_yr

GO

