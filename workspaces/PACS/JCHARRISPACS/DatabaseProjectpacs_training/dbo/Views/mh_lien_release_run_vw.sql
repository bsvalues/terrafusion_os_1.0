



create view dbo.mh_lien_release_run_vw
as
select
	mhlrr.run_id,
	mhlrr.release_date,
	mhlrr.pacs_user_id,
	isnull(pu.pacs_user_name, '') as pacs_user_name,
	mhlrr.year_option,
	count(*) as num_releases
from
	dbo.mh_lien_release_run as mhlrr with (nolock)
left outer join
	dbo.pacs_user as pu with (nolock)
on
	pu.pacs_user_id = mhlrr.pacs_user_id
left outer join
	dbo.mh_lien_release_run_detail as mhlrrd with (nolock)
on
	mhlrrd.run_id = mhlrr.run_id
group by
	mhlrr.run_id,
	mhlrr.release_date,
	mhlrr.pacs_user_id,
	isnull(pu.pacs_user_name, ''),
	mhlrr.year_option

GO

