
CREATE VIEW levy_cert_levy_data_vw
AS
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
	isNull(levy.timber_assessed_full,0) + isNull((select sum(isNull(timber_assessed_full, 0)) 
										from tax_district_joint 
										where tax_district_id = lcrd.tax_district_id
										and levy_cd = lcrd.levy_cd
										and [year] = lcrd.year), 0) as timber_assessed_full,
	isNull(levy.timber_assessed_half,0) + isNull((select sum(isNull(timber_assessed_half, 0)) 
										from tax_district_joint 
										where tax_district_id = lcrd.tax_district_id
										and levy_cd = lcrd.levy_cd
										and [year] = lcrd.year), 0) as timber_assessed_half,
	isNull(levy.timber_assessed_roll,0) + isNull((select sum(isNull(timber_assessed_roll, 0)) 
										from tax_district_joint 
										where tax_district_id = lcrd.tax_district_id
										and levy_cd = lcrd.levy_cd
										and [year] = lcrd.year), 0) as timber_assessed_roll,
	lcrd.budget_amount,
	lcrd.tax_base,
	lcrd.levy_rate,
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

where not exists(
	select 1 from tif_area_levy tal with(nolock)
	where tal.year = lcrd.year
	and tal.linked_tax_district_id = lcrd.tax_district_id
	and tal.linked_levy_cd = lcrd.levy_cd
)

GO

