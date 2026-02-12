


CREATE VIEW dbo.batch_journal_collections_vw
AS
SELECT     dbo.batch_journal_collections.id, dbo.batch_journal_collections.trans_type, dbo.batch_journal_collections.journal_date, 
                      dbo.batch_journal_collections.entity_id, dbo.batch_journal_collections.m_n_o, dbo.batch_journal_collections.i_n_s, 
                      dbo.batch_journal_collections.penalty, dbo.batch_journal_collections.interest, dbo.batch_journal_collections.atty_fees, 
                      dbo.batch_journal_collections.overages, dbo.batch_journal_collections.tax_cert_fees, dbo.batch_journal_collections.misc_fees, 
                      dbo.batch_journal_collections.vit, dbo.entity.entity_cd
FROM         dbo.batch_journal_collections INNER JOIN
                      dbo.entity ON dbo.batch_journal_collections.entity_id = dbo.entity.entity_id

GO

