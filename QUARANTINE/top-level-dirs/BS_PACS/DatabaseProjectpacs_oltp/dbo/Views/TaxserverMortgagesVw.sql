



CREATE VIEW dbo.TaxserverMortgagesVw
AS
SELECT mortgage_co.mortgage_co_id, account.file_as_name, 
    mortgage_co.taxserver_id
FROM account INNER JOIN
    mortgage_co ON 
    account.acct_id = mortgage_co.mortgage_co_id

GO

