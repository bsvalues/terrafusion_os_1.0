



CREATE VIEW dbo.MORTGAGE_CO_VW
AS
SELECT mortgage_co.mortgage_co_id, account.file_as_name, 
    taxserver.taxserver_id, taxserver.taxserver_cd, 
    account1.file_as_name AS taxserver_file_as_name,
    mortgage_co.lender_num
FROM account account1 INNER JOIN
    taxserver ON 
    account1.acct_id = taxserver.taxserver_id RIGHT OUTER JOIN
    account INNER JOIN
    mortgage_co ON 
    account.acct_id = mortgage_co.mortgage_co_id ON 
    taxserver.taxserver_id = mortgage_co.taxserver_id

GO

