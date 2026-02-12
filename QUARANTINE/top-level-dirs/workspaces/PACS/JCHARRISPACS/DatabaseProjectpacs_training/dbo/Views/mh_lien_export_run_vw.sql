



create view dbo.mh_lien_export_run_vw
as
select
	mhler.run_id,
	mhler.export_date,
	mhler.pacs_user_id,
	isnull(pu.pacs_user_name, '') as pacs_user_name,
	mhler.year_option,
	count(*) as num_liens
from
	dbo.mh_lien_export_run as mhler with (nolock)
left outer join
	dbo.pacs_user as pu with (nolock)
on
	pu.pacs_user_id = mhler.pacs_user_id
left outer join
	dbo.mh_lien_export_run_detail as mhlerd with (nolock)
on
	mhlerd.run_id = mhler.run_id
group by
	mhler.run_id,
	mhler.export_date,
	mhler.pacs_user_id,
	isnull(pu.pacs_user_name, ''),
	mhler.year_option

GO

