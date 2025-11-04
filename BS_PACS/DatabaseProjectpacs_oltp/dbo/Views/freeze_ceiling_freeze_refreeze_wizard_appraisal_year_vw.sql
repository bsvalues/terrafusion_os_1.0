

create view freeze_ceiling_freeze_refreeze_wizard_appraisal_year_vw
as


select
	ps.system_type,
	last_yr.tax_yr as freeze_ceiling_yr
from
	pacs_system as ps with (nolock)
inner join
	pacs_year as curr_yr with (nolock)
on
	curr_yr.tax_yr = ps.appr_yr
and	curr_yr.certification_dt is null
inner join
	pacs_year as last_yr with (nolock)
on
	last_yr.tax_yr = (curr_yr.tax_yr - 1)
and	last_yr.certification_dt is not null
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

