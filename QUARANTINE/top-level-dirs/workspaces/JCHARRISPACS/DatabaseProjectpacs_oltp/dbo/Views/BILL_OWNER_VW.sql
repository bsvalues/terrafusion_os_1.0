








CREATE VIEW dbo.BILL_OWNER_VW
AS
SELECT DISTINCT 
    bill.owner_id, bill.prop_id, account.file_as_name
FROM bill INNER JOIN
    account ON bill.owner_id = account.acct_id

GO

