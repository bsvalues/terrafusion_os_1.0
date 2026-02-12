
create procedure DeletedPropertyReportDataGenerator

	@dataset_id int,
	@year numeric(4,0),
	@begin_date datetime,
	@end_date datetime
	
as

insert ##deleted_property_report
(dataset_id, [year], prop_id, prop_inactive_dt, file_as_name, reason)

select @dataset_id, pv.prop_val_yr, pv.prop_id, pv.prop_inactive_dt,
	a.file_as_name, e.event_desc
from property_val as pv
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num
and pv.prop_id = psa.prop_id
join owner as o
with (nolock)
on pv.prop_val_yr = o.owner_tax_yr
and pv.sup_num = o.sup_num
and pv.prop_id = o.prop_id
join account as a
with (nolock)
on o.owner_id = a.acct_id
left outer join 
(
	select pea.prop_id, max(pea.event_id) as event_id
	from prop_event_assoc as pea
	with (nolock)
	join event as e
	with (nolock)
	on pea.event_id = e.event_id
	and e.event_type = 'DELPROP'
	group by pea.prop_id
) as t
on pv.prop_id = t.prop_id
left outer join event as e
with (nolock)
on t.event_id = e.event_id
where pv.prop_val_yr = @year
and pv.prop_inactive_dt >= @begin_date
and pv.prop_inactive_dt <= @end_date

GO

