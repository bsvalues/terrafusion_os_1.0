

CREATE VIEW dbo.fee_payment_trans_vw
AS
SELECT     dbo.payment.post_date, dbo.payment.date_paid, dbo.payment_trans.transaction_id, dbo.payment_trans.payment_id, dbo.payment.payment_type, 
                      dbo.payment.void_by_id, dbo.payment.void_date, dbo.payment.void_payment, dbo.payment.void_reason, dbo.payment.void_batch_id, dbo.fee.fee_id, 
                      dbo.fee_acct_assoc.acct_id, dbo.payment_trans.fee_amt, dbo.fee.amt_due, dbo.payment_trans.void_trans, dbo.payment_trans.fee_due
FROM         dbo.payment_trans INNER JOIN
                      dbo.payment ON dbo.payment_trans.payment_id = dbo.payment.payment_id INNER JOIN
                      dbo.fee ON dbo.payment_trans.fee_id = dbo.fee.fee_id LEFT OUTER JOIN
                      dbo.fee_acct_assoc ON dbo.fee.fee_id = dbo.fee_acct_assoc.fee_id

GO

