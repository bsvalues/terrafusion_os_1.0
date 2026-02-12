
CREATE PROCEDURE ValidateEventMapping
	@dataset_id int = -1,
	@validate_vendor_mapping bit = 0
AS

-- NOTE: Validation of Vendor Event Mapping will be added after the IPR.  
-- Jeremy Wilson, Feb. 27, 2008
DECLARE @validation_failed bit
SET @validation_failed = 0

SET NOCOUNT ON

-- Collect data for Tax District Levy Funds to Validate
SELECT	'Tax District Levy Fund' as panel_object_type,
		td.tax_district_desc 
		+ ' - ' + tmp.levy_cd + ' (' + l.levy_description + ') - ' 
		+ tmp.fund_description as title, 
		tmp.*, fefa.fin_account_id, fefa.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_fund
FROM (
	SELECT f.*, fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM fund AS f, fin_event_code AS fec WITH (NOLOCK)
	WHERE fec.event_panel_cd IN ('TAXBILL', 'TAXDISB', 'TAXCOLL', 'TAXREF')
) AS tmp
JOIN tax_district AS td WITH (NOLOCK) ON 
		td.tax_district_id = tmp.tax_district_id
JOIN levy AS l WITH (NOLOCK) ON
		l.[year] = tmp.[year]
	AND l.tax_district_id = tmp.tax_district_id
	AND l.levy_cd = tmp.levy_cd
LEFT JOIN fin_event_fund_assoc AS fefa WITH (NOLOCK) ON
		fefa.[year] = tmp.[year]
	AND fefa.tax_district_id = tmp.tax_district_id
	AND fefa.levy_cd = tmp.levy_cd
	AND fefa.fund_id = tmp.fund_id
	AND fefa.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = fefa.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, fefa.action


-- Collect data for Special Assessments to validate
SELECT	'Special Assessments' as panel_object_type,
		saa.assessment_cd + ' (' + saa.assessment_description + ')' as title, 
		tmp.*, feaa.fin_account_id, feaa.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_sa
FROM (
	SELECT sa.[year], sa.agency_id, fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM special_assessment AS sa, fin_event_code AS fec WITH (NOLOCK)
	WHERE fec.event_panel_cd IN ('SABILL', 'SADISB', 'SACOLL', 'SAREF')
) AS tmp
JOIN special_assessment_agency AS saa WITH (NOLOCK) ON 
		saa.agency_id = tmp.agency_id
LEFT JOIN fin_event_assessment_assoc AS feaa WITH (NOLOCK) ON
		feaa.[year] = tmp.[year]
	AND feaa.agency_id = tmp.agency_id
	AND feaa.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = feaa.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, feaa.action


-- Collect data for Fee Types to validate
SELECT	'Fee Types' as panel_object_type,
		tmp.fee_type_cd + ' (' + tmp.fee_type_desc + ')' as title, 
		tmp.*, fefta.fin_account_id, fefta.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_fee
FROM (
	SELECT cast(NULL as decimal(4,0)) as [year], f.fee_type_cd, f.fee_type_desc, 
		fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM fee_type AS f, fin_event_code AS fec WITH (NOLOCK)
	WHERE fec.event_panel_cd IN ('FEECOLDIST', 'FEEREF')
) AS tmp
LEFT JOIN fin_event_fee_type_assoc AS fefta WITH (NOLOCK) ON
		fefta.fee_type_cd = tmp.fee_type_cd
	AND fefta.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = fefta.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, fefta.action


-- Collect data for Escrow Types to validate
SELECT	'Escrow Types' as panel_object_type,
		tmp.escrow_type_cd + ' (' + tmp.escrow_type_desc + ')' as title, 
		tmp.*, feeta.fin_account_id, feeta.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_escrow
FROM (
	SELECT et.[year], et.escrow_type_cd, et.escrow_type_desc, 
		fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM escrow_type AS et, fin_event_code AS fec WITH (NOLOCK)
	WHERE fec.event_panel_cd = 'ESCCOLDIST'
) AS tmp
LEFT JOIN fin_event_escrow_assoc AS feeta WITH (NOLOCK) ON
		feeta.[year] = tmp.[year]
	AND feeta.escrow_type_cd = tmp.escrow_type_cd
	AND feeta.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = feeta.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, feeta.action


-- Collect data for Overpayment Credit to validate
SELECT	'Overpayment Credits' as panel_object_type,
		'General' as title, 
		tmp.*, feoca.fin_account_id, feoca.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_opc
FROM (
	SELECT cast(NULL as decimal(4,0)) as [year], fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM fin_event_code AS fec WITH (NOLOCK)
	WHERE fec.event_panel_cd IN ('OPCCOLDIST', 'OPCREF')
) AS tmp
LEFT JOIN fin_event_overpmt_credit_assoc AS feoca WITH (NOLOCK) ON
		feoca.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = feoca.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, feoca.action


-- Collect data for Refund Types to validate
SELECT	'Refund Types' as panel_object_type,
		tmp.refund_type_cd + ' (' + tmp.refund_reason + ')' as title, 
		tmp.*, ferta.fin_account_id, ferta.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_refund
FROM (
	SELECT rt.[year], rt.refund_type_cd, rt.refund_reason, 
		fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM refund_type AS rt, fin_event_code AS fec WITH (NOLOCK)
	WHERE fec.event_panel_cd = 'RefundType' AND rt.interest_check = 1
) AS tmp
LEFT JOIN fin_event_refund_type_assoc AS ferta WITH (NOLOCK) ON
		ferta.[year] = tmp.[year]
	AND ferta.refund_type_cd = tmp.refund_type_cd
	AND ferta.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = ferta.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, ferta.action


-- Collect data for REET Rates to validate
SELECT	'REET Rates' as panel_object_type,
		tmp.reet_rate_desc + ' - ' + tmp.urban_growth_desc + ' - ' + tmp.description as title, 
		tmp.*, ferra.fin_account_id, ferra.action, 
		fa.account_number, fa.account_description, fat.account_type_description, fa.active
INTO #temp_reet
FROM (
	SELECT cast(NULL as decimal(4,0)) as [year], rr.reet_rate_id, rr.tax_district_id,
		rr.description as reet_rate_desc, rr.rate_type_cd, ugc.urban_growth_cd, 
		ugc.urban_growth_desc, rruda.description,
		fec.event_cd, fec.event_description, fec.event_panel_cd
	FROM fin_event_code AS fec WITH (NOLOCK), reet_rate AS rr WITH (NOLOCK)
	JOIN reet_rate_uga_assoc AS rrua WITH (NOLOCK) ON
		rrua.reet_rate_id = rr.reet_rate_id AND rrua.tax_district_id = rr.tax_district_id
	JOIN urban_growth_code AS ugc WITH (NOLOCK) ON
		ugc.urban_growth_cd = rrua.uga_indicator_cd
	JOIN reet_rate_uga_desc_assoc AS rruda WITH (NOLOCK) ON
			rruda.reet_rate_id = rrua.reet_rate_id 
		AND rruda.tax_district_id = rrua.tax_district_id
		AND rruda.uga_indicator_cd = rrua.uga_indicator_cd
	WHERE fec.event_panel_cd = 'REETCOLL'
) AS tmp
LEFT JOIN fin_event_reet_rate_assoc AS ferra WITH (NOLOCK) ON
		ferra.reet_rate_id = tmp.reet_rate_id
	AND ferra.tax_district_id = tmp.tax_district_id
	AND ferra.uga_indicator_cd = tmp.urban_growth_cd
	AND ferra.description = tmp.description
	AND ferra.event_cd = tmp.event_cd
LEFT JOIN fin_account AS fa WITH (NOLOCK) ON
		fa.fin_account_id = ferra.fin_account_id
LEFT JOIN fin_account_type AS fat WITH (NOLOCK) ON
		fat.account_type_cd = fa.account_type_cd
ORDER BY tmp.[year], title, tmp.event_cd, ferra.action


IF @dataset_id > -1
BEGIN
	-- check for events mapped to an inactive account
	INSERT INTO ##fin_rpt_deactivated_account
	(dataset_id, [year], panel_object_type, title, event_description, account_number, account_type_description, account_description)
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_fund WHERE active = 0
	UNION
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_sa WHERE active = 0
	UNION
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_fee WHERE active = 0
	UNION
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_escrow WHERE active = 0
	UNION
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_opc WHERE active = 0
	UNION
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_refund WHERE active = 0
	UNION
	SELECT DISTINCT 
		@dataset_id AS dataset_id, 
		[year],
		panel_object_type, 
		title, 
		event_cd + ' (' + event_description + ')' as event_description, 
		account_number, 
		account_type_description, 
		account_description
	FROM #temp_reet WHERE active = 0

	IF EXISTS (SELECT * FROM ##fin_rpt_deactivated_account WHERE dataset_id = @dataset_id)
	BEGIN
		SET @validation_failed = 1
	END

	-- check for unequal number of debits and credits or events with no account mapped
	INSERT INTO ##fin_rpt_missing_event_mapping
	(dataset_id, [year], panel_object_type, title, event_description, debit_entry_count, credit_entry_count)
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_fund
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_fund
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.[year] = debit_counts.[year]
		AND credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	UNION
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_sa
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_sa
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.[year] = debit_counts.[year]
		AND credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	UNION
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_fee
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_fee
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	UNION
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_escrow
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_escrow
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.[year] = debit_counts.[year]
		AND credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	UNION
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_opc
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_opc
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	UNION
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_refund
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_refund
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.[year] = debit_counts.[year]
		AND credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	UNION
	SELECT distinct 
		@dataset_id AS dataset_id, 
		debit_counts.[year], 
		debit_counts.panel_object_type,
		debit_counts.title,
		debit_counts.event_description,
		debit_counts.debit_entry_count,
		credit_counts.credit_entry_count
	FROM (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
		FROM #temp_reet
		WHERE isnull(action, 0) = 0
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS debit_counts
	JOIN (
		SELECT DISTINCT  
			[year],
			panel_object_type, 
			title, 
			event_cd + ' (' + event_description + ')' as event_description, 
			sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
		FROM #temp_reet
		WHERE isnull(action, 1) = 1
		GROUP BY [year], panel_object_type, title, event_cd, event_description
	) AS credit_counts ON
			credit_counts.panel_object_type = debit_counts.panel_object_type
		AND credit_counts.title = debit_counts.title
		AND credit_counts.event_description = debit_counts.event_description
	WHERE	debit_counts.debit_entry_count = 0 
		OR  credit_counts.credit_entry_count = 0
		OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

	IF EXISTS (SELECT * FROM ##fin_rpt_missing_event_mapping WHERE dataset_id = @dataset_id)
	BEGIN
		SET @validation_failed = 1
	END

end
else
begin
	IF EXISTS (
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_fund WHERE active = 0 
		UNION
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_sa WHERE active = 0 
		UNION
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_fee WHERE active = 0 
		UNION
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_escrow WHERE active = 0 
		UNION
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_opc WHERE active = 0 
		UNION
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_refund WHERE active = 0 
		UNION
		SELECT DISTINCT 
			[year], panel_object_type, title, event_cd + ' (' + event_description + ')' as event_description, 
			account_number, account_type_description, account_description
		FROM #temp_reet WHERE active = 0 
	)
	BEGIN
		set @validation_failed = 1
	END

	IF EXISTS (
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_fund
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_fund
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.[year] = debit_counts.[year]
			AND credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

		UNION
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_sa
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_sa
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.[year] = debit_counts.[year]
			AND credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

		UNION
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_fee
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_fee
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

		UNION
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_escrow
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_escrow
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.[year] = debit_counts.[year]
			AND credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

		UNION
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_opc
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_opc
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count

		UNION
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_refund
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_refund
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.[year] = debit_counts.[year]
			AND credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count
		
		UNION
		SELECT DISTINCT debit_counts.[year], debit_counts.panel_object_type,
			debit_counts.title, debit_counts.event_description, debit_counts.debit_entry_count,
			credit_counts.credit_entry_count
		FROM (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as debit_entry_count
			FROM #temp_reet
			WHERE isnull(action, 0) = 0
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS debit_counts
		JOIN (
			SELECT DISTINCT [year], panel_object_type, title, 
				event_cd + ' (' + event_description + ')' as event_description, 
				sum(case when fin_account_id is null then 0 else 1 end) as credit_entry_count
			FROM #temp_reet
			WHERE isnull(action, 1) = 1
			GROUP BY [year], panel_object_type, title, event_cd, event_description--, action
		) AS credit_counts ON
				credit_counts.panel_object_type = debit_counts.panel_object_type
			AND credit_counts.title = debit_counts.title
			AND credit_counts.event_description = debit_counts.event_description
		WHERE	debit_counts.debit_entry_count = 0 
			OR  credit_counts.credit_entry_count = 0
			OR  debit_counts.debit_entry_count <> credit_counts.credit_entry_count
	)
	BEGIN
		set @validation_failed = 1
	END
	
end

SET NOCOUNT OFF
SELECT @validation_failed AS validation_failed

drop table #temp_fund
drop table #temp_sa
drop table #temp_fee
drop table #temp_escrow
drop table #temp_opc
drop table #temp_refund
drop table #temp_reet

GO

