
CREATE VIEW captured_value_summary_vw
AS

select
	v.*,
	td.tax_district_desc as tax_district_name,
	levy_data.levy_description,
	isnull(levy_data.timber_assessed_enable,0) as timber_assessed_enable,
	isnull(levy_data.timber_assessed_cd,0) as timber_assessed_cd,
	isnull(levy_data.timber_assessed_full,0) as timber_assessed_full,
	isnull(levy_data.timber_assessed_half,0) as timber_assessed_half,
	levy_data.include_in_levy_certification,
	tif.tif_taxable_value, 
	tif.tif_base_value, 
	tif.tif_new_const_value,
	tif.tif_state_value,
	tif.tif_senior_taxable_value,
	tif.tif_senior_base_value,
	tif.tif_senior_new_const_value,
	tif.tif_prev_state_value,
	t.is_tif_sponsor
from
(
	select
		cv.captured_value_run_id, cv.[year], cv.tax_district_id, cv.levy_cd,
		sum(isnull(cv.real_pers_value,0))	as real_pers_value,
		sum(isnull(cv.state_value,0)) as state_value,
		sum(isnull(cv.state_value_annex,0)) as state_value_annex,
		sum(isnull(cv.senior_value,0)) as senior_value,
		sum(isnull(cv.annex_value,0)) as annex_value,
		sum(isnull(cv.senior_annex_value,0)) as senior_annex_value,
		sum(isnull(cv.new_const_value,0)) as new_const_value,
		sum(isnull(cv.senior_new_const_value,0)) as senior_new_const_value,
		sum(isnull(cv.taxable_value,0)) as taxable_value,
		sum(isnull(cv.exempted_senior_value,0)) as exempted_senior_value,
		sum(isnull(cv.real_value,0)) as real_value,
		sum(isnull(cv.personal_value,0)) as personal_value,
		sum(isnull(cv.senior_real_value,0)) as senior_real_value,
		sum(isnull(cv.senior_personal_value,0)) as senior_personal_value
	from captured_value cv with(nolock)
	group by cv.captured_value_run_id, cv.[year], cv.tax_district_id, cv.levy_cd
)v

join tax_district td with(nolock)
on td.tax_district_id = v.tax_district_id
cross apply (
	select top 1 timber_assessed_enable, timber_assessed_cd, levy_description, include_in_levy_certification, 
		timber_assessed_full, timber_assessed_half, timber_assessed_roll, year, levy_cd 
	from levy with(nolock)
	where levy.year = v.[year]
	and levy.tax_district_id = v.tax_district_id 
	and levy.levy_cd = v.levy_cd
) levy_data 

outer apply (
	select 
		sum(isnull(cvt.tif_taxable_value,0)) tif_taxable_value, 
		sum(isnull(cvt.tif_base_value,0)) tif_base_value, 
		sum(isnull(cvt.tif_new_const_value,0)) tif_new_const_value, 
		sum(isnull(cvt.tif_state_value,0)) tif_state_value,
		sum(isnull(cvt.tif_senior_taxable_value,0)) tif_senior_taxable_value,
		sum(isnull(cvt.tif_senior_base_value,0)) tif_senior_base_value,
		sum(isnull(cvt.tif_senior_new_const_value,0)) tif_senior_new_const_value,
		sum(isnull(cvt.tif_prev_state_value,0)) tif_prev_state_value
	from captured_value_tif cvt with(nolock)
	where cvt.captured_value_run_id = v.captured_value_run_id
	and cvt.[year] = v.[year]
	and cvt.tax_district_id = v.tax_district_id
	and cvt.levy_cd = v.levy_cd
) tif

cross apply ( 
	select convert(bit, case when exists(
		select 1 from tif_area_levy tal with(nolock)
		where tal.year = v.year
		and tal.linked_tax_district_id = v.tax_district_id
		and tal.linked_levy_cd = v.levy_cd
	)
	then 1 else 0 end) is_tif_sponsor
)t

GO

