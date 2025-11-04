


CREATE VIEW dbo.MORTGAGE_PAYMENT_RUN_VW
AS
SELECT mortgage_payment_run.mortgage_run_id, 
    mortgage_payment_run.payee_id, 
    mortgage_payment_run.check_amt, 
    mortgage_payment_run.check_num, 
    mortgage_payment_run.pacs_user_id, 
    pacs_user.pacs_user_name, account.file_as_name, 
    COUNT(mortgage_payment.prop_id) AS count_prop_id, 
    SUM(mortgage_payment.amt_pd) AS sum_amt_pd, 
    SUM(mortgage_payment.pacs_base_tax) 
    AS sum_pacs_base_tax, mortgage_payment.status, 
    mortgage_payment_run.status AS mortgage_payment_run_status,
     mortgage_payment_run.updated_date, 
    mortgage_payment_run.paid_date
FROM mortgage_payment_run LEFT OUTER JOIN
    account ON 
    mortgage_payment_run.payee_id = account.acct_id LEFT OUTER
     JOIN
    pacs_user ON 
    mortgage_payment_run.pacs_user_id = pacs_user.pacs_user_id
     LEFT OUTER JOIN
    mortgage_payment ON 
    mortgage_payment_run.mortgage_run_id = mortgage_payment.mortgage_run_id
GROUP BY mortgage_payment_run.mortgage_run_id, 
    mortgage_payment_run.payee_id, 
    mortgage_payment_run.check_amt, 
    mortgage_payment_run.check_num, 
    mortgage_payment_run.pacs_user_id, 
    pacs_user.pacs_user_name, account.file_as_name, 
    mortgage_payment.status, mortgage_payment_run.status, 
    mortgage_payment_run.updated_date, 
    mortgage_payment_run.paid_date

GO

