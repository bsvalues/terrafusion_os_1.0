



CREATE VIEW dbo.transfer_stmnt_mortgage_prop_vw
AS
SELECT account.acct_id AS mortgage_company_id, 
    account.file_as_name AS mortgage_company, 
    mortgage_assoc.mortgage_acct_id, mortgage_assoc.prop_id, 
    IsNull(mortgage_co.taxserver_id, 0) as taxserver_id
FROM mortgage_assoc INNER JOIN
    account ON 
    mortgage_assoc.mortgage_co_id = account.acct_id INNER JOIN
    mortgage_co ON 
    mortgage_assoc.mortgage_co_id = mortgage_co.mortgage_co_id

GO

