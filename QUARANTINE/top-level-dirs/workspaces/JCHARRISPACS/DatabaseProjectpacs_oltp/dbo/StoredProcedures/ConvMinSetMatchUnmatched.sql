
CREATE  PROCEDURE ConvMinSetMatchUnmatched
AS
--
-- This procedure is used to match imported mineral owners and properties to existing accoutns
--  Osvaldo Morales - 5/20/2001
--
set nocount off

-- Reset matching information to ensure there are no problems after file is transfered to site.
update mineral_owner_cv set acct_id = 0, new = null, acct_create_dt = null
update mineral_property_cv set owner_id = 0, prop_id = 0, new = null, prop_create_dt = null
update mineral_entity_cv set entity_id = 0, prop_id = 0, owner_id = 0
update mineral_exemption_cv set prop_id = 0, owner_id = 0
update mineral_sp_ent_ex_cv set entity_id = 0, prop_id = 0, owner_id = 0
---------------------------------------------------------------------------------
--
-- Match imported mineral owners to existing owners based on owner_number provided

update mineral_owner_cv set acct_id = account.acct_id
from account
where mineral_owner_cv.source = account.source
and mineral_owner_cv.owner_no = account.ref_id1

-- Assign new account ids to UNMATCHED mineral owners
set nocount on
declare @next_account_id int
declare @owner_no varchar(20)
select @next_account_id = (select next_account_id + 100 from next_account_id)

declare MINS scroll cursor
for select owner_no from mineral_owner_cv where acct_id = 0 order by owner_no

open MINS
fetch next from MINS into @owner_no

while (@@fetch_status = 0)
begin
	update mineral_owner_cv set acct_id = @next_account_id, acct_create_dt = getdate(), new = 'T'
	where owner_no = @owner_no

	select @next_account_id = @next_account_id + 1
	fetch next from MINS into @owner_no
end

close MINS
deallocate MINS

update next_account_id set next_account_id = @next_account_id + 1

------------------------------------------------------------------------------
-- 
-- Now update owner_id on mineral_property_cv
set nocount off
update mineral_property_cv set owner_id = mineral_owner_cv.acct_id
from mineral_owner_cv 
where mineral_owner_cv.owner_no = mineral_property_cv.owner_no

-- Now MATCH imported mineral property to existing property based on geo_id

update mineral_property_cv set prop_id = property.prop_id
from property
where mineral_property_cv.geo_id = property.geo_id


-- Now assign new prop ids to UNMATCHED property
set nocount on
declare @next_property_id int
declare @xref varchar(20)

declare MINS scroll cursor
for select xref from mineral_property_cv where prop_id = 0 order by xref

open MINS
fetch next from MINS into @xref

while (@@fetch_status = 0)
begin
	exec dbo.GetUniqueID 'property', @next_property_id output, 1, 0

	update mineral_property_cv set prop_id = @next_property_id, prop_create_dt = getdate(), new='T'
	where xref = @xref

	fetch next from MINS into @xref
end

close MINS
deallocate MINS

--------------------------------------------------------------------------------------------------------------------------
-- Now link mineral_entity_cv, mineral_exemption_cv and mineral_sp_ent_ex_cv to
-- mineral_property_cv based on XREF

-- Set entity_id on mineral_entity_cv
set nocount off
update mineral_entity_cv set entity_id = entity.entity_id
from entity
where mineral_entity_cv.entity_code = entity.appr_company_entity_cd

-- Link mineral_entity_cv to mineral_property_cv based on xref
update mineral_entity_cv set
prop_id = mineral_property_cv.prop_id,
owner_id = mineral_property_cv.owner_id
from mineral_entity_cv, mineral_property_cv
where mineral_entity_cv.xref = mineral_property_cv.xref

-- Link mineral_exemption_cv to mineral_property_cv based on xref
update mineral_exemption_cv set
prop_id = mineral_property_cv.prop_id,
owner_id = mineral_property_cv.owner_id
from mineral_exemption_cv, mineral_property_cv
where mineral_exemption_cv.xref = mineral_property_cv.xref

-- Set entity_id on mineral_sp_ent_ex_cv
update mineral_sp_ent_ex_cv set entity_id = entity.entity_id
from entity
where mineral_sp_ent_ex_cv.entity_code = entity.appr_company_entity_cd

-- Link mineral_sp_ent_ex_cv to mineral_property_cv based on xref
update mineral_sp_ent_ex_cv set
prop_id = mineral_property_cv.prop_id,
owner_id = mineral_property_cv.owner_id
from mineral_sp_ent_ex_cv, mineral_property_cv
where mineral_sp_ent_ex_cv.xref = mineral_property_cv.xref

---------------------------------------------------------------------------------------------------------------
-- Display Counts
set nocount off

select 
sum(case when new <> 'T' then 0 else 1 end) as Matched_Owners,
sum(case when new = 'T' then 1 else 0 end) as New_Owners,
sum(case when acct_id = 0 then 1 else 0 end) as Unmatched_Owners
from mineral_owner_cv

select 
sum(case when new = 'T' then 0 else 1 end) as Matched_Property,
sum(case when new = 'T' then 1 else 0 end) as New_Property,
sum(case when prop_id = 0 then 1 else 0 end) as Unmatched_Property
from mineral_property_cv


-- Display matching errors
select count(*) as props_no_owner_id from mineral_property_cv where owner_id = 0
select count(*) as unlinked_entities from mineral_entity_cv where prop_id = 0
select count(*) as unmatched_entity_codes from mineral_entity_cv where entity_id = 0
select count(*) as unlinked_exemptions  from mineral_exemption_cv where prop_id = 0
select count(*) as unlinked_sp_ex  from mineral_sp_ent_ex_cv where prop_id = 0
select count(*) as unmatched_entity_codes from mineral_sp_ent_ex_cv where entity_id = 0

GO

