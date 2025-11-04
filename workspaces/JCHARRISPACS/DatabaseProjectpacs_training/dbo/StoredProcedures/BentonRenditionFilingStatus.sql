




CREATE PROCEDURE [dbo].[BentonRenditionFilingStatus]

@appr  int


as


select distinct
pv.prop_id,
pv.prop_val_yr,
p.geo_id,
ac.file_as_name as 'Owner Name',
isnull(e.event_desc,'Did Not Print') as 'Rendition Printed',
isnull(ppr.filing_status,'') as 'Rendition Filing Status',
a.appraiser_full_name as review_appraiser,
convert(varchar(20),pv.reviewed_dt,101) as review_date,
convert(varchar(20),e.event_date, 101) as event_date

from property_val as pv with (nolock)

inner join owner as o with (nolock)
	on pv.prop_id = o.prop_id
	and pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num
	
inner join property as p with (nolock)
	on pv.prop_id = p.prop_id
	and p.prop_type_cd = 'P'

inner join account as ac with (nolock)
	on o.owner_id = ac.acct_id

left outer join pers_prop_rendition as ppr with (nolock)
	on pv.prop_id = ppr.prop_id
	and pv.prop_val_yr = ppr.rendition_year

left outer join prop_event_assoc as pea with (nolock)
	on pv.prop_id = pea.prop_id

left outer join event as e with (nolock)
	on pea.event_id = e.event_id

left outer join appraiser as a with (nolock)
	on pv.reviewed_appraiser = a.appraiser_id

where pv.prop_val_yr =  @appr
and pv.prop_inactive_dt is null
and isnull(e.event_type,'') = 'Rendition'
and isnull(pv.sub_type,'') <> 'UPP'
and year(e.event_date) = pv.prop_val_yr

GO

