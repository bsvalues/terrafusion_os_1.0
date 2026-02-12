
--Populates upv benefit_acres from property_assessment_attribute_val
--this script picks that up values from CPRPMAS.FP_ACRES
--Jefferson 
--2012 MP

--runs in pacs oltp database
/*
	update upv
	set benefit_acre_sum = sumAcres 
	--select *
	from user_property_val upv with (nolock)
	join __propLinks pl with (nolock) on 
	pl.prop_val_yr = upv.prop_val_yr
	and pl.prop_id = upv.prop_id
	join prop_supp_assoc psa with (nolock)
	on psa.owner_tax_yr = upv.prop_val_yr
	and psa.sup_num = upv.sup_num 
	and psa.prop_id = upv.prop_id
	where upv.is_primary = 1
*/
--exec cnv_updatesumbenefitacres 2012,102,'benefit_acre_sum',1



CREATE procedure cnv_updatesumbenefitacres
	@year numeric (4, 0),
	@agencyID int,
	@acresSumFieldName varchar(100),
	@updateIsPrimary bit = 0,
	@primaryFieldName varchar(100) = 'is_primary'
as

set nocount on

declare @sql varchar(max)
declare @sql1 varchar(max)

if exists (select name from sysobjects WHERE id = OBJECT_ID('__propLinks'))
begin
	drop table __propLinks
end

--1. Create A Temp Table 
select distinct 
upv.prop_val_yr,
upv.prop_id, 
o.owner_id,
upv.is_primary,  --select * from user_property_val where prop_id=11792
isNull(upv.benefit_acres, 0) benefit_acres,
cast(0 as numeric(18, 4)) as sumAcres,
cast(0 as bit) as newPrimary, 
case when isNull(paav.benefit_acres, 0) > 50 then cast(1 as bit) 
     else cast(0 as bit) end as excludeFromSum 

into __propLinks

from user_property_val upv with (nolock)
join property_special_assessment psa with (nolock) --select top 2 * from property_special_assessment where prop_id=11792
on psa.year = upv.prop_val_yr
and psa.sup_num = upv.sup_num 
and psa.prop_id = upv.prop_id
join prop_supp_assoc s with (nolock) --select * from prop_supp_assoc where prop_id=11792
on s.owner_tax_yr = psa.year
and s.sup_num = psa.sup_num
and s.prop_id = psa.prop_id
join property_val as pv with (nolock)
on upv.prop_val_yr = pv.prop_val_yr
and upv.sup_num = pv.sup_num
and upv.prop_id = pv.prop_id
join owner o with (nolock)
on o.owner_tax_yr = s.owner_tax_yr
and o.sup_num = s.sup_num
and o.prop_id = s.prop_id
join property_assessment_attribute_val paav with (nolock)
on paav.prop_val_yr = s.owner_tax_yr
and paav.sup_num = s.sup_num
and paav.prop_id = s.prop_id
where psa.agency_id = @agencyID 
and upv.prop_val_yr = @year
and pv.prop_inactive_dt is null
and isnull(pv.prop_state, '') <> 'P'


--select top 20 * from __propLinks where prop_id=11792
--select * from user_property_val where prop_id=11792
--select * from property_assessment_attribute_val where prop_id=11792


--2. Update the temp table's new primary flag 
update pl
set newPrimary = 1
from __propLinks pl with (nolock)
join (	select min(prop_id) prop_id, owner_id, prop_val_yr 
		from __propLinks p with (nolock) 
		where benefit_acres = (	select max(isNull(benefit_acres, 0)) from __propLinks l
								where l.owner_id = p.owner_id
								and l.prop_Val_yr = p.prop_val_yr
								and excludeFromSum = 0)
		and excludeFromSum = 0
		group by owner_id, prop_val_yr) id on
id.owner_id = pl.owner_id
and id.prop_val_yr = pl.prop_val_yr
and id.prop_id = pl.prop_id
where excludeFromSum = 0

-- If the acres exceed 50, then the primary flag should be set to 1 because the property
-- will not be grouped in with any other properties

update pl
set newPrimary = 1
--select top 10 * 
from __propLinks pl with (nolock)
where excludeFromSum = 1

--3. Update the sum acres field
update pl
set pl.sumAcres = l.sumAcres
--select top 2 l.*
from __propLinks pl with (nolock)
join (	select sum(isNull(benefit_acres, 0)) sumAcres, owner_id, prop_Val_yr
		from __propLinks with (nolock)
		where excludeFromSum = 0
		group by owner_id, prop_Val_yr) l
on l.owner_id = pl.owner_id 
and l.prop_val_yr = pl.prop_val_yr
and excludeFromSum = 0

-- If the acres exceed 50, then the sum acre should be set to the benefit acres because the property
-- will not be grouped in with any other properties
update pl
set pl.sumAcres = benefit_acres
--select top 10 * 
from __propLinks pl with (nolock)
where excludeFromSum = 1

--4. Update the fields
if (@updateIsPrimary = 1)
begin
set @sql1 = '
	update upv
	set ' + @primaryFieldName + ' = newPrimary '
	+ ' from user_property_val upv with (nolock)
	join __propLinks pl with (nolock) on 
	pl.prop_val_yr = upv.prop_val_yr
	and pl.prop_id = upv.prop_id
	join prop_supp_assoc psa with (nolock)
	on psa.owner_tax_yr = upv.prop_val_yr
	and psa.sup_num = upv.sup_num 
	and psa.prop_id = upv.prop_id
	'
end
else 
begin
	set @sql1 = ''
end

set @sql = @sql1 + '
	update upv
	set ' + @acresSumFieldName + ' = sumAcres' + 
	' from user_property_val upv with (nolock)
	join __propLinks pl with (nolock) on 
	pl.prop_val_yr = upv.prop_val_yr
	and pl.prop_id = upv.prop_id
	join prop_supp_assoc psa with (nolock)
	on psa.owner_tax_yr = upv.prop_val_yr
	and psa.sup_num = upv.sup_num 
	and psa.prop_id = upv.prop_id
	where upv.' + @primaryFieldName + ' = 1'

print @sql

exec (@sql)

--select * from __propLinks where prop_id=11792
--select * from user_property_val where prop_id=11792
--select * from cnv_src_jefferson..cprpmas where exempt_tp='deleted'   --rp_parcel in('0000210','0000001')
--select distinct exempt_tp from cnv_src_jefferson..cprpmas




SET ANSI_NULLS ON

GO

