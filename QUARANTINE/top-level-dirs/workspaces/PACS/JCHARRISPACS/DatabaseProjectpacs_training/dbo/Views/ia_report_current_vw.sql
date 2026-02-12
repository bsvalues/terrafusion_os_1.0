

CREATE VIEW dbo.ia_report_current_vw
AS
SELECT DISTINCT TOP 100 PERCENT ia.ia_id, ISNULL(ia.ia_ref_num, '') AS ref_num, dbo.bill.prop_id, dbo.account.file_as_name AS contact_name,
                          (SELECT     MIN(ia_dt_due)
                            FROM          installment_agreement_schedule ias
                            WHERE      ias.ia_id = ia.ia_id) AS start_date,
                          (SELECT     MAX(ia_dt_due)
                            FROM          installment_agreement_schedule ias
                            WHERE      ias.ia_id = ia.ia_id) AS end_date,
		      ISNULL(ia.ia_payment_terms, '') AS terms,
		      ISNULL(ia.ia_payment_amt, 0) AS payment_amount, ISNULL
                          ((SELECT     COUNT(ias.ia_dt_due)
                              FROM         installment_agreement_schedule ias
                              WHERE     ias.ia_id = ia.ia_id), 0) AS num_installments, ISNULL
                          ((SELECT     COUNT(ias.ia_dt_due)
                              FROM         installment_agreement_schedule ias
                              WHERE     ias.ia_id = ia.ia_id AND ias.ia_dt_due >= GETDATE()), 0) AS num_remaining, ISNULL
                          ((SELECT     COUNT(ias.ia_dt_due)
                              FROM         installment_agreement_schedule ias
                              WHERE     ias.ia_id = ia.ia_id AND ias.ia_dt_due < GETDATE() AND (ias.ia_dt_pd IS NULL OR (ISNULL(ias.ia_amt_pd, 0) < ISNULL(ias.ia_amt_due, 0)))), 0) AS num_missed, ISNULL
                          ((SELECT     SUM(ias.ia_amt_due)
                              FROM         installment_agreement_schedule ias
                              WHERE     ias.ia_id = ia.ia_id), 0) AS total_due, ISNULL
                          ((SELECT     SUM(ias.ia_amt_pd)
                              FROM         installment_agreement_schedule ias
                              WHERE     ias.ia_id = ia.ia_id), 0) AS total_paid
FROM         dbo.bill INNER JOIN
                      dbo.installment_agreement_bill_assoc iaba ON dbo.bill.bill_id = iaba.bill_id INNER JOIN
                      dbo.installment_agreement ia ON iaba.ia_id = ia.ia_id INNER JOIN
                      dbo.property ON dbo.bill.prop_id = dbo.property.prop_id INNER JOIN
                      dbo.account ON ia.ia_acct_id = dbo.account.acct_id
WHERE     (ia.ia_status = 'A')
ORDER BY contact_name, ia.ia_id, dbo.bill.prop_id

GO

