
CREATE VIEW levy_cert_highest_lawful_levy_history
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
		WHEN lcrd.[year] between levy.[year] 
			and (levy.[year] + levy.election_term - 1) THEN
						isnull(lchll.lid_lift_levy, 0)
		ELSE			isnull(lchll.highest_lawful_levy, 0)
		END
	END AS highest_lawful_levy
FROM levy_cert_run_detail AS lcrd WITH (NOLOCK)
JOIN levy WITH (NOLOCK) ON 
		levy.[year]				< lcrd.[year]
	and levy.tax_district_id	= lcrd.tax_district_id
	and levy.levy_cd			= lcrd.levy_cd
JOIN levy_cert_hl_limit AS lchll WITH (NOLOCK) ON
		lchll.[year]			= levy.[year]
	and lchll.tax_district_id	= levy.tax_district_id
	and lchll.levy_cd			= lchll.levy_cd

GO

