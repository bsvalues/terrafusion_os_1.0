

create procedure CASSExportMT
@Command int,
@Year int
as

if ((@Command = 0) or (@Command = 2))
begin
declare @new_zip char(10)
declare @new_cass char(10)
declare @new_route char(10)

set @new_zip = ''
set @new_cass = ''
set @new_route = ''

-- Command 0 returns all rows. Command 2 returns 1 row
if (@Command = 2)
begin
set rowcount 1
end
else
begin
set nocount on
end


select distinct
cast(o.owner_id as char(10)) as owner_id,
cast(o.owner_tax_yr as char(4)) as owner_appr_yr,
cast(oa.file_as_name as char(50)) as file_as_name,
cast(a.addr_type_cd as char(1)) as addr_type_cd,
cast(a.addr_line1 as char(50)) as addr_line1,
cast(a.addr_line2 as char(50)) as addr_line2,
cast(a.addr_line3 as char(50)) as addr_line3,
cast(a.addr_city as char(50)) as addr_city,
cast(a.addr_state as char(2)) as addr_state,
cast(a.zip as char(10)) as zip,
cast(a.cass as char(10)) as cass,
cast(a.route as char(10)) as route,
@new_zip as new_zip,
@new_cass as new_cass,
@new_route as new_route
from
property_val as pv with (nolock)
inner join
owner as o with (nolock)
on
o.prop_id = pv.prop_id
and o.owner_tax_yr = pv.prop_val_yr
and o.sup_num = pv.sup_num
inner join
account as oa with (nolock)
on
oa.acct_id = o.owner_id
inner join
address as a with (nolock)
on
a.acct_id = oa.acct_id
and a.primary_addr = 'Y'
and isnull(a.is_international, 0) = 0
where
pv.prop_val_yr = @Year
and pv.prop_inactive_dt is null
end
else if (@Command = 1) -- return the number of records in the query
begin
select
count(distinct(o.owner_id)) as NumRecords
from
property_val as pv with (nolock)
inner join
owner as o with (nolock)
on
o.prop_id = pv.prop_id
and o.owner_tax_yr = pv.prop_val_yr
and o.sup_num = pv.sup_num
inner join
account as oa with (nolock)
on
oa.acct_id = o.owner_id
inner join
address as a with (nolock)
on
a.acct_id = oa.acct_id
and a.primary_addr = 'Y'
and isnull(a.is_international, 0) = 0
where
pv.prop_val_yr = @Year
and pv.prop_inactive_dt is null
end

GO

