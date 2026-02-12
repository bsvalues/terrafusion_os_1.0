
create view dor_report_stratification_ioll_vw

as

	select *
	from dor_report_stratification with(nolock)
	where is_ioll = 1

GO

