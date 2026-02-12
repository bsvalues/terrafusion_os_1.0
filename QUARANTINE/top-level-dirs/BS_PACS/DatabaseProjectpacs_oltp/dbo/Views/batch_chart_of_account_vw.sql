


CREATE VIEW dbo.batch_chart_of_account_vw
AS
SELECT     dbo.batch_chart_of_accounts.acct, dbo.batch_chart_of_accounts.acct_description, dbo.batch_chart_of_accounts.acct_id, 
                      dbo.batch_chart_of_accounts.bank_acct, dbo.batch_chart_of_accounts.comment, dbo.account.file_as_name, dbo.batch_chart_of_accounts.acct_num, 
                      dbo.batch_chart_of_accounts.check_line1, dbo.batch_chart_of_accounts.check_line2, dbo.batch_chart_of_accounts.check_line3, 
                      dbo.batch_chart_of_accounts.check_line4, dbo.batch_chart_of_accounts.ach_deposit
FROM         dbo.account RIGHT OUTER JOIN
                      dbo.batch_chart_of_accounts ON dbo.account.acct_id = dbo.batch_chart_of_accounts.acct_id

GO

