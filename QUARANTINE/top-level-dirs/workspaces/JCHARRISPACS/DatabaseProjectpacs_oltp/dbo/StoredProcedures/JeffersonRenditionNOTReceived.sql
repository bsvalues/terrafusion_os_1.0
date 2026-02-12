CREATE PROCEDURE [dbo].[JeffersonRenditionNOTReceived]

as

SET NOCOUNT ON

declare @appr_year numeric (4,0)
exec GetApprYear @appr_year output

select 
	ppr.prop_id, 
	max(ppr.rendition_year) as max_rendition_year
into #randy_max_rendition_year 
from pers_prop_rendition as ppr with (nolock)
group by ppr.prop_id

select distinct
	pv.prop_id,
	pv.prop_val_yr,
	p.geo_id as 'Parcel Number',
	ac.file_as_name as 'Owner Name',
	rm.max_rendition_year as 'Last Rendition Year',
	isnull(convert(char(13),ppr.rendition_date,13),'NOT SUBMITTED') as 'Current Rendition Date',
	isnull(ppr.active_flag,'F') as 'Is Current Rendition Active',
	case when
		ppr.filing_status is null then 'NOT SUBMITTED'
		else ppr.filing_status end as 'Current Rendition Status'

from property_val as pv with (nolock)

inner join property as p with (nolock)
	on pv.prop_id = p.prop_id

inner join owner as o with (nolock)
	on pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num
	and pv.prop_id = o.prop_id

inner join account as ac with (nolock)
	on o.owner_id = ac.acct_id
	
left outer join pers_prop_rendition as ppr with (nolock)
	on pv.prop_id = ppr.prop_id
	and pv.prop_val_yr = ppr.rendition_year

left outer join #randy_max_rendition_year as rm with (nolock)
	on p.prop_id = rm.prop_id

where pv.prop_val_yr = @appr_year
and pv.prop_inactive_dt is null
and p.prop_type_cd = 'P'
and isnull(pv.sub_type,'') <> 'UP'
and pv.prop_id not IN (select prop_id
					   from pers_prop_rendition with (nolock)
					   where rendition_year = @appr_year)
order by 3,1

if (object_id('#randy_max_rendition_year') is not null)
begin
      drop table
            #randy_max_rendition_year
end

GO

