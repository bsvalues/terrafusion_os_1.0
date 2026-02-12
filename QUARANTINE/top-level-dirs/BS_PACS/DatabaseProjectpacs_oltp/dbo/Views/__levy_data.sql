	create view __levy_data as 
	
	SELECT 
	lcrd.levy_cert_run_id, 
	lcrd.[year],
	lcrd.tax_district_id,
	td.tax_district_desc as tax_district_name,
	lcrd.levy_cd,
	levy.levy_description,
	levy.levy_type_cd,
	levy_type.levy_type_desc,
	levy.voted,
	lcrd.budget_amount,
	lcrd.tax_base,
	lcrd.levy_rate,
	lcrd.final_levy_rate,
	lcrd.outstanding_item_cnt
	FROM levy_cert_run_detail as lcrd with (nolock)
JOIN levy with (nolock) on
		levy.[year]				= lcrd.[year]
	and levy.tax_district_id	= lcrd.tax_district_id
	and levy.levy_cd			= lcrd.levy_cd
JOIN levy_type with (nolock) on
		levy_type.levy_type_cd	= levy.levy_type_cd
JOIN tax_district as td with (nolock) on
		td.tax_district_id = lcrd.tax_district_id

GO

