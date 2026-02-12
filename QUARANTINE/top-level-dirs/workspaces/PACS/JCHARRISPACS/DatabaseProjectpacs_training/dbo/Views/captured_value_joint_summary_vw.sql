
CREATE VIEW captured_value_joint_summary_vw
AS

select
	v.captured_value_run_id,
	v.year,
	v.tax_district_id,
	td.tax_district_desc as tax_district_name,
	v.levy_cd,
	l.levy_description,
	v.real_pers_value,
	v.state_value,
	v.senior_value,
	v.annex_value,
	v.new_const_value,
	v.taxable_value,
	tif.tif_taxable_value,
	tif.tif_base_value,
	tif.tif_new_const_value,
	tif.tif_state_value,
	tif.tif_senior_taxable_value,
	tif.tif_senior_base_value,
	tif.tif_senior_new_const_value,
	tif.tif_prev_state_value

from
(
	select
		cv.captured_value_run_id, cv.[year], cv.tax_district_id, cv.levy_cd,
		sum(cv.real_pers_value)	as real_pers_value,
		sum(cv.state_value) as state_value,
		sum(cv.state_value_annex) as state_value_annex,
		sum(cv.senior_value) as senior_value,
		sum(cv.annex_value) as annex_value,
		sum(cv.new_const_value) as new_const_value,
		sum(cv.taxable_value) as taxable_value,
		sum(cv.exempted_senior_value) as exempted_senior_value
	from captured_value cv with(nolock)
	where isnull(cv.is_joint_district_value, 0) = 1
	group by cv.captured_value_run_id, cv.[year], cv.tax_district_id, cv.levy_cd
)v

join tax_district td with(nolock)
	on td.tax_district_id = v.tax_district_id
join levy l with(nolock)
	on l.year = v.year
	and l.tax_district_id = v.tax_district_id
	and l.levy_cd = v.levy_cd

outer apply (
	select 
		sum(cvt.tif_taxable_value) tif_taxable_value, 
		sum(cvt.tif_base_value) tif_base_value, 
		sum(cvt.tif_new_const_value) tif_new_const_value, 
		sum(cvt.tif_state_value) tif_state_value,
		sum(cvt.tif_senior_taxable_value) tif_senior_taxable_value,
		sum(cvt.tif_senior_base_value) tif_senior_base_value,
		sum(cvt.tif_senior_new_const_value) tif_senior_new_const_value,
		sum(cvt.tif_prev_state_value) tif_prev_state_value
	from captured_value_tif cvt with(nolock)
	where cvt.captured_value_run_id = v.captured_value_run_id
	and cvt.[year] = v.[year]
	and cvt.tax_district_id = v.tax_district_id
	and cvt.levy_cd = v.levy_cd
) tif

GO

