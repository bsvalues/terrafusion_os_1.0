
CREATE VIEW levy_cert_highest_lawful_levy_history_vw
AS
SELECT 
	lcrd.levy_cert_run_id, 
	lcrd.[year],
	lcrd.tax_district_id,
	lcrd.levy_cd,
	levy.[year] AS levy_year,
	CASE isnull(lchll.lid_lift, 0)
	WHEN 0 THEN			isnull(lchll.highest_lawful_levy, 0)
	WHEN 1 THEN
		CASE 
		WHEN (isnull(levy.election_term, 0) = 0) or 
				(lcrd.[year] between levy.[year] and (levy.[year] + isnull(levy.election_term, 0) - 1)) 
			THEN isnull(lchll.lid_lift_levy, 0)
			ELSE isnull(lchll.highest_lawful_levy, 0)
		END
	END AS highest_lawful_levy,
	lchll.highest_lawful_levy highest_lawful_levy_nolift

FROM levy_cert_run WITH (NOLOCK)
JOIN levy_cert_run_detail AS lcrd WITH (NOLOCK) ON
		lcrd.levy_cert_run_id	= levy_cert_run.levy_cert_run_id
JOIN levy WITH (NOLOCK) ON 
		levy.[year]				< lcrd.[year]
	and levy.tax_district_id	= lcrd.tax_district_id
	and levy.levy_cd			= lcrd.levy_cd
JOIN levy_cert_run_detail as lcrd_in_use with (nolock) on
		lcrd_in_use.[year]			= levy.[year]
	and lcrd_in_use.tax_district_id	= levy.tax_district_id
	and lcrd_in_use.levy_cd			= levy.levy_cd
JOIN levy_cert_hl_limit AS lchll WITH (NOLOCK) ON
		lchll.levy_cert_run_id  = lcrd_in_use.levy_cert_run_id
	and lchll.[year]			= lcrd_in_use.[year]
	and lchll.tax_district_id	= lcrd_in_use.tax_district_id
	and lchll.levy_cd			= lcrd_in_use.levy_cd
JOIN levy_cert_run as lcr_in_use with (nolock) on 
		lcr_in_use.[year]			= lcrd_in_use.[year]
	and lcr_in_use.levy_cert_run_id	= lcrd_in_use.levy_cert_run_id
	and lcr_in_use.[status]			not in ('Coding', 'Cancelled')

GO

