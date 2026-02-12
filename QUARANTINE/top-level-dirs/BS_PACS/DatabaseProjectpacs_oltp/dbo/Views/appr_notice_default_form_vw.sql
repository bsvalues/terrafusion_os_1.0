

create view dbo.appr_notice_default_form_vw
as
select
	anf.szDefaultForm as form_name,
	case
		when ps.default_appr_notice_form = anf.szDefaultForm then cast(1 as bit)
		else cast(0 as bit)
	end as default_form,
	anf.lSequence as sequence
from
	appr_notice_format as anf with (nolock)
inner join
	pacs_system as ps with (nolock)
on
	ps.system_type in ('A', 'B')

GO

