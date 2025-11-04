


CREATE VIEW dbo.batch_journal_distribution_detail_vw
AS
SELECT     dbo.batch_journal_distribution.id, dbo.batch_journal_distribution.trans_type, dbo.batch_journal_distribution.journal_date, 
                      dbo.batch_journal_distribution.acct, dbo.batch_journal_distribution.m_n_o, dbo.batch_journal_distribution.penalty, 
                      dbo.batch_journal_distribution.i_n_s, dbo.batch_journal_distribution.interest, dbo.batch_journal_distribution.atty_fees, 
                      dbo.batch_journal_distribution.overages, dbo.batch_journal_distribution.tax_cert_fees, dbo.batch_journal_distribution.misc_fees, 
                      dbo.batch_journal_distribution.vit, dbo.batch_journal_distribution.check_num, dbo.batch_journal_distribution.comment, 
                      dbo.batch_chart_of_accounts.acct_description, dbo.pacs_user.pacs_user_name
FROM         dbo.batch_journal_distribution INNER JOIN
                      dbo.batch_chart_of_accounts ON dbo.batch_journal_distribution.acct = dbo.batch_chart_of_accounts.acct INNER JOIN
                      dbo.pacs_user ON dbo.batch_journal_distribution.pacs_user_id = dbo.pacs_user.pacs_user_id

GO

