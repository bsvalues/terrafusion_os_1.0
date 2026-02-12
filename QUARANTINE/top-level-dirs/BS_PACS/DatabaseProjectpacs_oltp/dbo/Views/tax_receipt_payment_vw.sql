


CREATE VIEW dbo.tax_receipt_payment_vw
AS
SELECT payment.payment_id, payment.batch_id, 
    payment.check_num, payment.mo_num, payment.check_amt, 
    payment.cash_amt, payment.mo_amt, payment.payment_type, 
    payment.payment_code, payment.rcpt_num, 
    payment.operator_id, payment.post_date, payment.paid_by, 
    payment.payee_id, account.file_as_name, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.addr_zip, 
    pacs_user.pacs_user_name
FROM payment INNER JOIN
    account ON payment.payee_id = account.acct_id INNER JOIN
    pacs_user ON 
    payment.operator_id = pacs_user.pacs_user_id LEFT OUTER JOIN
    address ON account.acct_id = address.acct_id

GO

