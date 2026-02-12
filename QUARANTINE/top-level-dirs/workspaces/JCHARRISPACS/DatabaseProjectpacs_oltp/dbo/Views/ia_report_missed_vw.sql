



CREATE VIEW dbo.ia_report_missed_vw
AS
SELECT DISTINCT TOP 100 PERCENT
	ia.ia_id,
	ISNULL(ia.ia_ref_num, '') AS ref_num,
	dbo.bill.prop_id,
	dbo.account.file_as_name AS contact_name,
	ISNULL(ia.ia_payment_terms, '') AS terms,

	ISNULL(ia.ia_payment_amt, 0) AS payment_amount,
	(
		SELECT MIN(ia_dt_due)
		FROM installment_agreement_schedule ias
		WHERE
			ias.ia_id = ia.ia_id AND
			ias.ia_dt_due < GETDATE() AND
			(
				ias.ia_dt_pd IS NULL OR
				( ISNULL(ias.ia_amt_pd, 0) < ISNULL(ias.ia_amt_due, 0) )
			)
	) AS first_missed_date,

	(
		SELECT MAX(ia_dt_due)
		FROM installment_agreement_schedule ias
		WHERE
			ias.ia_id = ia.ia_id AND
			ias.ia_dt_due < GETDATE() AND
			(
				ias.ia_dt_pd IS NULL OR
				( ISNULL(ias.ia_amt_pd, 0) < ISNULL(ias.ia_amt_due, 0) )
			)
	) AS last_missed_date,
	ISNULL(
		(SELECT SUM(ias.ia_amt_due)
		FROM installment_agreement_schedule ias
		WHERE
			ias.ia_id = ia.ia_id),
	0) AS total_due
	,
	ISNULL(
		(
		SELECT COUNT(ias.ia_dt_due)
		FROM installment_agreement_schedule ias
		WHERE
			ias.ia_id = ia.ia_id AND
			ias.ia_dt_due >= (
				isnull((select date_missed_since from ia_report_missed_options), '01/02/1753')
			) AND
			ias.ia_dt_due < GETDATE() AND
			(
				ias.ia_dt_pd IS NULL OR
				ISNULL(ias.ia_amt_pd, 0) < ISNULL(ias.ia_amt_due, 0)
			)
		)
	, 0) AS num_missed

FROM bill
INNER JOIN installment_agreement_bill_assoc iaba ON
	bill.bill_id = iaba.bill_id
INNER JOIN dbo.installment_agreement ia ON
	iaba.ia_id = ia.ia_id
INNER JOIN property ON
	bill.prop_id = property.prop_id
INNER JOIN account ON
	ia.ia_acct_id = account.acct_id
WHERE     (ia.ia_status = 'A') AND (ISNULL
                          ((SELECT     COUNT(ias.ia_dt_due)
                              FROM         installment_agreement_schedule ias
                              WHERE     ias.ia_id = ia.ia_id AND ias.ia_dt_due < GETDATE() AND (ias.ia_dt_pd IS NULL OR
                                                    (ISNULL(ias.ia_amt_pd, 0) < ISNULL(ias.ia_amt_due, 0)))), 0) > 0)
ORDER BY contact_name, ia.ia_id, dbo.bill.prop_id

GO

