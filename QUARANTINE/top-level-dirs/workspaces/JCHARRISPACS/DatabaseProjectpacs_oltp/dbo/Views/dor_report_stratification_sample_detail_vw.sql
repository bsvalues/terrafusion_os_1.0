
create view dor_report_stratification_sample_detail_vw

as

	select *
	from dor_report_stratification with(nolock)
	where is_sample = 1

GO

