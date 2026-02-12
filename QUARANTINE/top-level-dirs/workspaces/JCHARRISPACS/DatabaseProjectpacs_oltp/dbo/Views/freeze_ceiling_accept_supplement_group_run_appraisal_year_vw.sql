

create view freeze_ceiling_accept_supplement_group_run_appraisal_year_vw
as


select
	ps.system_type,
	ps.appr_yr as freeze_ceiling_yr
from
	pacs_system as ps with (nolock)
inner join
	pacs_year as curr_yr with (nolock)
on
	curr_yr.tax_yr = ps.appr_yr
where
	ps.system_type in ('A', 'B')


union


select
	ps.system_type,
	max(py.tax_yr) as freeze_ceiling_yr
from
	pacs_system as ps with (nolock)
inner join
	pacs_year as py with (nolock)
on
	py.tax_yr >= isnull(ps.tax_yr, 0)
where
	ps.system_type = 'C'
group by
	ps.system_type

GO

