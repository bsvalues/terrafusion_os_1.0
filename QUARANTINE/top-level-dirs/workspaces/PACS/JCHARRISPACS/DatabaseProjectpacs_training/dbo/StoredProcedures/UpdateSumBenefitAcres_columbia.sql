
CREATE PROCEDURE [dbo].[UpdateSumBenefitAcres_columbia]
      @year numeric (4, 0),
      @agencyID int,
      @acresSumFieldName varchar(100),
      @updateIsPrimary bit = 0,					----change this to 1 to update the is_primary flags
      @primaryFieldName varchar(100) = 'upv.is_primary'
AS
      set nocount on
declare @sql varchar(max)
declare @sql1 varchar(max)

if exists (select name from sysobjects WHERE id = OBJECT_ID('#propLinks'))
begin
      drop table #propLinks
end

--1. Create A Temp Table 
select distinct						---929
upv.prop_val_yr, upv.prop_id, 
o.owner_id, upv.is_primary, 
isNull(paav.benefit_acres, 0) benefit_acres, cast(0 as numeric(18, 4)) as sumAcres,
cast(0 as bit) as newPrimary, 
case when isNull(paav.benefit_acres, 0) > 50 then cast(1 as bit) 
else cast(0 as bit) end as excludeFromSum 
into #propLinks
from user_property_val upv with (nolock)
join property_special_assessment psa with (nolock)
on psa.year = upv.prop_val_yr
and psa.sup_num = upv.sup_num 
and psa.prop_id = upv.prop_id
join prop_supp_Assoc s with (nolock)
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
where psa.agency_id = @agencyid 
and upv.prop_val_yr = @year
and pv.prop_inactive_dt is null
and isnull(pv.prop_state, '') <> 'P'



--2. Update the temp table's new primary flag 
update pl
set newPrimary = 1
from #propLinks pl with (nolock)
join (      select min(prop_id) prop_id, owner_id, prop_val_yr 
            from #propLinks p with (nolock) 
            where benefit_acres = ( select max(isNull(benefit_acres, 0)) from #propLinks l
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
from #propLinks pl with (nolock)
where excludeFromSum = 1

--3. Update the sum acres field
update pl
set pl.sumAcres = l.sumAcres
from #propLinks pl with (nolock)
join (      select sum(isNull(benefit_acres, 0)) sumAcres, owner_id, prop_Val_yr
            from #propLinks with (nolock)
            where excludeFromSum = 0
            group by owner_id, prop_Val_yr) l
on l.owner_id = pl.owner_id 
and l.prop_val_yr = pl.prop_val_yr
and excludeFromSum = 0

-- If the acres exceed 50, then the sum acre should be set to the benefit acres because the property
-- will not be grouped in with any other properties
update pl
set pl.sumAcres = benefit_acres
from #propLinks pl with (nolock)
where excludeFromSum = 1

--4. Update the fields
if (@updateIsPrimary = 1)
begin
set @sql1 = '
      update upv
      set ' + @primaryFieldName + ' = newPrimary '
      + ' from user_property_val upv with (nolock)
      join #propLinks pl with (nolock) on 
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
      join #propLinks pl with (nolock) on 
      pl.prop_val_yr = upv.prop_val_yr
      and pl.prop_id = upv.prop_id
      join prop_supp_assoc psa with (nolock)
      on psa.owner_tax_yr = upv.prop_val_yr
      and psa.sup_num = upv.sup_num 
      and psa.prop_id = upv.prop_id
      where ' + @primaryFieldName + ' = 1'

exec (@sql)

GO

