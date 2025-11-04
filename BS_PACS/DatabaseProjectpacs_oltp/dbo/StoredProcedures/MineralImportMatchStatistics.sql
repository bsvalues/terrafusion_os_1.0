



create  procedure MineralImportMatchStatistics
	@run_id int
as

declare @matched_agent_count int
declare @unmatched_agent_count int

select
	@matched_agent_count = sum(case when isnull(mia.new, 'F') = 'T' then 0 else 1 end),
	@unmatched_agent_count = sum(case when isnull(mia.new, 'F') = 'T' then 1 else 0 end)
from
	mineral_import_agent as mia with (nolock)
where
	mia.run_id = @run_id


declare @matched_owner_count int
declare @unmatched_owner_count int

select
	@matched_owner_count = sum(case when isnull(mio.new, 'F') = 'T' then 0 else 1 end),
	@unmatched_owner_count = sum(case when isnull(mio.new, 'F') = 'T' then 1 else 0 end)
from
	mineral_import_owner as mio with (nolock)
where
	mio.run_id = @run_id


declare @matched_property_count int
declare @unmatched_property_count int

select
	@matched_property_count = sum(case when isnull(mip.new, 'F') = 'T' then 0 else 1 end),
	@unmatched_property_count = sum(case when isnull(mip.new, 'F') = 'T' then 1 else 0 end)
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id


declare @unmatched_entity_count int

select
	@unmatched_entity_count = count(*)
from
	mineral_import_entity as mie with (nolock)
inner join
	mineral_import as mi with (nolock)
on
	mi.run_id = mie.run_id 
left outer join
	mineral_import_entity_map as miem with (nolock)
on
	miem.year = mi.year
and	miem.appr_company_id = mi.appr_company_id
and	miem.appr_company_entity_cd = mie.entity_code
where
	mie.run_id = @run_id
and	mie.entity_def = 1
and	miem.year is null


declare @unmatched_special_entity_exemption_count int

select
	@unmatched_special_entity_exemption_count = count(*)
from
	mineral_import_special_entity_exemption as misee with (nolock)
inner join
	mineral_import as mi with (nolock)
on
	mi.run_id = misee.run_id 
left outer join
	mineral_import_entity_map as miem with (nolock)
on
	miem.year = mi.year
and	miem.appr_company_id = mi.appr_company_id
and	miem.appr_company_entity_cd = misee.entity_code
where
	misee.run_id = @run_id
and	misee.entity_def = 1
and	miem.year is null




select
	@run_id as run_id,
	isnull(@matched_agent_count, 0) as matched_agent_count,
	isnull(@unmatched_agent_count, 0) as unmatched_agent_count,
	isnull(@matched_owner_count, 0) as matched_owner_count,
	isnull(@unmatched_owner_count, 0) as unmatched_owner_count,
	isnull(@matched_property_count, 0) as matched_property_count,
	isnull(@unmatched_property_count, 0) as unmatched_property_count,
	isnull(@unmatched_entity_count, 0) as unmatched_entity_count,
	isnull(@unmatched_special_entity_exemption_count, 0) as unmatched_special_entity_exemption_count

GO

