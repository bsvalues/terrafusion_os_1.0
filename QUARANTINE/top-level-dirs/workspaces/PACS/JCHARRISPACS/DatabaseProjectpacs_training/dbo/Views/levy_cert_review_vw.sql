
CREATE VIEW levy_cert_review_vw
AS
SELECT 
	lcrd.levy_cert_run_id,
	lcrd.[year],
	lcrd.tax_district_id,
	isnull(ll.levy_cd, lcrd.levy_cd) as levy_cd,
	a.file_as_name as tax_district_name,
	tdt.tax_district_desc as tax_district_type,
	isnull(ll_levy.levy_description, levy.levy_description) as levy_description,
	isnull(ll_type.levy_type_desc, lt.levy_type_desc) as levy_type_desc,
	sum(isnull(lcrd.final_levy_rate, 0)) as final_levy_rate,
	sum(isnull(lcrd.final_senior_levy_rate, 0)) as final_senior_levy_rate
FROM levy_cert_run_detail as lcrd with (nolock)
JOIN account as a with (nolock) on
		a.acct_id = lcrd.tax_district_id
JOIN tax_district as td with (nolock) on
		td.tax_district_id = lcrd.tax_district_id
JOIN tax_district_type as tdt with (nolock) on
		tdt.tax_district_type_cd = td.tax_district_type_cd
JOIN levy with (nolock) on
		levy.[year]				= lcrd.[year]
	and levy.tax_district_id	= lcrd.tax_district_id
	and levy.levy_cd			= lcrd.levy_cd
JOIN levy_type as lt with (nolock) on
		lt.levy_type_cd	= levy.levy_type_cd
LEFT JOIN levy_link as ll with (nolock) on
		ll.[year] = levy.[year]
	and ll.tax_district_id = levy.tax_district_id
	and ll.levy_cd_linked = levy.levy_cd
LEFT JOIN levy as ll_levy with (nolock) on
		ll_levy.[year] = ll.[year]
	and ll_levy.tax_district_id = ll.tax_district_id
	and ll_levy.levy_cd = ll.levy_cd
LEFT JOIN levy_type as ll_type with (nolock) on
		ll_type.levy_type_cd = ll_levy.levy_type_cd
GROUP BY
	lcrd.levy_cert_run_id, lcrd.[year], lcrd.tax_district_id,
	isnull(ll.levy_cd, lcrd.levy_cd),
	a.file_as_name,
	tdt.tax_district_desc,
	isnull(ll_levy.levy_description, levy.levy_description),
	isnull(ll_type.levy_type_desc, lt.levy_type_desc)

GO

