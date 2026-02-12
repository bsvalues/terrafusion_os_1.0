


CREATE VIEW dbo.DistinctTaxserversVw
AS
SELECT DISTINCT 
    taxserver.taxserver_id, taxserver.taxserver_cd, 
    account.file_as_name
FROM account INNER JOIN
    taxserver ON account.acct_id = taxserver.taxserver_id

GO

