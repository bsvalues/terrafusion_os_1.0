


CREATE VIEW dbo.REFUND_PAID_VW
AS
SELECT refund.date_refunded, account.file_as_name, 
    refund.refund_amt, refund.check_num, 
    pacs_user.pacs_user_name, refund.refund_id, 
    refund.void_date, refund.refund_type, 
    account.confidential_file_as_name, 
    account.confidential_first_name, 
    account.confidential_last_name
FROM pacs_user INNER JOIN
    account INNER JOIN
    refund ON account.acct_id = refund.payee_id ON 
    pacs_user.pacs_user_id = refund.operator_id

GO

