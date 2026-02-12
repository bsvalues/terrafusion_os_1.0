

CREATE VIEW dbo.fee_payment_vw
AS
SELECT     dbo.payment.payment_id AS payment_payment_id, dbo.payment.batch_id AS payment_batch_id, dbo.batch.description AS batch_desc, 
                      dbo.payment.void_payment, dbo.payment.void_date, dbo.payment.amt_due, dbo.payment.cash_amt, dbo.payment.check_amt, dbo.payment.mo_amt, 
                      dbo.payment.cash_amt + dbo.payment.check_amt + dbo.payment.mo_amt AS amt_paid, dbo.payment.payment_type, dbo.payment.payment_code, 
                      dbo.payment.rcpt_num, dbo.payment.payee_id, dbo.payment.operator_id, dbo.pacs_user.pacs_user_name AS operator_user_name, 
                      dbo.pacs_user.full_name AS operator_full_name, dbo.payment.date_paid, dbo.payment.post_date, dbo.payment.dl_number, dbo.payment.dl_state, 
                      dbo.payment.dl_exp_date, dbo.payment.check_num, dbo.payment.mo_num, dbo.payment_trans.transaction_id, dbo.payment_trans.fee_id, 
                      dbo.account.first_name AS paid_by_first_name, dbo.account.last_name AS paid_by_last_name, dbo.account.file_as_name AS paid_by_name, 
                      dbo.payment.void_batch_id, batch1.description AS void_batch_desc, dbo.payment.void_by_id, pacs_user1.pacs_user_name AS void_by_user_name, 
                      pacs_user1.full_name AS void_by_full_name, dbo.payment.void_reason, dbo.payment_type.payment_desc AS payment_type_desc, 
                      dbo.payment_code.pay_type_desc AS payment_code_desc, dbo.payment.new_payment_id, dbo.payment.prev_payment_id, 
                      dbo.fee_acct_assoc.acct_id, dbo.payment_trans.fee_amt, dbo.fee.fee_id AS fee_fee_id, dbo.fee.[year], dbo.fee_tax_cert_assoc.tax_cert_num, 
                      dbo.fee.type_cd, dbo.fee_type.fee_type_desc, dbo.payment_trans.void_trans
FROM         dbo.fee LEFT OUTER JOIN
                      dbo.fee_acct_assoc ON dbo.fee.fee_id = dbo.fee_acct_assoc.fee_id INNER JOIN
                      dbo.payment INNER JOIN
                      dbo.payment_trans ON dbo.payment.payment_id = dbo.payment_trans.payment_id ON dbo.fee.fee_id = dbo.payment_trans.fee_id INNER JOIN
                      dbo.fee_type ON dbo.fee.type_cd = dbo.fee_type.fee_type_cd LEFT OUTER JOIN
                      dbo.fee_tax_cert_assoc ON dbo.fee.fee_id = dbo.fee_tax_cert_assoc.fee_id LEFT OUTER JOIN
                      dbo.batch ON dbo.payment.batch_id = dbo.batch.batch_id LEFT OUTER JOIN
                      dbo.payment_type ON dbo.payment.payment_type = dbo.payment_type.payment_cd LEFT OUTER JOIN
                      dbo.payment_code ON dbo.payment.payment_code = dbo.payment_code.pay_type_cd LEFT OUTER JOIN
                      dbo.pacs_user ON dbo.payment.operator_id = dbo.pacs_user.pacs_user_id LEFT OUTER JOIN
                      dbo.batch batch1 ON dbo.payment.void_batch_id = batch1.batch_id LEFT OUTER JOIN
                      dbo.pacs_user pacs_user1 ON dbo.payment.void_by_id = pacs_user1.pacs_user_id LEFT OUTER JOIN
                      dbo.account ON dbo.payment.payee_id = dbo.account.acct_id

GO

